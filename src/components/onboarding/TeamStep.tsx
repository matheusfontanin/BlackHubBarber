import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';

export interface TeamBarber {
  name: string;
  role: string;
  specialties: string;
}

interface TeamStepProps {
  onNext: (barbers: TeamBarber[]) => void;
  onBack: () => void;
}

const INPUT_CLS = "w-full px-4 py-3 bg-white border border-primary/10 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";

export default function TeamStep({ onNext, onBack }: TeamStepProps) {
  const [barbers, setBarbers] = useState<TeamBarber[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('barbeiro');
  const [specialties, setSpecialties] = useState('');

  const addBarber = () => {
    if (!name.trim()) return;
    setBarbers(prev => [...prev, { name, role, specialties }]);
    setName('');
    setRole('barbeiro');
    setSpecialties('');
  };

  const removeBarber = (index: number) => {
    setBarbers(prev => prev.filter((_, i) => i !== index));
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
          <Users size={28} className="text-secondary" />
        </div>
        <h2 className="text-3xl font-serif text-primary">Sua Equipe</h2>
        <p className="text-primary/60 max-w-md mx-auto">
          Cadastre os barbeiros que fazem parte da sua equipe. Você pode pular e fazer isso depois.
        </p>
      </div>

      {/* Add form */}
      <div className="max-w-lg mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do barbeiro"
              className={INPUT_CLS}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBarber())}
            />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)} className={INPUT_CLS}>
            <option value="barbeiro">Barbeiro</option>
            <option value="barbeiro_senior">Barbeiro Sênior</option>
            <option value="aprendiz">Aprendiz</option>
            <option value="gerente">Gerente</option>
          </select>
          <input
            type="text"
            value={specialties}
            onChange={e => setSpecialties(e.target.value)}
            placeholder="Especialidades"
            className={INPUT_CLS}
          />
        </div>
        <button
          onClick={addBarber}
          disabled={!name.trim()}
          className="w-full py-3 border-2 border-dashed border-primary/10 rounded-xl text-sm font-semibold text-primary/40 hover:border-secondary hover:text-secondary transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Adicionar Barbeiro
        </button>
      </div>

      {/* Barbers list */}
      {barbers.length > 0 && (
        <div className="max-w-lg mx-auto space-y-2">
          {barbers.map((barber, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary/15 rounded-lg flex items-center justify-center text-xs font-bold text-secondary">
                  {barber.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{barber.name}</p>
                  <p className="text-[10px] text-primary/35">{barber.role}{barber.specialties ? ` • ${barber.specialties}` : ''}</p>
                </div>
              </div>
              <button onClick={() => removeBarber(i)} className="p-1.5 text-primary/20 hover:text-red-400 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center max-w-lg mx-auto pt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary/40 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button
          onClick={() => onNext(barbers)}
          className="flex items-center gap-2 bg-secondary text-primary font-bold px-8 py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95"
        >
          {barbers.length === 0 ? 'Pular' : 'Continuar'}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
