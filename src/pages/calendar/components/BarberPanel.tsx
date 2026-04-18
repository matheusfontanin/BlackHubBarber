import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock,
  Calendar as CalendarIcon, Info, Loader2, Plus, Sparkles,
} from 'lucide-react';
import { addDays, format, isToday, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/services/crudService';
import { QUICK_ACTIONS, STATUS_BADGE, STATUS_LABELS } from '../constants';

interface BarberPanelProps {
  open: boolean;
  onToggle: () => void;
  panelDate: Date;
  onPanelDateChange: (d: Date) => void;
  appointments: Appointment[];
  pendingCount: number;
  updatingId: string | null;
  onEditAppointment: (app: Appointment) => void;
  onNewAppointment: (date: Date) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}

export function BarberPanel({
  open,
  onToggle,
  panelDate,
  onPanelDateChange,
  appointments,
  pendingCount,
  updatingId,
  onEditAppointment,
  onNewAppointment,
  onStatusChange,
}: BarberPanelProps) {
  return (
    <div className="shrink-0 w-full xl:w-80">
      <div className="bg-sidebar border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] xl:sticky xl:top-8">
        <div className="border-b border-border">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-gold" />
              </div>
              <div className="text-left">
                <p className="text-sm font-heading font-bold text-primary italic">Painel do Barbeiro</p>
                <p className="text-[10px] text-gold/60 uppercase tracking-wider font-semibold capitalize">
                  {format(panelDate, "d 'de' MMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold bg-gold/15 border border-gold/25 text-gold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {open ? <ChevronUp size={14} className="text-faint" /> : <ChevronDown size={14} className="text-faint" />}
            </div>
          </button>

          {open && (
            <div className="flex items-center justify-between px-5 pb-3">
              <button
                onClick={() => onPanelDateChange(subDays(panelDate, 1))}
                className="p-1 text-muted hover:text-gold transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted capitalize">
                {isToday(panelDate) ? '— Hoje —' : format(panelDate, 'EEEE', { locale: ptBR })}
              </span>
              <button
                onClick={() => onPanelDateChange(addDays(panelDate, 1))}
                className="p-1 text-muted hover:text-gold transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto max-h-[520px]"
            >
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                  <CalendarIcon size={28} className="text-faint mb-3" />
                  <p className="text-sm font-semibold text-muted">Sem agendamentos</p>
                  <p className="text-xs text-faint mt-1">Nenhum horário marcado para este dia.</p>
                  <button
                    onClick={() => onNewAppointment(panelDate)}
                    className="mt-4 text-xs font-bold text-gold hover:text-gold-light flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={12} /> Adicionar agendamento
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {appointments.map((app) => {
                    const isUpdating = updatingId === app.id;
                    const start = parseISO(app.starts_at);

                    return (
                      <div key={app.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold shrink-0 mt-0.5">
                            {app.clients?.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-primary truncate">{app.clients?.name}</p>
                              <button
                                onClick={() => onEditAppointment(app)}
                                title="Detalhes"
                                className="p-1 rounded-md text-faint hover:text-gold hover:bg-gold/10 transition-all shrink-0"
                              >
                                <Info size={13} />
                              </button>
                            </div>
                            <p className="text-[10px] text-muted truncate">{app.services?.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-faint flex items-center gap-1">
                                <Clock size={9} /> {format(start, 'HH:mm')}
                              </span>
                              <span className={cn(
                                'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                                STATUS_BADGE[app.status],
                              )}>
                                {STATUS_LABELS[app.status]}
                              </span>
                            </div>
                          </div>
                          {isUpdating && <Loader2 size={14} className="text-gold animate-spin shrink-0 mt-1" />}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_ACTIONS.filter((qa) => qa.status !== app.status).map((qa) => (
                            <button
                              key={qa.status}
                              disabled={isUpdating}
                              onClick={() => app.id && onStatusChange(app.id, qa.status)}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                                qa.classes,
                              )}
                            >
                              <qa.icon size={10} /> {qa.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {appointments.length > 0 && (
                <div className="border-t border-border p-4 space-y-2 bg-sidebar/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Resumo do dia</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Total de horários</span>
                    <span className="font-mono font-bold text-primary">{appointments.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Concluídos</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {appointments.filter((a) => a.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Faturamento estimado</span>
                    <span className="font-mono font-bold text-gold">
                      R$ {appointments
                        .filter((a) => a.status !== 'canceled' && a.status !== 'no_show')
                        .reduce((sum, a) => sum + Number(a.services?.price ?? 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
