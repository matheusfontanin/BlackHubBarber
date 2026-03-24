import React from 'react';
import { motion } from 'motion/react';
import { Check, Rocket, Sparkles, ShieldCheck } from 'lucide-react';

interface FinalStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function FinalStep({ onComplete, onBack }: FinalStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-serif text-primary">Tudo pronto!</h2>
        <p className="text-primary/60">Sua barbearia está configurada e pronta para decolar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="p-8 bg-white border border-primary/10 rounded-2xl shadow-sm space-y-6 relative overflow-hidden group">
          <div className="space-y-2">
            <h3 className="text-xl font-serif text-primary">Plano Essencial</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">R$ 0</span>
              <span className="text-xs text-primary/40 font-bold uppercase tracking-widest">/ mês</span>
            </div>
          </div>
          
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-primary/70">
              <Check size={16} className="text-secondary" />
              <span>Até 50 agendamentos/mês</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-primary/70">
              <Check size={16} className="text-secondary" />
              <span>IA de atendimento básica</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-primary/70">
              <Check size={16} className="text-secondary" />
              <span>Google Calendar Sync</span>
            </li>
          </ul>

          <button
            onClick={onComplete}
            className="w-full py-3 border border-primary/10 rounded-lg text-sm font-bold text-primary hover:bg-primary/[0.02] transition-all"
          >
            Começar Grátis
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-8 bg-primary text-white border border-primary rounded-2xl shadow-xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-4 right-4 bg-secondary text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
            Recomendado
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-serif">Plano Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$ 97</span>
              <span className="text-xs opacity-50 font-bold uppercase tracking-widest">/ mês</span>
            </div>
          </div>
          
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm opacity-90">
              <Sparkles size={16} className="text-secondary" />
              <span>Agendamentos ilimitados</span>
            </li>
            <li className="flex items-center gap-3 text-sm opacity-90">
              <Sparkles size={16} className="text-secondary" />
              <span>IA Avançada (RAG)</span>
            </li>
            <li className="flex items-center gap-3 text-sm opacity-90">
              <Sparkles size={16} className="text-secondary" />
              <span>Campanhas de Marketing</span>
            </li>
            <li className="flex items-center gap-3 text-sm opacity-90">
              <Sparkles size={16} className="text-secondary" />
              <span>Suporte Prioritário</span>
            </li>
          </ul>

          <button
            onClick={onComplete}
            className="w-full py-3 bg-secondary text-primary rounded-lg text-sm font-bold hover:scale-[1.02] transition-all active:scale-95"
          >
            Assinar Agora
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 pt-8 border-t border-primary/5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/30">
          <ShieldCheck size={14} /> Pagamento Seguro
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/30">
          <Rocket size={14} /> Ativação Imediata
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="text-primary/30 text-xs font-bold hover:text-primary transition-colors"
        >
          Voltar e revisar dados
        </button>
      </div>
    </motion.div>
  );
}
