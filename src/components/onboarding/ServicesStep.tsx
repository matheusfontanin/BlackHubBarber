import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import { Scissors, Clock, DollarSign, Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service } from '@/types/onboarding';

interface ServicesStepProps {
  onNext: (services: Service[]) => void;
  onBack: () => void;
}

// Nota: onNext recebe o array de serviços diretamente.
// O OnboardingPage faz o wrap em { services: [...] }.

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Corte de Cabelo', price: 50, duration: 30 },
  { id: '2', name: 'Barba', price: 30, duration: 20 },
  { id: '3', name: 'Corte & Barba', price: 70, duration: 50 },
];

interface NewServiceInput {
  name: string;
  price: string;
  duration: number;
}

export default function ServicesStep({ onNext, onBack }: ServicesStepProps) {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState<NewServiceInput>({ name: '', price: '', duration: 30 });

  const addService = (): void => {
    if (newService.name && newService.price !== '' && newService.duration > 0) {
      // Clean price string to float
      const cleanPrice = parseFloat(newService.price.replace(/[^\d.,]/g, '').replace(',', '.'));

      const service: Service = { 
        ...newService,
        price: cleanPrice, 
        id: Math.random().toString(36).substr(2, 9) 
      };
      setServices([...services, service]);
      setNewService({ name: '', price: '', duration: 30 });
      setIsAdding(false);
    }
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-serif text-primary">Seus Serviços</h2>
        <p className="text-primary/60">Quais serviços você oferece? Você poderá editá-los depois.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {services.map((service) => (
            <motion.div
              key={service.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-4 bg-white border border-primary/10 rounded-xl shadow-sm group hover:border-secondary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary/5 rounded-full flex items-center justify-center text-secondary">
                  <Scissors size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-primary">{service.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-primary/40 font-mono">
                    <span className="flex items-center gap-1"><Clock size={12} /> {service.duration} min</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> R$ {service.price}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeService(service.id)}
                className="p-2 text-primary/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-xl space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Nome do serviço</label>
                <input
                  autoFocus
                  className="w-full bg-white border border-secondary/20 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="Ex: Degradê"
                  value={newService.name}
                  onChange={e => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Duração (min)</label>
                <input
                  type="number"
                  className="w-full bg-white border border-secondary/20 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="30"
                  value={newService.duration}
                  onChange={e => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Preço (R$)</label>
                <IMaskInput
                  mask="R$ num"
                  blocks={{
                    num: {
                      mask: Number,
                      thousandsSeparator: '.',
                      padFractionalZeros: true,
                      normalizeZeros: true,
                      radix: ',',
                      mapToRadix: ['.'],
                      scale: 2
                    }
                  }}
                  className="w-full bg-white border border-secondary/20 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-secondary/40"
                  placeholder="R$ 50,00"
                  value={newService.price}
                  onAccept={(value: string) => setNewService({ ...newService, price: value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-bold text-primary/40 hover:text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addService}
                className="bg-secondary text-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Check size={14} /> Adicionar
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/10 rounded-xl text-primary/30 hover:text-secondary hover:border-secondary/30 hover:bg-secondary/5 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-widest">Adicionar outro serviço</span>
          </button>
        )}
      </div>

      <div className="pt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-primary/50 font-bold hover:text-primary transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={() => onNext(services)}
          disabled={services.length === 0}
          className="bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </motion.div>
  );
}
