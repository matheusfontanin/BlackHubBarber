import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, MessageCircle, Calendar, Webhook, QrCode, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase/client';
import { handleError, handleSuccess } from '@/lib/errors';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

function WhatsAppModal({ isOpen, onClose, tenantId }: WhatsAppModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'scanning' | 'connected'>('idle');
  const [error, setError] = useState<string | null>(null);

  const startConnection = async () => {
    if (!phoneNumber.trim()) return;

    setStatus('connecting');
    setError(null);

    try {
      // Call Edge Function to create instance
      const { data, error } = await supabase.functions.invoke('evolution-connect', {
        body: { tenantId, phoneNumber: phoneNumber.trim() },
      });

      if (error) throw error;

      setQrCode(data.qrCode);
      setStatus('scanning');

      // Poll for status
      const pollStatus = async () => {
        try {
          const { data: statusData } = await supabase.functions.invoke('evolution-status', {
            body: { tenantId },
          });

          if (statusData.status === 'open') {
            setStatus('connected');
            handleSuccess('WhatsApp conectado com sucesso!');
            setTimeout(() => onClose(), 2000);
          } else {
            setTimeout(pollStatus, 2000); // Poll every 2 seconds
          }
        } catch (err) {
          setError('Erro ao verificar status');
        }
      };

      pollStatus();
    } catch (err) {
      setError('Erro ao iniciar conexão');
      setStatus('idle');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-sidebar border border-border rounded-2xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-primary">Conectar WhatsApp</h3>
          <button onClick={onClose} className="text-muted hover:text-primary">✕</button>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Número do WhatsApp *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl"
              />
            </div>
            <button
              onClick={startConnection}
              disabled={!phoneNumber.trim()}
              className="w-full btn-primary"
            >
              <QrCode size={16} className="mr-2" />
              Gerar QR Code
            </button>
          </div>
        )}

        {status === 'connecting' && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-gold mx-auto mb-4" size={32} />
            <p className="text-primary">Criando instância...</p>
          </div>
        )}

        {status === 'scanning' && qrCode && (
          <div className="text-center space-y-4">
            <p className="text-primary mb-4">Escaneie o QR Code com o WhatsApp</p>
            <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="mx-auto border border-border rounded-lg" />
            <p className="text-sm text-muted">Abra WhatsApp → Configurações → WhatsApp Web</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center py-8">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <p className="text-primary font-bold">Conectado!</p>
            <p className="text-sm text-muted mt-2">Sua IA começará a responder mensagens automaticamente.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function IntegrationsSettingsSection() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    if (tenantId) loadStatus();
  }, [tenantId]);

  const loadStatus = async () => {
    try {
      // Check WhatsApp status
      const { data: profile } = await supabase
        .from('tenant_business_profile')
        .select('whatsapp_number')
        .eq('tenant_id', tenantId)
        .single();

      if (profile?.whatsapp_number) {
        // Check if connected via Edge Function
        const { data: statusData } = await supabase.functions.invoke('evolution-status', {
          body: { tenantId },
        });
        setWhatsappStatus(statusData?.status === 'open' ? 'connected' : 'disconnected');
      }
    } catch (err) {
      console.error('Error loading status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WhatsApp Card */}
      <div className="bg-sidebar border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/25 flex items-center justify-center">
              <MessageCircle size={20} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-primary">WhatsApp Business</h3>
              <p className="text-sm text-muted">Conecte sua IA para responder mensagens automaticamente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {whatsappStatus === 'connected' ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <AlertCircle size={16} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${whatsappStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
              {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted">
            Ao conectar, nossa IA começará a responder mensagens automaticamente conforme suas configurações.
          </p>

          <button
            onClick={() => setWhatsappModal(true)}
            className="btn-primary"
          >
            <QrCode size={16} className="mr-2" />
            {whatsappStatus === 'connected' ? 'Reconectar' : 'Conectar via QR Code'}
          </button>
        </div>
      </div>

      {/* Google Calendar Card */}
      <div className="bg-sidebar border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <Calendar size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-primary">Google Calendar</h3>
              <p className="text-sm text-muted">Sincronize agendamentos com seu calendário</p>
            </div>
          </div>
          <AlertCircle size={16} className="text-red-500" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted">
            Em breve: sincronização automática de agendamentos.
          </p>
          <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
            Em breve
          </button>
        </div>
      </div>

      {/* N8N Card */}
      <div className="bg-sidebar border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
              <Webhook size={20} className="text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-primary">N8N</h3>
              <p className="text-sm text-muted">Orquestração de mensagens e IA</p>
            </div>
          </div>
          <CheckCircle size={16} className="text-green-500" />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted">
            Sistema de automação configurado e ativo.
          </p>
          <div className="text-xs text-muted">
            Webhook: https://your-project.supabase.co/functions/v1/n8n-webhook
          </div>
        </div>
      </div>

      <WhatsAppModal
        isOpen={whatsappModal}
        onClose={() => setWhatsappModal(false)}
        tenantId={tenantId!}
      />
    </div>
  );
}
