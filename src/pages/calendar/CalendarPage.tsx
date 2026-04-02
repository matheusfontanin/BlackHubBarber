import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, User, Scissors, X, Loader2, Check, AlertCircle
} from 'lucide-react';
import {
  format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks,
  subWeeks, isToday, parseISO, setHours, setMinutes, addMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { crudService, Appointment, Customer, Service, AppointmentStatus } from '@/services/crudService';
import { useTenant } from '@/hooks/useTenant';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00–21:00

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  finished: 'Concluído',
  no_show: 'Não compareceu',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'border-secondary bg-primary',
  confirmed: 'border-green-400 bg-green-900',
  cancelled: 'border-red-400 bg-red-900 opacity-60',
  finished: 'border-primary/40 bg-primary/60',
  no_show: 'border-orange-400 bg-orange-900 opacity-60',
};

type View = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      let start: string;
      let end: string;
      if (view === 'day') {
        start = format(currentDate, "yyyy-MM-dd'T'00:00:00'Z'");
        end = format(currentDate, "yyyy-MM-dd'T'23:59:59'Z'");
      } else if (view === 'week') {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we = endOfWeek(currentDate, { weekStartsOn: 1 });
        start = format(ws, "yyyy-MM-dd'T'00:00:00'Z'");
        end = format(we, "yyyy-MM-dd'T'23:59:59'Z'");
      } else {
        start = format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00'Z'");
        end = format(endOfMonth(currentDate), "yyyy-MM-dd'T'23:59:59'Z'");
      }

      const [apps, custs, servs] = await Promise.all([
        crudService.getAppointments(tenantId, start, end),
        crudService.getCustomers(tenantId),
        crudService.getServices(tenantId),
      ]);

      setAppointments(apps);
      setCustomers(custs);
      setServices(servs);
    } catch (err: unknown) {
      console.error('Erro ao buscar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, currentDate, view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (view === 'day') return direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1);
      if (view === 'week') return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
      return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
    });
  };

  const openNewModal = (date?: Date, hour?: number) => {
    setSelectedAppointment(null);
    setSelectedCustomer('');
    setSelectedService('');
    setAppointmentNotes('');
    setFormError(null);
    setAppointmentDate(format(date ?? new Date(), 'yyyy-MM-dd'));
    setAppointmentTime(hour !== undefined ? `${String(hour).padStart(2, '0')}:00` : '09:00');
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appointment) => {
    setSelectedAppointment(app);
    setSelectedCustomer(app.client_id ?? '');
    setSelectedService(app.service_id ?? '');
    setAppointmentDate(format(parseISO(app.start_time), 'yyyy-MM-dd'));
    setAppointmentTime(format(parseISO(app.start_time), 'HH:mm'));
    setAppointmentNotes(app.notes ?? '');
    setFormError(null);
    setIsModalOpen(true);
  };

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
      const endTime = addMinutes(startTime, service.duration_minutes);

      const payload = {
        tenant_id: tenantId,
        client_id: selectedCustomer,
        service_id: selectedService,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled' as AppointmentStatus,
        notes: appointmentNotes || undefined,
        source: 'manual',
      };

      if (selectedAppointment?.id) {
        await crudService.updateAppointment(selectedAppointment.id, payload);
      } else {
        await crudService.createAppointment(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar agendamento.';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await crudService.updateAppointment(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err: unknown) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const periodLabel = () => {
    if (view === 'day') return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, 'd MMM', { locale: ptBR })} – ${format(we, 'd MMM yyyy', { locale: ptBR })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  };

  if (tenantLoading) return null;

  return (
    <div className="min-h-screen bg-bg text-primary font-sans p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-serif italic">Agenda</h1>
          <div className="flex flex-wrap items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-white rounded-lg p-1 border border-primary/5 shadow-sm">
              {(['day', 'week', 'month'] as View[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all",
                    view === v ? "bg-primary text-bg" : "opacity-40 hover:opacity-70")}
                >
                  {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>

            {/* Period navigation */}
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-primary/5 shadow-sm">
              <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-bg/50 rounded transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold uppercase tracking-widest min-w-[160px] text-center capitalize">
                {periodLabel()}
              </span>
              <button onClick={() => navigateDate('next')} className="p-1 hover:bg-bg/50 rounded transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <button onClick={() => { setCurrentDate(new Date()); }}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white rounded-lg border border-primary/5 shadow-sm opacity-50 hover:opacity-100 transition-opacity">
              Hoje
            </button>
          </div>
        </div>

        <button
          onClick={() => openNewModal()}
          className="bg-primary text-bg px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </header>

      {/* Calendar Grid (Day/Week view) */}
      {(view === 'day' || view === 'week') && (
        <div className="bg-white rounded-2xl border border-primary/5 shadow-xl overflow-hidden">
          {/* Day Headers */}
          <div className={cn("grid border-b border-primary/5", view === 'week' ? 'grid-cols-8' : 'grid-cols-2')}>
            <div className="p-4 border-r border-primary/5 bg-bg/20" />
            {(view === 'week' ? weekDays : [currentDate]).map(day => (
              <div key={day.toString()} className={cn("p-4 text-center border-r border-primary/5 last:border-r-0", isToday(day) && "bg-secondary/5")}>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={cn("text-xl font-mono font-bold", isToday(day) && "text-secondary")}>
                  {format(day, 'dd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className={cn("grid h-[640px] overflow-y-auto relative", view === 'week' ? 'grid-cols-8' : 'grid-cols-2')}>
            {/* Hours */}
            <div className="border-r border-primary/5 bg-bg/10">
              {HOURS.map(hour => (
                <div key={hour} className="h-20 p-2 text-right border-b border-primary/5">
                  <span className="text-[10px] font-mono font-bold opacity-30">{hour}:00</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {(view === 'week' ? weekDays : [currentDate]).map(day => (
              <div key={day.toString()} className="relative border-r border-primary/5 last:border-r-0">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    onClick={() => openNewModal(day, hour)}
                    className="h-20 border-b border-primary/5 hover:bg-secondary/5 transition-colors cursor-pointer group"
                  >
                    <div className="opacity-0 group-hover:opacity-100 p-2 flex justify-end">
                      <Plus size={12} className="text-secondary" />
                    </div>
                  </div>
                ))}

                {appointments
                  .filter(app => isSameDay(parseISO(app.start_time), day))
                  .map(app => {
                    const start = parseISO(app.start_time);
                    const top = (start.getHours() - 8) * 80 + (start.getMinutes() / 60) * 80;
                    const duration = (parseISO(app.end_time).getTime() - start.getTime()) / 60000;
                    const height = Math.max((duration / 60) * 80, 24);

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={(e) => { e.stopPropagation(); openEditModal(app); }}
                        className={cn(
                          "absolute left-1 right-1 text-bg p-2 rounded-lg shadow-lg z-10 overflow-hidden cursor-pointer border-l-4 transition-opacity",
                          STATUS_COLORS[app.status] ?? STATUS_COLORS.scheduled
                        )}
                      >
                        <p className="text-[10px] font-bold truncate">{app.clients?.name}</p>
                        <p className="text-[8px] opacity-60 uppercase tracking-tighter truncate">{app.services?.name}</p>
                        <p className="text-[8px] opacity-40">{format(start, 'HH:mm')}</p>
                      </motion.div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl border border-primary/5 shadow-xl overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-primary/5">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="p-3 text-center text-[10px] font-bold uppercase tracking-widest opacity-40 border-r last:border-r-0 border-primary/5">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {(() => {
            const firstDay = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
            const lastDay = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start: firstDay, end: lastDay });
            const weeks: Date[][] = [];
            for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

            return weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-primary/5 last:border-b-0">
                {week.map(day => {
                  const dayApps = appointments.filter(a => isSameDay(parseISO(a.start_time), day));
                  const inMonth = day.getMonth() === currentDate.getMonth();
                  return (
                    <div
                      key={day.toString()}
                      onClick={() => { setCurrentDate(day); setView('day'); }}
                      className={cn(
                        "min-h-[90px] p-2 border-r last:border-r-0 border-primary/5 cursor-pointer hover:bg-secondary/5 transition-colors",
                        !inMonth && "opacity-30",
                        isToday(day) && "bg-secondary/5"
                      )}
                    >
                      <p className={cn("text-sm font-mono font-bold mb-1", isToday(day) && "text-secondary")}>{format(day, 'd')}</p>
                      <div className="space-y-0.5">
                        {dayApps.slice(0, 3).map(app => (
                          <p key={app.id} className="text-[9px] font-bold bg-primary text-bg rounded px-1 truncate">
                            {format(parseISO(app.start_time), 'HH:mm')} {app.clients?.name}
                          </p>
                        ))}
                        {dayApps.length > 3 && (
                          <p className="text-[9px] opacity-40 font-bold">+{dayApps.length - 3} mais</p>
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
          <Loader2 className="animate-spin text-secondary" size={32} />
        </div>
      )}

      {/* Modal Agendamento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-primary p-6 text-bg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="text-secondary" size={20} />
                  <h3 className="font-serif italic text-xl">
                    {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg">
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                    <User size={12} /> Cliente *
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                    className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                    <Scissors size={12} /> Serviço *
                  </label>
                  <select
                    value={selectedService}
                    onChange={e => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      <CalendarIcon size={12} /> Data *
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      <Clock size={12} /> Horário *
                    </label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={e => setAppointmentTime(e.target.value)}
                      className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">
                    Observações
                  </label>
                  <textarea
                    value={appointmentNotes}
                    onChange={e => setAppointmentNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm resize-none"
                    placeholder="Ex: Prefere tesoura, alergia a produto X..."
                  />
                </div>

                {/* Status buttons para agendamentos existentes */}
                {selectedAppointment && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => selectedAppointment.id && handleStatusChange(selectedAppointment.id, s)}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 transition-all",
                            selectedAppointment.status === s
                              ? "border-secondary bg-secondary/10 text-primary"
                              : "border-primary/10 opacity-40 hover:opacity-70"
                          )}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-bg rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving
                    ? <Loader2 className="animate-spin" size={18} />
                    : <><Check size={18} /> {selectedAppointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}</>
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
