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
      <div className="card overflow-hidden xl:sticky xl:top-8">
        <div className="border-b border-line">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FBFAF8] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-gold-dark" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-ink">Painel do Barbeiro</p>
                <p className="text-[12px] text-ink-soft capitalize">
                  {format(panelDate, "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="text-[11px] font-semibold bg-gold-soft text-gold-dark px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {open ? <ChevronUp size={15} className="text-ink-faint" /> : <ChevronDown size={15} className="text-ink-faint" />}
            </div>
          </button>

          {open && (
            <div className="flex items-center justify-between px-5 pb-3">
              <button
                onClick={() => onPanelDateChange(subDays(panelDate, 1))}
                aria-label="Dia anterior"
                className="p-1.5 text-ink-soft hover:text-ink transition-colors rounded-lg"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[12px] font-semibold text-ink-soft capitalize">
                {isToday(panelDate) ? 'Hoje' : format(panelDate, 'EEEE', { locale: ptBR })}
              </span>
              <button
                onClick={() => onPanelDateChange(addDays(panelDate, 1))}
                aria-label="Próximo dia"
                className="p-1.5 text-ink-soft hover:text-ink transition-colors rounded-lg"
              >
                <ChevronRight size={15} />
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
              className="overflow-y-auto max-h-[560px]"
            >
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7F6F4] flex items-center justify-center mb-3">
                    <CalendarIcon size={22} className="text-ink-soft" />
                  </div>
                  <p className="text-sm font-semibold text-ink">Sem agendamentos</p>
                  <p className="text-[12px] text-ink-soft mt-1">Nenhum horário marcado para este dia.</p>
                  <button
                    onClick={() => onNewAppointment(panelDate)}
                    className="btn-ghost mt-4"
                  >
                    <Plus size={13} /> Adicionar agendamento
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EEEA]">
                  {appointments.map((app) => {
                    const isUpdating = updatingId === app.id;
                    const start = parseISO(app.starts_at);

                    return (
                      <div key={app.id} className="p-4 hover:bg-[#FBFAF8] transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-gold-soft text-gold-dark flex items-center justify-center text-[12px] font-semibold shrink-0 mt-0.5">
                            {app.clients?.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-ink truncate">{app.clients?.name}</p>
                              <button
                                onClick={() => onEditAppointment(app)}
                                title="Detalhes"
                                className="btn-icon w-7 h-7"
                              >
                                <Info size={13} />
                              </button>
                            </div>
                            <p className="text-[12px] text-ink-soft truncate">{app.services?.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[12px] text-ink-faint flex items-center gap-1">
                                <Clock size={11} /> {format(start, 'HH:mm')}
                              </span>
                              <span className={cn(
                                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
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
                                'inline-flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                                qa.classes,
                              )}
                            >
                              <qa.icon size={11} /> {qa.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {appointments.length > 0 && (
                <div className="border-t border-line p-4 space-y-2 bg-[#FBFAF8]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Resumo do dia</p>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-soft">Total de horários</span>
                    <span className="font-semibold text-ink">{appointments.length}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-soft">Concluídos</span>
                    <span className="font-semibold text-[#11895C]">
                      {appointments.filter((a) => a.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-soft">Faturamento estimado</span>
                    <span className="font-semibold text-ink">
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
