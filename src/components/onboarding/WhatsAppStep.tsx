import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, CheckCircle2, RefreshCw, Loader2, Wifi } from 'lucide-react';
import { buildInstanceName, createInstance, getQRCode, getConnectionState } from '@/services/evolutionApi';

interface WhatsAppStepProps {
  phone?: string;
  onNext: (data?: { whatsappInstanceName?: string }) => void;
  onBack: () => void;
}

type Status = 'idle' | 'creating' | 'waiting_qr' | 'waiting_scan' | 'connected' | 'error';

export default function WhatsAppStep({ phone, onNext, onBack }: WhatsAppStepProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const instanceName = phone ? buildInstanceName(phone) : null;

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startConnection = async () => {
    if (!instanceName) {
      setErrorMsg('Número de telefone não encontrado. Volte e preencha o telefone da barbearia.');
      setStatus('error');
      return;
    }

    setStatus('creating');
    setErrorMsg(null);
    setQrBase64(null);

    try {
      await createInstance(instanceName);
      setStatus('waiting_qr');

      // Tenta pegar QR por até 15s
      let attempts = 0;
      const maxAttempts = 10;
      const qrInterval = setInterval(async () => {
        attempts++;
        const qr = await getQRCode(instanceName);
        if (qr?.base64) {
          clearInterval(qrInterval);
          setQrBase64(qr.base64);
          setStatus('waiting_scan');
          startPollingConnection();
        } else if (attempts >= maxAttempts) {
          clearInterval(qrInterval);
          setStatus('error');
          setErrorMsg('Tempo esgotado ao gerar QR Code. Tente novamente.');
        }
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Erro ao conectar com a Evolution API.');
    }
  };

  const startPollingConnection = () => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      if (!instanceName) return;
      const state = await getConnectionState(instanceName);
      if (state === 'open') {
        stopPolling();
        setStatus('connected');
      }
    }, 3000);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleSkip = () => {
    stopPolling();
    onNext();
  };

  const handleConfirm = () => {
    stopPolling();
    onNext({ whatsappInstanceName: instanceName ?? undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-serif text-primary">Conectar WhatsApp</h2>
        <p className="text-primary/60">Sua IA precisa de um número para atender seus clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Instruções */}
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              'Abra o WhatsApp no seu celular.',
              'Toque em Aparelhos Conectados e depois em Conectar um Aparelho.',
              'Aponte a câmera para o QR Code ao lado.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 mt-1">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-primary/70" dangerouslySetInnerHTML={{ __html: text }} />
              </div>
            ))}
          </div>

          <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-secondary">
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Benefícios</span>
            </div>
            <ul className="text-xs text-primary/60 space-y-1 list-disc list-inside">
              <li>Atendimento automático 24/7</li>
              <li>Agendamento direto na conversa</li>
              <li>Lembretes de consulta automáticos</li>
            </ul>
          </div>
        </div>

        {/* QR Code Area */}
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-primary/10 rounded-2xl shadow-sm space-y-6">
          {status === 'idle' && (
            <button
              onClick={startConnection}
              className="flex items-center gap-3 bg-secondary text-primary font-bold px-8 py-4 rounded-lg shadow hover:scale-[1.02] active:scale-95 transition-all"
            >
              <MessageSquare size={20} />
              Gerar QR Code
            </button>
          )}

          {(status === 'creating' || status === 'waiting_qr') && (
            <div className="text-center space-y-3">
              <Loader2 className="animate-spin text-secondary mx-auto" size={40} />
              <p className="text-xs font-bold uppercase tracking-widest text-primary/40">
                {status === 'creating' ? 'Criando instância...' : 'Gerando QR Code...'}
              </p>
            </div>
          )}

          {status === 'waiting_scan' && qrBase64 && (
            <div className="text-center space-y-4">
              <img
                src={qrBase64}
                alt="QR Code WhatsApp"
                className="w-48 h-48 rounded-xl border border-primary/10 mx-auto"
              />
              <div className="flex items-center justify-center gap-2 text-primary/40">
                <Loader2 className="animate-spin" size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Aguardando leitura...</span>
              </div>
              <button
                onClick={startConnection}
                className="flex items-center gap-2 text-xs font-bold text-secondary hover:underline mx-auto"
              >
                <RefreshCw size={14} /> Atualizar QR Code
              </button>
            </div>
          )}

          {status === 'connected' && (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Wifi className="text-green-600" size={32} />
              </div>
              <p className="font-bold text-green-700">WhatsApp conectado!</p>
              <p className="text-xs text-primary/50">Sua IA já pode atender seus clientes.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <p className="text-sm text-red-600 font-bold">{errorMsg}</p>
              <button
                onClick={startConnection}
                className="flex items-center gap-2 text-xs font-bold text-secondary hover:underline mx-auto"
              >
                <RefreshCw size={14} /> Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 flex items-center justify-between">
        <button onClick={onBack} className="text-primary/50 font-bold hover:text-primary transition-colors">
          Voltar
        </button>
        <div className="flex items-center gap-4">
          <button onClick={handleSkip} className="text-primary/30 text-xs font-bold hover:text-primary transition-colors">
            Pular por enquanto
          </button>
          <button
            onClick={handleConfirm}
            disabled={status === 'creating' || status === 'waiting_qr' || status === 'waiting_scan'}
            className="bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'connected' ? 'Continuar' : 'Pular por enquanto'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
