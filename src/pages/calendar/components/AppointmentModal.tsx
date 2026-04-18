import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, Calendar as CalendarIcon, Check, Clock, Loader2,
  Scissors, Sparkles, User, X,
} from 'lucide-react';
import { addMinutes, format, parseISO, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  Appointment, AppointmentStatus, ClientPreferences, Customer, Service,
} from '@/services/crudService';
import type { Barber } from '@/types/settings';
import { STATUS_LABELS } from '../constants';

type SavePayload = Omit<Appointment, 'id' | 'clients' | 'services' | 'barbers'>;

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  initialDate?: string;
  initialTime?: string;
  initialBarberId?: string;
  customers: Customer[];
  services: Service[];
  barbers: Barber[];
  tenantId: string;
  onSave: (payload: SavePayload, id?: string) => Promise<void>;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}

const STATUS_KEYS = Object.keys(STATUS_LABELS) as AppointmentStatus[];

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  initialDate,
  initialTime,
  initialBarberId,
  customers,
  services,
  barbers,
  tenantId,
  onSave,
  onStatusChange,
}: AppointmentModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [appointmentBarberId, setAppointmentBarberId] = useState('');
  const [modalStatus, setModalStatus] = useState<AppointmentStatus>('scheduled');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (appointment) {
      setSelectedCustomer(appointment.client_id ?? '');
      setSelectedService(appointment.service_id ?? '');
      setAppointmentDate(format(parseISO(appointment.starts_at), 'yyyy-MM-dd'));
      setAppointmentTime(format(parseISO(appointment.starts_at), 'HH:mm'));
      setAppointmentNotes(appointment.notes ?? '');
      setAppointmentBarberId(appointment.barber_id ?? '');
      setModalStatus(appointment.status);
    } else {
      setSelectedCustomer('');
      setSelectedService('');
      setAppointmentNotes('');
      setModalStatus('scheduled');
      setAppointmentDate(initialDate ?? format(new Date(), 'yyyy-MM-dd'));
      setAppointmentTime(initialTime ?? '09:00');
      setAppointmentBarberId(initialBarberId ?? '');
    }
    setFormError(null);
  }, [isOpen, appointment, initialDate, initialTime, initialBarberId]);

  useEffect(() => {
    if (appointment) setModalStatus(appointment.status);
  }, [appointment]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedCustomer || !selectedService || !appointmentDate || !appointmentTime) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    const service = services.find((s) => s.id === selectedService);
    if (!service) return;
    setIsSaving(true);
    try {
      const [h, m] = appointmentTime.split(':').map(Number);
      const startTime = setMinutes(setHours(new Date(appointmentDate + 'T00:00:00'), h), m);
      const endTime = addMinutes(startTime, service.duration_minutes);
      const payload: SavePayload = {
        tenant_id: tenantId,
        client_id: selectedCustomer,
        service_id: selectedService,
        barber_id: appointmentBarberId || undefined,
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        status: modalStatus,
        notes: appointmentNotes || undefined,
        source: 'manual',
      };
      await onSave(payload, appointment?.id);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar agendamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusClick = async (s: AppointmentStatus) => {
    setModalStatus(s);
    if (appointment?.id) {
      await onStatusChange(appointment.id, s);
    }
  };

  const customerPrefs = (() => {
    if (!selectedCustomer) return null;
    const cust = customers.find((c) => c.id === selectedCustomer);
    const prefs = cust?.preferences as ClientPreferences | undefined;
    if (!prefs || Object.keys(prefs).length === 0) return null;
    return prefs;
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="bg-bg border-t sm:border border-border2 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />

            <div className="bg-sidebar border-b border-border px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
                  <CalendarIcon size={15} className="text-gold" />
                </div>
                <h3 className="font-heading font-bold text-lg text-primary italic">
                  {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
              </div>
              <button onClick={onClose} className="text-muted hover:text-primary transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3.5 bg-red-950/60 border border-red-500/20 text-error text-xs font-bold rounded-xl">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="label-xs"><User size={11} /> Cliente *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input-dark"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="label-xs"><Scissors size={11} /> Serviço *</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="input-dark"
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — R$ {Number(s.price).toFixed(2)} ({s.duration_minutes}min)
                    </option>
                  ))}
                </select>
              </div>

              {barbers.length > 0 && (
                <div className="space-y-1">
                  <label className="label-xs"><User size={11} /> Barbeiro</label>
                  <select
                    value={appointmentBarberId}
                    onChange={(e) => setAppointmentBarberId(e.target.value)}
                    className="input-dark"
                  >
                    <option value="">Sem preferência</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}{b.role ? ` — ${b.role}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-xs"><CalendarIcon size={11} /> Data *</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="input-dark font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-xs"><Clock size={11} /> Horário *</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="input-dark font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="label-xs">Observações</label>
                <textarea
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={2}
                  className="input-dark resize-none"
                  placeholder="Ex: Prefere tesoura, alergia a produto X..."
                />
              </div>

              {customerPrefs && (
                <div className="bg-gold/5 border border-gold/15 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Sparkles size={10} /> Preferências do Cliente
                  </p>
                  <div className="space-y-1.5">
                    {customerPrefs.corte_preferido && (
                      <p className="text-xs text-primary flex items-center gap-2">
                        <span className="text-gold">💇</span> <span className="text-faint font-bold">Corte:</span> {customerPrefs.corte_preferido}
                      </p>
                    )}
                    {customerPrefs.barba && (
                      <p className="text-xs text-primary flex items-center gap-2">
                        <span className="text-gold">🧔</span> <span className="text-faint font-bold">Barba:</span> {customerPrefs.barba}
                      </p>
                    )}
                    {customerPrefs.barbeiro_favorito && (
                      <p className="text-xs text-primary flex items-center gap-2">
                        <span className="text-gold">⭐</span> <span className="text-faint font-bold">Barbeiro fav.:</span> {customerPrefs.barbeiro_favorito}
                      </p>
                    )}
                    {customerPrefs.alergias && customerPrefs.alergias.length > 0 && (
                      <p className="text-xs text-orange-300 flex items-center gap-2">
                        <span>⚠️</span> <span className="text-faint font-bold">Alergias:</span> {customerPrefs.alergias.join(', ')}
                      </p>
                    )}
                    {customerPrefs.observacoes && (
                      <p className="text-xs text-muted flex items-center gap-2">
                        <span className="text-gold">📝</span> {customerPrefs.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="label-xs">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_KEYS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusClick(s)}
                      className={cn(
                        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all',
                        modalStatus === s
                          ? 'border-gold bg-gold/15 text-gold shadow-[0_0_8px_rgba(201,168,76,0.2)]'
                          : 'border-border text-faint hover:text-muted hover:border-border2',
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 mt-1"
              >
                {isSaving
                  ? <Loader2 className="animate-spin" size={18} />
                  : <><Check size={16} /> {appointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}</>
                }
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
