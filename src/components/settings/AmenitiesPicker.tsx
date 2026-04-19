import React from 'react';
import { Wifi, Beer, Coffee, Tv, Car, Snowflake, CreditCard, Baby } from 'lucide-react';

interface Amenity {
  key: string;
  label: string;
  icon: React.ElementType;
}

const OPTIONS: Amenity[] = [
  { key: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { key: 'cerveja', label: 'Cerveja', icon: Beer },
  { key: 'cafe', label: 'Café', icon: Coffee },
  { key: 'tv', label: 'TV', icon: Tv },
  { key: 'estacionamento', label: 'Estacionamento', icon: Car },
  { key: 'ar-condicionado', label: 'Ar-condicionado', icon: Snowflake },
  { key: 'cartao', label: 'Aceita cartão', icon: CreditCard },
  { key: 'infantil', label: 'Atende crianças', icon: Baby },
];

interface AmenitiesPickerProps {
  value?: string[];
  onChange: (value: string[]) => void;
}

export function AmenitiesPicker({ value = [], onChange }: AmenitiesPickerProps) {
  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter(v => v !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {OPTIONS.map(({ key, label, icon: Icon }) => {
        const active = value.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
              active
                ? 'border-secondary bg-secondary/5 text-primary'
                : 'border-primary/[0.06] bg-bg/60 text-primary/60 hover:border-primary/10'
            }`}
          >
            <Icon size={16} className={active ? 'text-secondary' : 'text-primary/40'} />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
