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
        <div className="fixed inset-0 bg-[#12100D]/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="bg-surface border border-line w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] shadow-floating overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="px-6 py-4 flex justify-between items-center border-b border-line">
              <h3 className="text-lg font-bold text-ink">
                {appointment ? 'Editar agendamento' : 'Novo agendamento'}
              </h3>
              <button onClick={onClose} aria-label="Fechar" className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-[#FDECEC] text-[#D84A4A] text-[13px] font-medium rounded-xl">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              <div>
                <label className="label"><User size={13} /> Cliente *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label"><Scissors size={13} /> Serviço *</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="input"
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
                <div>
                  <label className="label"><User size={13} /> Barbeiro</label>
                  <select
                    value={appointmentBarberId}
                    onChange={(e) => setAppointmentBarberId(e.target.value)}
                    className="input"
                  >
                    <option value="">Sem preferência</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}{b.role ? ` — ${b.role}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><CalendarIcon size={13} /> Data *</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label"><Clock size={13} /> Horário *</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Observações</label>
                <textarea
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={3}
                  className="input-textarea"
                  placeholder="Ex: prefere tesoura, alergia a produto X…"
                />
              </div>

              {customerPrefs && (
                <div className="bg-gold-soft/40 border border-[#9C7B47]/20 rounded-2xl p-4 space-y-1.5">
                  <p className="text-[12px] font-semibold text-gold-dark flex items-center gap-1.5">
                    <Sparkles size={12} /> Preferências do cliente
                  </p>
                  {customerPrefs.corte_preferido && (
                    <p className="text-[13px] text-ink">
                      <span className="text-ink-soft font-medium">Corte:</span> {customerPrefs.corte_preferido}
                    </p>
                  )}
                  {customerPrefs.barba && (
                    <p className="text-[13px] text-ink">
                      <span className="text-ink-soft font-medium">Barba:</span> {customerPrefs.barba}
                    </p>
                  )}
                  {customerPrefs.barbeiro_favorito && (
                    <p className="text-[13px] text-ink">
                      <span className="text-ink-soft font-medium">Barbeiro favorito:</span> {customerPrefs.barbeiro_favorito}
                    </p>
                  )}
                  {customerPrefs.alergias && customerPrefs.alergias.length > 0 && (
                    <p className="text-[13px] text-[#B67A18]">
                      <span className="font-medium">Alergias:</span> {customerPrefs.alergias.join(', ')}
                    </p>
                  )}
                  {customerPrefs.observacoes && (
                    <p className="text-[13px] text-ink-soft">{customerPrefs.observacoes}</p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_KEYS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusClick(s)}
                      className={cn(
                        'px-3 h-8 text-[12px] font-semibold rounded-lg border transition-colors',
                        modalStatus === s
                          ? 'border-[#BE9B64] bg-gold-soft text-gold-dark'
                          : 'border-line bg-white text-ink-soft hover:text-ink'
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="btn-primary w-full h-12 mt-2">
                {isSaving
                  ? <Loader2 className="animate-spin" size={18} />
                  : <><Check size={16} /> {appointment ? 'Salvar alterações' : 'Confirmar agendamento'}</>
                }
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
