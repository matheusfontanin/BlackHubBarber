import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bot, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export interface AiStepData {
  assistantName: string;
  toneOfVoice: string;
  serviceStyle: string;
  businessSummary: string;
  targetAudience: string;
  differentiators: string;
  importantNotes: string;
}

interface AiStepProps {
  onNext: (data: AiStepData) => void;
  onBack: () => void;
}

const INPUT_CLS = "w-full px-4 py-3 bg-white border border-primary/10 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";

const TONES = [
  { value: 'profissional', emoji: '👔', label: 'Profissional', desc: 'Formal e confiável' },
  { value: 'descontraído', emoji: '😎', label: 'Descontraído', desc: 'Amigável e casual' },
  { value: 'premium', emoji: '✨', label: 'Premium', desc: 'Sofisticado e elegante' },
];

const STYLES = [
  { value: 'direto', emoji: '🎯', label: 'Direto', desc: 'Vai ao ponto' },
  { value: 'consultivo', emoji: '💡', label: 'Consultivo', desc: 'Sugere e orienta' },
  { value: 'acolhedor', emoji: '🤝', label: 'Acolhedor', desc: 'Empático e caloroso' },
];

export default function AiStep({ onNext, onBack }: AiStepProps) {
  const [form, setForm] = useState<AiStepData>({
    assistantName: '',
    toneOfVoice: 'profissional',
    serviceStyle: 'direto',
    businessSummary: '',
    targetAudience: '',
    differentiators: '',
    importantNotes: '',
  });

  const update = (field: keyof AiStepData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center">
        <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
          <Bot size={28} className="text-secondary" />
        </div>
        <h2 className="text-3xl font-serif text-primary">Seu Assistente IA</h2>
        <p className="text-primary/60 max-w-md mx-auto">
          Configure a personalidade do seu assistente virtual. Ele vai atender seus clientes pelo WhatsApp.
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        {/* Assistant Name */}
        <div>
          <label className={LABEL_CLS}>Nome do Assistente</label>
          <input
            type="text"
            value={form.assistantName}
            onChange={e => update('assistantName', e.target.value)}
            placeholder="Ex: Luna, Max, Alex..."
            className={INPUT_CLS}
          />
          <p className="text-[10px] text-primary/30 mt-1">O nome que a IA usará para se apresentar aos clientes</p>
        </div>

        {/* Tone */}
        <div>
          <label className={LABEL_CLS}>Tom de Voz</label>
          <div className="grid grid-cols-3 gap-3">
            {TONES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => update('toneOfVoice', t.value)}
                className={`p-3 rounded-xl border text-center transition-all ${form.toneOfVoice === t.value
                  ? 'border-secondary bg-secondary/5 shadow-sm scale-[1.02]'
                  : 'border-primary/[0.06] bg-white hover:border-primary/10'
                  }`}
              >
                <span className="text-xl block mb-1">{t.emoji}</span>
                <p className="text-xs font-bold text-primary">{t.label}</p>
                <p className="text-[10px] text-primary/35">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className={LABEL_CLS}>Estilo de Atendimento</label>
          <div className="grid grid-cols-3 gap-3">
            {STYLES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => update('serviceStyle', s.value)}
                className={`p-3 rounded-xl border text-center transition-all ${form.serviceStyle === s.value
                  ? 'border-secondary bg-secondary/5 shadow-sm scale-[1.02]'
                  : 'border-primary/[0.06] bg-white hover:border-primary/10'
                  }`}
              >
                <span className="text-xl block mb-1">{s.emoji}</span>
                <p className="text-xs font-bold text-primary">{s.label}</p>
                <p className="text-[10px] text-primary/35">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Context fields */}
        <div className="space-y-3 pt-3 border-t border-primary/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-secondary" />
            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-wider">Contexto do Negócio (opcional)</span>
          </div>
          <div>
            <label className={LABEL_CLS}>Descrição da Barbearia</label>
            <textarea value={form.businessSummary} onChange={e => update('businessSummary', e.target.value)} className={`${INPUT_CLS} resize-none`} rows={2} placeholder="Descreva brevemente sua barbearia para a IA" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Público-Alvo</label>
              <input type="text" value={form.targetAudience} onChange={e => update('targetAudience', e.target.value)} className={INPUT_CLS} placeholder="Jovens, executivos..." />
            </div>
            <div>
              <label className={LABEL_CLS}>Diferenciais</label>
              <input type="text" value={form.differentiators} onChange={e => update('differentiators', e.target.value)} className={INPUT_CLS} placeholder="Ambiente, produtos..." />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Observações Importantes</label>
            <textarea value={form.importantNotes} onChange={e => update('importantNotes', e.target.value)} className={`${INPUT_CLS} resize-none`} rows={2} placeholder="Informações que a IA deve saber (ex: não fazemos progressiva)" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center max-w-lg mx-auto pt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary/40 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button
          onClick={() => onNext(form)}
          className="flex items-center gap-2 bg-secondary text-primary font-bold px-8 py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95"
        >
          Continuar
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
