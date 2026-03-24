import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths,
  isToday,
  parseISO,
  setHours,
  setMinutes,
  addMinutes,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { crudService, Appointment, Customer, Service } from '@/services/crudService';
import { useAuth } from '@/contexts/AuthContext';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date, hour: number } | null>(null);
  
  // Form State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { user, isDev } = useAuth();
  const tenantId = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    fetchData();
  }, [currentDate, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00'Z'");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd'T'23:59:59'Z'");
      
      const [apps, custs, servs] = await Promise.all([
        crudService.getAppointments(tenantId, start, end),
        crudService.getCustomers(tenantId),
        crudService.getServices(tenantId)
      ]);

      setAppointments(apps);
      setCustomers(custs);
      setServices(servs);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = (date: Date, hour: number) => {
    setSelectedSlot({ date, hour });
    setAppointmentTime(format(setHours(setMinutes(date, 0), hour), "HH:mm"));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedCustomer || !selectedService) return;

    setIsSaving(true);
    try {
      const service = services.find(s => s.id === selectedService);
      if (!service) return;

      const startTime = setHours(setMinutes(selectedSlot.date, parseInt(appointmentTime.split(':')[1])), parseInt(appointmentTime.split(':')[0]));
      const endTime = addMinutes(startTime, service.duration);

      await crudService.createAppointment({
        tenant_id: tenantId,
        customer_id: selectedCustomer,
        service_id: selectedService,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        source: 'manual'
      });

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  });

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif italic mb-2">Agenda</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg p-1 border border-[#141414]/5 shadow-sm">
              <button 
                onClick={() => setView('day')}
                className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all", view === 'day' ? "bg-[#141414] text-[#E4E3E0]" : "opacity-40")}
              >Dia</button>
              <button 
                onClick={() => setView('week')}
                className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all", view === 'week' ? "bg-[#141414] text-[#E4E3E0]" : "opacity-40")}
              >Semana</button>
              <button 
                onClick={() => setView('month')}
                className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all", view === 'month' ? "bg-[#141414] text-[#E4E3E0]" : "opacity-40")}
              >Mês</button>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-[#141414]/5 shadow-sm">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-[#E4E3E0]/50 rounded transition-colors"><ChevronLeft size={16}/></button>
              <span className="text-xs font-bold uppercase tracking-widest min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-[#E4E3E0]/50 rounded transition-colors"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </header>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-[#141414]/5 shadow-xl overflow-hidden">
        {/* Header Days */}
        <div className="grid grid-cols-8 border-b border-[#141414]/5">
          <div className="p-4 border-r border-[#141414]/5 bg-[#E4E3E0]/20"></div>
          {weekDays.map(day => (
            <div key={day.toString()} className={cn(
              "p-4 text-center border-r border-[#141414]/5 last:border-r-0",
              isToday(day) && "bg-secondary/5"
            )}>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                "text-xl font-mono font-bold",
                isToday(day) && "text-secondary"
              )}>
                {format(day, 'dd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-8 h-[600px] overflow-y-auto relative">
          {/* Time Column */}
          <div className="border-r border-[#141414]/5 bg-[#E4E3E0]/10">
            {HOURS.map(hour => (
              <div key={hour} className="h-20 p-2 text-right border-b border-[#141414]/5">
                <span className="text-[10px] font-mono font-bold opacity-30">{hour}:00</span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map(day => (
            <div key={day.toString()} className="relative border-r border-[#141414]/5 last:border-r-0">
              {HOURS.map(hour => (
                <div 
                  key={hour} 
                  onClick={() => handleAddAppointment(day, hour)}
                  className="h-20 border-b border-[#141414]/5 hover:bg-secondary/5 transition-colors cursor-pointer group"
                >
                  <div className="opacity-0 group-hover:opacity-100 p-2 flex justify-end">
                    <Plus size={12} className="text-secondary" />
                  </div>
                </div>
              ))}

              {/* Appointments */}
              {appointments.filter(app => isSameDay(parseISO(app.start_time), day)).map(app => {
                const start = parseISO(app.start_time);
                const top = (start.getHours() - 8) * 80 + (start.getMinutes() / 60) * 80;
                const duration = (parseISO(app.end_time).getTime() - start.getTime()) / (1000 * 60);
                const height = (duration / 60) * 80;

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    className="absolute left-1 right-1 bg-[#141414] text-[#E4E3E0] p-2 rounded-lg shadow-lg z-10 overflow-hidden group cursor-pointer border-l-4 border-secondary"
                  >
                    <p className="text-[10px] font-bold truncate">{app.customers?.name}</p>
                    <p className="text-[8px] opacity-50 uppercase tracking-tighter truncate">{app.services?.name}</p>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check size={10} className="text-secondary" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-[#141414] p-6 text-[#E4E3E0] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="text-secondary" size={20} />
                  <h3 className="font-serif italic text-xl">Novo Agendamento</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      <User size={12} /> Cliente
                    </label>
                    <select 
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      <Scissors size={12} /> Serviço
                    </label>
                    <select 
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold"
                      required
                    >
                      <option value="">Selecione um serviço</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                        <CalendarIcon size={12} /> Data
                      </label>
                      <div className="w-full px-4 py-3 bg-[#E4E3E0]/10 border border-[#141414]/5 rounded-lg text-sm font-mono opacity-50">
                        {selectedSlot ? format(selectedSlot.date, 'dd/MM/yyyy') : '-'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                        <Clock size={12} /> Horário
                      </label>
                      <input 
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-[#141414] text-[#E4E3E0] rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      Confirmar Agendamento
                      <Check size={18} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
