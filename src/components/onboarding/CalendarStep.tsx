import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

interface CalendarStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function CalendarStep({ onNext, onBack }: CalendarStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-serif text-primary">Sincronizar Agenda</h2>
        <p className="text-primary/60">Conecte seu Google Calendar para evitar conflitos de horário.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <p className="text-sm text-primary/70 leading-relaxed">
            O BarberFlow lê sua disponibilidade em tempo real e insere novos agendamentos automaticamente na sua agenda pessoal ou profissional.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-primary/80">
              <CheckCircle2 size={18} className="text-secondary" />
              <span>Sincronização bidirecional</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-primary/80">
              <CheckCircle2 size={18} className="text-secondary" />
              <span>Bloqueio automático de horários ocupados</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-primary/80">
              <CheckCircle2 size={18} className="text-secondary" />
              <span>Notificações de novos agendamentos</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-10 bg-white border border-primary/10 rounded-2xl shadow-sm space-y-6">
          <div className="w-20 h-20 bg-primary/[0.02] border border-primary/5 rounded-2xl flex items-center justify-center text-primary/20">
            <Calendar size={40} />
          </div>
          
          <button className="w-full flex items-center justify-center gap-3 bg-white border border-primary/10 text-primary font-bold py-4 rounded-lg hover:bg-primary/[0.02] transition-all shadow-sm">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Conectar com Google
          </button>
          
          <p className="text-[10px] text-center text-primary/40 leading-tight">
            Ao conectar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
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
            Continuar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
