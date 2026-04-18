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
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary italic heading-underline">Agenda</h1>
        <button
          onClick={onNewAppointment}
          className="btn-gold hidden lg:flex items-center gap-2 shrink-0"
        >
          <Plus size={16} /> Novo Agendamento
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-sidebar border border-border rounded-xl p-1">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cn(
                'px-3 sm:px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all',
                v === 'week' && 'hidden lg:inline-block',
                view === v
                  ? 'bg-gold text-sidebar shadow-[0_1px_8px_rgba(201,168,76,0.35)]'
                  : 'text-muted hover:text-primary',
              )}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-sidebar border border-border rounded-xl px-2 sm:px-3 py-2 flex-1 sm:flex-none">
          <button
            onClick={() => onNavigate('prev')}
            className="p-1 hover:text-gold text-muted transition-colors rounded shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] font-bold uppercase tracking-wider flex-1 sm:min-w-[160px] text-center text-primary capitalize truncate">
            {periodLabel}
          </span>
          <button
            onClick={() => onNavigate('next')}
            className="p-1 hover:text-gold text-muted transition-colors rounded shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={onToday}
          className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest bg-sidebar border border-border rounded-xl text-muted hover:text-gold hover:border-gold/30 transition-all"
        >
          Hoje
        </button>
      </div>

      {barbers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          <button
            onClick={() => onSelectedBarberChange('all')}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all',
              selectedBarberId === 'all'
                ? 'bg-gold/15 border-gold/40 text-gold shadow-[0_0_12px_rgba(201,168,76,0.12)]'
                : 'bg-sidebar border-border text-muted hover:text-primary hover:border-border2',
            )}
          >
            <CalendarIcon size={12} />
            Todos
            <span className="text-[9px] font-mono opacity-60">({appointments.length})</span>
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
                  'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all',
                  active
                    ? cn('border', color.border, color.bg, color.text, 'ring-1', color.ring)
                    : 'bg-sidebar border-border text-muted hover:text-primary hover:border-border2',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', color.dot)} />
                <span className="max-w-[120px] truncate normal-case tracking-normal">{b.name}</span>
                <span className="text-[9px] font-mono opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
