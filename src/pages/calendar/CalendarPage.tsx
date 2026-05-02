import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, User, Scissors, X, Loader2, Check, AlertCircle,
  CheckCircle2, PlayCircle, XCircle, UserX, ChevronDown,
  ChevronUp, Sparkles, Info,
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
  ClientPreferences,
} from '@/services/crudService';
import { getActiveBarbers } from '@/services/teamService';
import type { Barber } from '@/types/settings';
import { useTenant } from '@/hooks/useTenant';
import { BARBER_PALETTE, HOURS, STATUS_LABELS, STATUS_CHIP, STATUS_BADGE, QUICK_ACTIONS, type QuickAction } from './constants';
import { barberColor } from './utils';
import { CalendarHeader } from './components/CalendarHeader';
import { AppointmentModal } from './components/AppointmentModal';
import { BarberPanel } from './components/BarberPanel';
import { CalendarTimeGrid } from './components/CalendarTimeGrid';
import { CalendarMonthGrid } from './components/CalendarMonthGrid';
import { useCalendarView } from './hooks/useCalendarView';
import { useCalendarData } from './hooks/useCalendarData';
import { useAppointmentMutations } from './hooks/useAppointmentMutations';

/* ─────────────────────────────────────────────────────── */
/* Component                                               */
/* ─────────────────────────────────────────────────────── */

export default function CalendarPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentDate, setCurrentDate, view, setView, navigateDate, periodLabel, rangeISO } = useCalendarView();
  const { appointments, customers, services, barbers, loading } = useCalendarData(rangeISO().from, rangeISO().to);
  const mutations = useAppointmentMutations();

  /** 'all' => no filter, otherwise a barber UUID */
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalStatus, setModalStatus] = useState<AppointmentStatus>('scheduled');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentBarberId, setAppointmentBarberId] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // ── Barber panel state ──
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelDate, setPanelDate] = useState(new Date());
  // track which appointment is being status-updated (spinner feedback)
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* Keep panelDate in sync with currentDate */
  useEffect(() => { setPanelDate(currentDate); }, [currentDate]);

  /* Deep-link: ?new=1 opens the new-appointment modal once */
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNewModal();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end:   endOfWeek(currentDate,   { weekStartsOn: 1 }),
  });

  /* ── Modal open/close ── */
  const openNewModal = (date?: Date, hour?: number) => {
    setSelectedAppointment(null);
    setAppointmentDate(date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setAppointmentTime(hour !== undefined ? `${String(hour).padStart(2, '0')}:00` : '09:00');
    setAppointmentBarberId('');
    setAppointmentNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsModalOpen(true);
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
      await mutations.updateStatus({ id, status });

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

  /* ── Visible appointments (after barber filter) ── */
  const visibleAppointments = selectedBarberId === 'all'
    ? appointments
    : appointments.filter(a => a.barber_id === selectedBarberId);

  /* ── Panel appointments (for the selected panel date) ── */
  const panelAppointments = visibleAppointments
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
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7 pb-24 lg:pb-8 max-w-[1600px] mx-auto">

      <CalendarHeader
        view={view}
        onViewChange={setView}
        periodLabel={periodLabel()}
        onNavigate={navigateDate}
        onToday={() => setCurrentDate(new Date())}
        onNewAppointment={() => openNewModal()}
        barbers={barbers}
        appointments={appointments}
        selectedBarberId={selectedBarberId}
        onSelectedBarberChange={setSelectedBarberId}
      />

      {/* ── Main layout: calendar + right panel (stacks on < xl) ── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── LEFT: Calendar grid ── */}
        <div className="flex-1 min-w-0">

          {/* Day / Week view */}
          {(view === 'day' || view === 'week') && (
            <CalendarTimeGrid
              days={view === 'week' ? weekDays : [currentDate]}
              weekMode={view === 'week'}
              appointments={visibleAppointments}
              barbers={barbers}
              panelDate={panelDate}
              onDayHeaderClick={(day) => setPanelDate(day)}
              onSlotClick={(day, hour) => openNewModal(day, hour)}
              onAppointmentClick={openEditModal}
            />
          )}

          {/* Month view */}
          {view === 'month' && (
            <CalendarMonthGrid
              currentDate={currentDate}
              appointments={visibleAppointments}
              onDayClick={(day) => { setCurrentDate(day); setView('day'); setPanelDate(day); }}
            />
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={28} />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT PANEL — Barbeiro (quick status actions)
        ══════════════════════════════════════════════ */}
        <BarberPanel
          open={panelOpen}
          onToggle={() => setPanelOpen(o => !o)}
          panelDate={panelDate}
          onPanelDateChange={setPanelDate}
          appointments={panelAppointments}
          pendingCount={panelPendingCount}
          updatingId={updatingId}
          onEditAppointment={openEditModal}
          onNewAppointment={(date) => openNewModal(date)}
        onStatusChange={handleStatusChange}
      />
    </div>

      {/* ══════════════════════════════════════════════
          MODAL — New / Edit appointment
      ══════════════════════════════════════════════ */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        initialDate={appointmentDate}
        initialTime={appointmentTime}
        initialBarberId={appointmentBarberId}
        customers={customers}
        services={services}
        barbers={barbers}
        tenantId={tenantId!}
        onSave={async (payload, id) => {
          if (id) {
            await mutations.update({ id, data: payload });
          } else {
            await mutations.create(payload);
          }
          setIsModalOpen(false);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Mobile FAB — Novo Agendamento */}
      <button
        onClick={() => openNewModal()}
        aria-label="Novo agendamento"
        className="lg:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-2xl bg-[#BE9B64] text-white shadow-floating flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
