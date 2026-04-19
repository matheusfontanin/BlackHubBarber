import React from 'react';

interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

type OpeningHours = Record<string, DayHours>;

interface OpeningHoursEditorProps {
  value?: OpeningHours;
  onChange: (value: OpeningHours) => void;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const INPUT_CLS = "px-3 py-2 bg-bg border border-primary/8 rounded-lg outline-none focus:border-secondary text-sm font-medium disabled:opacity-40";

export function OpeningHoursEditor({ value = {}, onChange }: OpeningHoursEditorProps) {
  const update = (day: string, patch: Partial<DayHours>) => {
    const current = value[day] ?? { open: '09:00', close: '18:00', closed: false };
    onChange({ ...value, [day]: { ...current, ...patch } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const dayHours = value[key] ?? { open: '09:00', close: '18:00', closed: false };
        const closed = dayHours.closed ?? false;
        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 p-3 bg-bg/60 border border-primary/[0.06] rounded-xl"
          >
            <span className="text-sm font-semibold text-primary">{label}</span>
            <input
              type="time"
              disabled={closed}
              value={dayHours.open ?? ''}
              onChange={e => update(key, { open: e.target.value })}
              className={INPUT_CLS}
            />
            <input
              type="time"
              disabled={closed}
              value={dayHours.close ?? ''}
              onChange={e => update(key, { close: e.target.value })}
              className={INPUT_CLS}
            />
            <label className="flex items-center gap-2 text-xs text-primary/60">
              <input
                type="checkbox"
                checked={closed}
                onChange={e => update(key, { closed: e.target.checked })}
                className="accent-secondary"
              />
              Fechado
            </label>
          </div>
        );
      })}
    </div>
  );
}
