import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayHours {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

interface BusinessHoursStepProps {
  onNext: (hours: DayHours[]) => void;
  onBack: () => void;
}

const INITIAL_HOURS: DayHours[] = [
  { day: 'Segunda', isOpen: true, open: '09:00', close: '19:00' },
  { day: 'Terça', isOpen: true, open: '09:00', close: '19:00' },
  { day: 'Quarta', isOpen: true, open: '09:00', close: '19:00' },
  { day: 'Quinta', isOpen: true, open: '09:00', close: '19:00' },
  { day: 'Sexta', isOpen: true, open: '09:00', close: '20:00' },
  { day: 'Sábado', isOpen: true, open: '08:00', close: '18:00' },
  { day: 'Domingo', isOpen: false, open: '09:00', close: '13:00' },
];

export default function BusinessHoursStep({ onNext, onBack }: BusinessHoursStepProps) {
  const [hours, setHours] = useState<DayHours[]>(INITIAL_HOURS);

  const toggleDay = (index: number) => {
    const newHours = [...hours];
    newHours[index].isOpen = !newHours[index].isOpen;
    setHours(newHours);
  };

  const updateTime = (index: number, field: 'open' | 'close', value: string) => {
    const newHours = [...hours];
    newHours[index][field] = value;
    setHours(newHours);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-serif text-primary">Horário de Funcionamento</h2>
        <p className="text-primary/60">Quando seus clientes podem agendar?</p>
      </div>

      <div className="bg-white border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
        {hours.map((day, index) => (
          <div 
            key={day.day}
            className={cn(
              "flex flex-col md:flex-row items-center justify-between p-4 border-b border-primary/5 last:border-0 transition-colors",
              day.isOpen ? "bg-white" : "bg-primary/[0.02]"
            )}
          >
            <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
              <button
                onClick={() => toggleDay(index)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  day.isOpen ? "bg-secondary" : "bg-primary/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                  day.isOpen ? "left-7" : "left-1"
                )} />
              </button>
              <span className={cn(
                "font-bold text-sm uppercase tracking-widest",
                day.isOpen ? "text-primary" : "text-primary/30"
              )}>
                {day.day}
              </span>
            </div>

            <div className={cn(
              "flex items-center gap-3 transition-opacity",
              day.isOpen ? "opacity-100" : "opacity-20 pointer-events-none"
            )}>
              <div className="flex items-center gap-2 bg-primary/[0.03] border border-primary/5 rounded-lg px-3 py-2">
                <Clock size={14} className="text-primary/30" />
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => updateTime(index, 'open', e.target.value)}
                  className="bg-transparent text-sm font-mono outline-none"
                />
              </div>
              <span className="text-primary/30 text-xs font-bold">ATÉ</span>
              <div className="flex items-center gap-2 bg-primary/[0.03] border border-primary/5 rounded-lg px-3 py-2">
                <Clock size={14} className="text-primary/30" />
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => updateTime(index, 'close', e.target.value)}
                  className="bg-transparent text-sm font-mono outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-primary/50 font-bold hover:text-primary transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => onNext(hours)}
          className="bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95"
        >
          Continuar
        </button>
      </div>
    </motion.div>
  );
}
