import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/services/crudService';
import type { Barber } from '@/types/settings';
import type { CalendarView } from '../types';
import { barberColor } from '../utils';

interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  periodLabel: string;
  onNavigate: (dir: 'prev' | 'next') => void;
  onToday: () => void;
  onNewAppointment: () => void;
  barbers: Barber[];
  appointments: Appointment[];
  selectedBarberId: string;
  onSelectedBarberChange: (id: string) => void;
}

const VIEWS: CalendarView[] = ['day', 'week', 'month'];
const VIEW_LABEL: Record<CalendarView, string> = { day: 'Dia', week: 'Semana', month: 'Mês' };

export function CalendarHeader({
  view,
  onViewChange,
  periodLabel,
  onNavigate,
  onToday,
  onNewAppointment,
  barbers,
  appointments,
  selectedBarberId,
  onSelectedBarberChange,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-col gap-4 mb-5 lg:mb-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="page-eyebrow">Operação</p>
          <h1 className="page-title">Agenda</h1>
        </div>
        <button onClick={onNewAppointment} className="btn-primary hidden lg:inline-flex shrink-0">
          <Plus size={16} /> Novo agendamento
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="segmented">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cn(
                'segmented-item',
                v === 'week' && 'hidden lg:inline-block',
                view === v && 'segmented-item-active'
              )}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white border border-line rounded-xl px-2 h-10 flex-1 sm:flex-none">
          <button
            onClick={() => onNavigate('prev')}
            aria-label="Anterior"
            className="p-1.5 text-ink-soft hover:text-ink transition-colors rounded-lg shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] font-semibold flex-1 sm:min-w-[180px] text-center text-ink capitalize truncate">
            {periodLabel}
          </span>
          <button
            onClick={() => onNavigate('next')}
            aria-label="Próximo"
            className="p-1.5 text-ink-soft hover:text-ink transition-colors rounded-lg shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button onClick={onToday} className="btn-secondary h-10 px-4 text-[13px]">
          Hoje
        </button>
      </div>

      {barbers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => onSelectedBarberChange('all')}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-semibold transition-colors border',
              selectedBarberId === 'all'
                ? 'bg-[#12100D] text-white border-[#12100D]'
                : 'bg-white border-line text-ink-soft hover:text-ink'
            )}
          >
            <CalendarIcon size={12} />
            Todos
            <span className="text-[11px] opacity-70">({appointments.length})</span>
          </button>
          {barbers.map((b) => {
            const color = barberColor(b.id, barbers);
            const count = appointments.filter((a) => a.barber_id === b.id).length;
            const active = selectedBarberId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => onSelectedBarberChange(b.id!)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-semibold transition-colors border',
                  active
                    ? cn(color.border, color.bg, color.text)
                    : 'bg-white border-line text-ink-soft hover:text-ink'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
                <span className="max-w-[140px] truncate">{b.name}</span>
                <span className="text-[11px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
