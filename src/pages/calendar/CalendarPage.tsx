import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, User, Scissors, X, Loader2, Check, AlertCircle,
  CheckCircle2, PlayCircle, XCircle, UserX, ChevronDown,
  ChevronUp, Sparkles,
} from 'lucide-react';
import {
  format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks,
  subWeeks, isToday, parseISO, setHours, setMinutes, addMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  crudService,
  Appointment,
  Customer,
  Service,
  AppointmentStatus,
} from '@/services/crudService';
import { useTenant } from '@/hooks/useTenant';

/* ─────────────────────────────────────────────────────── */
/* Constants                                               */
/* ─────────────────────────────────────────────────────── */

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:   'Agendado',
  confirmed:   'Confirmado',
  canceled:    'Cancelado',
  completed:   'Concluído',
  no_show:     'Não compareceu',
  in_progress: 'Em andamento',
};

/** Classes para o chip no grid do calendário */
const STATUS_CHIP: Record<AppointmentStatus, string> = {
  scheduled:   'border-gold/60 bg-gold/20 text-gold',
  confirmed:   'border-emerald-400/60 bg-emerald-950/80 text-emerald-300',
  canceled:    'border-red-400/40 bg-red-950/60 text-red-300 opacity-50',
  completed:   'border-white/10 bg-surface text-muted',
  no_show:     'border-orange-400/40 bg-orange-950/60 text-orange-300 opacity-50',
  in_progress: 'border-blue-400/60 bg-blue-950/80 text-blue-300',
};

/** Classes para badge pequeno no painel lateral */
const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled:   'bg-gold/10 text-gold border-gold/20',
  confirmed:   'bg-emerald-950/80 text-emerald-400 border-emerald-500/20',
  canceled:    'bg-red-950/80 text-red-400 border-red-500/20',
  completed:   'bg-surface2 text-muted border-border',
  no_show:     'bg-orange-950/80 text-orange-400 border-orange-500/20',
  in_progress: 'bg-blue-950/80 text-blue-400 border-blue-500/20',
};

type View = 'day' | 'week' | 'month';

/* ─────────────────────────────────────────────────────── */
/* Quick-action button config for the barber panel         */
/* ─────────────────────────────────────────────────────── */

type QuickAction = {
  status: AppointmentStatus;
  label: string;
  icon: React.ElementType;
  classes: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    status: 'confirmed',
    label: 'Confirmar',
    icon: Check,
    classes: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/60 hover:border-emerald-400/60',
  },
  {
    status: 'in_progress',
    label: 'Iniciar',
    icon: PlayCircle,
    classes: 'border-blue-500/30 text-blue-400 hover:bg-blue-950/60 hover:border-blue-400/60',
  },
  {
    status: 'completed',
    label: 'Concluir',
    icon: CheckCircle2,
    classes: 'border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60',
  },
  {
    status: 'no_show',
    label: 'Falta',
    icon: UserX,
    classes: 'border-orange-500/30 text-orange-400 hover:bg-orange-950/60 hover:border-orange-400/60',
  },
  {
    status: 'canceled',
    label: 'Cancelar',
    icon: XCircle,
    classes: 'border-red-500/30 text-red-400 hover:bg-red-950/60 hover:border-red-400/60',
  },
];

/* ─────────────────────────────────────────────────────── */
/* Component                                               */
/* ─────────────────────────────────────────────────────── */

