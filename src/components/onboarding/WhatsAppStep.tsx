import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, CheckCircle2, QrCode, ArrowRight, ExternalLink } from 'lucide-react';

interface WhatsAppStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WhatsAppStep({ onNext, onBack }: WhatsAppStepProps) {
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
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 mt-1">
                <span className="text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-primary/70">Abra o WhatsApp no seu celular.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 mt-1">
                <span className="text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-primary/70">Toque em <b>Aparelhos Conectados</b> e depois em <b>Conectar um Aparelho</b>.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 mt-1">
                <span className="text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-primary/70">Aponte a câmera para o QR Code ao lado.</p>
            </div>
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

        <div className="flex flex-col items-center justify-center p-8 bg-white border border-primary/10 rounded-2xl shadow-sm space-y-6">
          <div className="relative group">
            <div className="absolute -inset-4 bg-secondary/10 rounded-2xl blur-xl group-hover:bg-secondary/20 transition-all opacity-0 group-hover:opacity-100" />
            <div className="relative w-48 h-48 bg-primary/[0.02] border border-primary/5 rounded-xl flex items-center justify-center">
              <QrCode size={120} className="text-primary/20" />
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Gerando QR Code...</span>
                </div>
              </div>
            </div>
          </div>
          
          <button className="text-xs font-bold text-secondary flex items-center gap-2 hover:underline">
            <ExternalLink size={14} /> Problemas na conexão?
          </button>
        </div>
      </div>

      <div className="pt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-primary/50 font-bold hover:text-primary transition-colors"
        >
          Voltar
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={onNext}
            className="text-primary/30 text-xs font-bold hover:text-primary transition-colors"
          >
            Pular por enquanto
          </button>
          <button
            onClick={onNext}
            className="bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95"
          >
            Conectado
          </button>
        </div>
      </div>
    </motion.div>
  );
}