export default function CalendarPage() {
  const { tenantId, loading: tenantLoading } = useTenant();

  // ── Calendar state ──
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // local status used only inside the modal (decoupled from selectedAppointment.status)
  const [modalStatus, setModalStatus] = useState<AppointmentStatus>('scheduled');

  // ── Barber panel state ──
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelDate, setPanelDate] = useState(new Date());
  // track which appointment is being status-updated (spinner feedback)
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* ── Data fetching ── */
  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      let start: string;
      let end: string;
      if (view === 'day') {
        start = format(currentDate, "yyyy-MM-dd'T'00:00:00'Z'");
        end   = format(currentDate, "yyyy-MM-dd'T'23:59:59'Z'");
      } else if (view === 'week') {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we = endOfWeek(currentDate, { weekStartsOn: 1 });
        start = format(ws, "yyyy-MM-dd'T'00:00:00'Z'");
        end   = format(we, "yyyy-MM-dd'T'23:59:59'Z'");
      } else {
        start = format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00'Z'");
        end   = format(endOfMonth(currentDate),   "yyyy-MM-dd'T'23:59:59'Z'");
      }
      const [apps, custs, servs] = await Promise.all([
        crudService.getAppointments(tenantId, start, end),
        crudService.getCustomers(tenantId),
        crudService.getServices(tenantId),
      ]);
      setAppointments(apps);
      setCustomers(custs);
      setServices(servs);
    } catch (err) {
      console.error('Erro ao buscar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, currentDate, view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Keep panelDate in sync with currentDate */
  useEffect(() => { setPanelDate(currentDate); }, [currentDate]);

  /* ── Navigation ── */
  const navigateDate = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (view === 'day')   return dir === 'prev' ? subDays(prev, 1)    : addDays(prev, 1);
      if (view === 'week')  return dir === 'prev' ? subWeeks(prev, 1)   : addWeeks(prev, 1);
      return                       dir === 'prev' ? subMonths(prev, 1)  : addMonths(prev, 1);
    });
  };

  /* ── Helpers ── */
  const periodLabel = () => {
    if (view === 'day')  return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate,   { weekStartsOn: 1 });
      return `${format(ws, 'd MMM', { locale: ptBR })} – ${format(we, 'd MMM yyyy', { locale: ptBR })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end:   endOfWeek(currentDate,   { weekStartsOn: 1 }),
  });

  /* ── Modal open/close ── */
  const openNewModal = (date?: Date, hour?: number) => {
    setSelectedAppointment(null);
    setSelectedCustomer('');
    setSelectedService('');
    setAppointmentNotes('');
    setFormError(null);
    setModalStatus('scheduled');
    setAppointmentDate(format(date ?? new Date(), 'yyyy-MM-dd'));
    setAppointmentTime(hour !== undefined ? `${String(hour).padStart(2, '0')}:00` : '09:00');
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appointment) => {
    setSelectedAppointment(app);
    setSelectedCustomer(app.client_id ?? '');
    setSelectedService(app.service_id ?? '');
    setAppointmentDate(format(parseISO(app.starts_at), 'yyyy-MM-dd'));
    setAppointmentTime(format(parseISO(app.starts_at), 'HH:mm'));
    setAppointmentNotes(app.notes ?? '');
    setModalStatus(app.status);   // ← seed modal-local status from appointment
    setFormError(null);
    setIsModalOpen(true);
  };

  /* ── Save form ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setFormError(null);
    if (!selectedCustomer || !selectedService || !appointmentDate || !appointmentTime) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    const service = services.find(s => s.id === selectedService);
    if (!service) return;
    setIsSaving(true);
    try {
      const [h, m] = appointmentTime.split(':').map(Number);
      const startTime = setMinutes(setHours(new Date(appointmentDate + 'T00:00:00'), h), m);
      const endTime   = addMinutes(startTime, service.duration_minutes);
      const payload = {
        tenant_id:  tenantId,
        client_id:  selectedCustomer,
        service_id: selectedService,
        starts_at:  startTime.toISOString(),
        ends_at:    endTime.toISOString(),
        status:     modalStatus,          // ← persist the locally-chosen status
        notes:      appointmentNotes || undefined,
        source:     'manual',
      };
      if (selectedAppointment?.id) {
        await crudService.updateAppointment(selectedAppointment.id, payload);
      } else {
        await crudService.createAppointment(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar agendamento.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Central status-update function used by BOTH the modal buttons
   * and the barber quick-action panel.
   *
   * FIX: updates `appointments` array AND syncs `modalStatus` state
   * so the highlights inside the modal reflect the change immediately.
   */
  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await crudService.updateAppointment(id, { status });

      // Update the main appointments list
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

      // FIX: if this appointment is open in the modal, sync modal-local status
      if (selectedAppointment?.id === id) {
        setModalStatus(status);
        setSelectedAppointment(prev => prev ? { ...prev, status } : prev);
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Panel appointments (for the selected panel date) ── */
  const panelAppointments = appointments
    .filter(a => isSameDay(parseISO(a.starts_at), panelDate))
    .sort((a, b) => parseISO(a.starts_at).getTime() - parseISO(b.starts_at).getTime());

  const panelPendingCount = panelAppointments.filter(
    a => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'in_progress'
  ).length;

  if (tenantLoading) return null;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="p-6 lg:p-8">

      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-heading font-bold text-primary italic heading-underline">Agenda</h1>
          <div className="flex flex-wrap items-center gap-2">

            {/* View toggle */}
            <div className="flex bg-sidebar border border-border rounded-xl p-1">
              {(['day', 'week', 'month'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all',
                    view === v
                      ? 'bg-gold text-sidebar shadow-[0_1px_8px_rgba(201,168,76,0.35)]'
                      : 'text-muted hover:text-primary',
                  )}
                >
                  {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1.5 bg-sidebar border border-border rounded-xl px-3 py-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1 hover:text-gold text-muted transition-colors rounded"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-bold uppercase tracking-wider min-w-[160px] text-center text-primary capitalize">
                {periodLabel()}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-1 hover:text-gold text-muted transition-colors rounded"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest bg-sidebar border border-border rounded-xl text-muted hover:text-gold hover:border-gold/30 transition-all"
            >
              Hoje
            </button>
          </div>
        </div>

        <button
          onClick={() => openNewModal()}
          className="btn-gold flex items-center gap-2"
        >
          <Plus size={16} /> Novo Agendamento
        </button>
      </header>

      {/* ── Main layout: calendar + right panel ── */}
      <div className="flex gap-5">

        {/* ── LEFT: Calendar grid ── */}
        <div className="flex-1 min-w-0">

          {/* Day / Week view */}
          {(view === 'day' || view === 'week') && (
            <div className="card overflow-hidden">
              {/* Day headers */}
              <div className={cn('grid border-b border-border', view === 'week' ? 'grid-cols-8' : 'grid-cols-2')}>
                <div className="p-4 border-r border-border bg-sidebar/50" />
                {(view === 'week' ? weekDays : [currentDate]).map(day => (
                  <button
                    key={day.toString()}
                    onClick={() => { setPanelDate(day); }}
                    className={cn(
                      'p-4 text-center border-r border-border last:border-r-0 transition-colors',
                      isToday(day) && 'bg-gold/5',
                      isSameDay(day, panelDate) && 'bg-gold/[0.07]',
                      'hover:bg-gold/[0.04] cursor-pointer',
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-widest font-bold text-faint mb-1">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={cn('text-xl font-mono font-bold', isToday(day) ? 'text-gold' : 'text-muted')}>
                      {format(day, 'dd')}
                    </p>
                    {/* dot indicator for appointments */}
                    {appointments.some(a => isSameDay(parseISO(a.starts_at), day)) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gold mx-auto mt-1 opacity-60" />
                    )}
                  </button>
                ))}
              </div>

              {/* Time grid */}
              <div className={cn('grid h-[600px] overflow-y-auto relative', view === 'week' ? 'grid-cols-8' : 'grid-cols-2')}>
                {/* Hour labels */}
                <div className="border-r border-border bg-sidebar/30">
                  {HOURS.map(hour => (
                    <div key={hour} className="h-20 p-2 text-right border-b border-border">
                      <span className="text-[10px] font-mono font-bold text-faint">{hour}:00</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {(view === 'week' ? weekDays : [currentDate]).map(day => (
                  <div key={day.toString()} className="relative border-r border-border last:border-r-0">
                    {HOURS.map(hour => (
                      <div
                        key={hour}
                        onClick={() => openNewModal(day, hour)}
                        className="h-20 border-b border-border hover:bg-gold/[0.03] transition-colors cursor-pointer group"
                      >
                        <div className="opacity-0 group-hover:opacity-100 p-2 flex justify-end">
                          <Plus size={11} className="text-gold" />
                        </div>
                      </div>
                    ))}

                    {/* Appointment chips */}
                    {appointments
                      .filter(app => isSameDay(parseISO(app.starts_at), day))
                      .map(app => {
                        const start    = parseISO(app.starts_at);
                        const top      = (start.getHours() - 8) * 80 + (start.getMinutes() / 60) * 80;
                        const duration = (parseISO(app.ends_at).getTime() - start.getTime()) / 60000;
                        const height   = Math.max((duration / 60) * 80, 28);

                        return (
                          <motion.div
                            key={app.id}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={e => { e.stopPropagation(); openEditModal(app); }}
                            className={cn(
                              'absolute left-1 right-1 p-2 rounded-lg shadow-md z-10',
                              'overflow-hidden cursor-pointer border-l-2 transition-all',
                              'hover:brightness-110 hover:shadow-lg',
                              STATUS_CHIP[app.status] ?? STATUS_CHIP.scheduled,
                            )}
                          >
                            <p className="text-[10px] font-bold leading-tight truncate">{app.clients?.name}</p>
                            <p className="text-[8px] opacity-70 uppercase tracking-tighter truncate">{app.services?.name}</p>
                            <p className="text-[8px] opacity-50 font-mono">{format(start, 'HH:mm')}</p>
                          </motion.div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month view */}
          {view === 'month' && (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="p-3 text-center text-[10px] font-bold uppercase tracking-widest text-faint border-r last:border-r-0 border-border">
                    {d}
                  </div>
                ))}
              </div>
              {(() => {
                const firstDay = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
                const lastDay  = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 1 });
                const days     = eachDayOfInterval({ start: firstDay, end: lastDay });
                const weeks: Date[][] = [];
                for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
                return weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
                    {week.map(day => {
                      const dayApps = appointments.filter(a => isSameDay(parseISO(a.starts_at), day));
                      const inMonth = day.getMonth() === currentDate.getMonth();
                      return (
                        <div
                          key={day.toString()}
                          onClick={() => { setCurrentDate(day); setView('day'); setPanelDate(day); }}
                          className={cn(
                            'min-h-[90px] p-2 border-r last:border-r-0 border-border cursor-pointer hover:bg-gold/[0.03] transition-colors',
                            !inMonth && 'opacity-30',
                            isToday(day) && 'bg-gold/5',
                          )}
                        >
                          <p className={cn('text-sm font-mono font-bold mb-1', isToday(day) ? 'text-gold' : 'text-muted')}>
                            {format(day, 'd')}
                          </p>
                          <div className="space-y-0.5">
                            {dayApps.slice(0, 3).map(app => (
                              <p key={app.id} className="text-[9px] font-bold bg-gold/10 border border-gold/20 text-gold rounded px-1 truncate">
                                {format(parseISO(app.starts_at), 'HH:mm')} {app.clients?.name}
                              </p>
                            ))}
                            {dayApps.length > 3 && (
                              <p className="text-[9px] text-gold/50 font-bold">+{dayApps.length - 3} mais</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={30} />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT PANEL — Barbeiro (quick status actions)
        ══════════════════════════════════════════════ */}
        <div className="shrink-0 w-72 xl:w-80">
          <div className="bg-sidebar border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] sticky top-8">

            {/* Panel header */}
            <div className="border-b border-border">
              <button
                onClick={() => setPanelOpen(o => !o)}
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
                  {panelPendingCount > 0 && (
                    <span className="text-[10px] font-bold bg-gold/15 border border-gold/25 text-gold px-2 py-0.5 rounded-full">
                      {panelPendingCount}
                    </span>
                  )}
                  {panelOpen ? <ChevronUp size={14} className="text-faint" /> : <ChevronDown size={14} className="text-faint" />}
                </div>
              </button>

              {/* Panel date nav */}
              {panelOpen && (
                <div className="flex items-center justify-between px-5 pb-3">
                  <button
                    onClick={() => setPanelDate(d => subDays(d, 1))}
                    className="p-1 text-muted hover:text-gold transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted capitalize">
                    {isToday(panelDate) ? '— Hoje —' : format(panelDate, 'EEEE', { locale: ptBR })}
                  </span>
                  <button
                    onClick={() => setPanelDate(d => addDays(d, 1))}
                    className="p-1 text-muted hover:text-gold transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Panel body */}
            <AnimatePresence>
              {panelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-y-auto max-h-[520px]"
                >
                  {panelAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
                      <CalendarIcon size={28} className="text-faint mb-3" />
                      <p className="text-sm font-semibold text-muted">Sem agendamentos</p>
                      <p className="text-xs text-faint mt-1">Nenhum horário marcado para este dia.</p>
                      <button
                        onClick={() => openNewModal(panelDate)}
                        className="mt-4 text-xs font-bold text-gold hover:text-gold-light flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={12} /> Adicionar agendamento
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {panelAppointments.map(app => {
                        const isUpdating = updatingId === app.id;
                        const start = parseISO(app.starts_at);

                        return (
                          <div key={app.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                            {/* Client info row */}
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold shrink-0 mt-0.5">
                                {app.clients?.name?.charAt(0).toUpperCase() ?? '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-primary truncate">{app.clients?.name}</p>
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

                            {/* Quick action buttons */}
                            <div className="flex flex-wrap gap-1.5">
                              {QUICK_ACTIONS.filter(qa => qa.status !== app.status).map(qa => (
                                <button
                                  key={qa.status}
                                  disabled={isUpdating}
                                  onClick={() => app.id && handleStatusChange(app.id, qa.status)}
                                  className={cn(
                                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold',
                                    'uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                                    qa.classes,
                                  )}
                                >
                                  <qa.icon size={10} /> {qa.label}
                                </button>
                              ))}
                              {/* Edit full modal */}
                              <button
                                onClick={() => openEditModal(app)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-bold uppercase tracking-wider text-faint hover:text-muted hover:border-border2 transition-all"
                              >
                                <Scissors size={10} /> Detalhes
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Panel footer summary */}
                  {panelAppointments.length > 0 && (
                    <div className="border-t border-border p-4 space-y-2 bg-sidebar/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Resumo do dia</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Total de horários</span>
                        <span className="font-mono font-bold text-primary">{panelAppointments.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Concluídos</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {panelAppointments.filter(a => a.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Faturamento estimado</span>
                        <span className="font-mono font-bold text-gold">
                          R$ {panelAppointments
                            .filter(a => a.status !== 'canceled' && a.status !== 'no_show')
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
      </div>

      {/* ══════════════════════════════════════════════
          MODAL — New / Edit appointment
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="bg-bg border border-border2 w-full max-w-md rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Gold bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />

              {/* Modal header */}
              <div className="bg-sidebar border-b border-border px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <CalendarIcon size={15} className="text-gold" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-primary italic">
                    {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-primary transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3.5 bg-red-950/60 border border-red-500/20 text-error text-xs font-bold rounded-xl">
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}

                {/* Cliente */}
                <div className="space-y-1">
                  <label className="label-xs"><User size={11} /> Cliente *</label>
                  <select
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                    className="input-dark"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Serviço */}
                <div className="space-y-1">
                  <label className="label-xs"><Scissors size={11} /> Serviço *</label>
                  <select
                    value={selectedService}
                    onChange={e => setSelectedService(e.target.value)}
                    className="input-dark"
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — R$ {Number(s.price).toFixed(2)} ({s.duration_minutes}min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data + Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="label-xs"><CalendarIcon size={11} /> Data *</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      className="input-dark font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label-xs"><Clock size={11} /> Horário *</label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={e => setAppointmentTime(e.target.value)}
                      className="input-dark font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-1">
                  <label className="label-xs">Observações</label>
                  <textarea
                    value={appointmentNotes}
                    onChange={e => setAppointmentNotes(e.target.value)}
                    rows={2}
                    className="input-dark resize-none"
                    placeholder="Ex: Prefere tesoura, alergia a produto X..."
                  />
                </div>

                {/* Status — visible for both new and existing (new defaults to scheduled) */}
                <div className="space-y-2">
                  <label className="label-xs">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={async () => {
                          // For existing appointments: persist immediately + update chip
                          if (selectedAppointment?.id) {
                            await handleStatusChange(selectedAppointment.id, s);
                          } else {
                            // For new appointments: just set local state
                            setModalStatus(s);
                          }
                        }}
                        className={cn(
                          'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all',
                          modalStatus === s   // ← reads from modalStatus, not selectedAppointment.status
                            ? 'border-gold bg-gold/15 text-gold shadow-[0_0_8px_rgba(201,168,76,0.2)]'
                            : 'border-border text-faint hover:text-muted hover:border-border2',
                        )}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 mt-1"
                >
                  {isSaving
                    ? <Loader2 className="animate-spin" size={18} />
                    : <><Check size={16} /> {selectedAppointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}</>
                  }
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
