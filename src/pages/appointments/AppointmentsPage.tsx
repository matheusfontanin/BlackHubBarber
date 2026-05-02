import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon, Clock, User, Scissors, Search,
  Loader2, ChevronRight, DollarSign, History, Sparkles, Phone,
} from 'lucide-react';
import {
  format, parseISO, isToday, isTomorrow, isYesterday,
  addDays, subDays, startOfDay, isAfter, isBefore,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  crudService,
  Appointment,
  AppointmentStatus,
} from '@/services/crudService';
import { getActiveBarbers } from '@/services/teamService';
import type { Barber } from '@/types/settings';
import { useTenant } from '@/hooks/useTenant';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:   'Agendado',
  confirmed:   'Confirmado',
  canceled:    'Cancelado',
  completed:   'Concluído',
  no_show:     'Não compareceu',
  in_progress: 'Em andamento',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled:   'badge-gold',
  confirmed:   'badge-success',
  canceled:    'badge-danger',
  completed:   'badge-neutral',
  no_show:     'badge-warning',
  in_progress: 'badge-info',
};

const BARBER_PALETTE = [
  { dot: 'bg-[#11895C]', text: 'text-[#11895C]', bg: 'bg-[#E8F6F0]', border: 'border-[#11895C]/20' },
  { dot: 'bg-[#2E6FE8]', text: 'text-[#2E6FE8]', bg: 'bg-[#EAF1FF]', border: 'border-[#2E6FE8]/20' },
  { dot: 'bg-[#9C7B47]', text: 'text-[#9C7B47]', bg: 'bg-[#E9DEC9]', border: 'border-[#9C7B47]/20' },
  { dot: 'bg-[#B67A18]', text: 'text-[#B67A18]', bg: 'bg-[#FFF4DE]', border: 'border-[#B67A18]/20' },
  { dot: 'bg-[#D84A4A]', text: 'text-[#D84A4A]', bg: 'bg-[#FDECEC]', border: 'border-[#D84A4A]/20' },
  { dot: 'bg-[#645F5C]', text: 'text-[#645F5C]', bg: 'bg-[#F3F3F1]', border: 'border-[#DED8D1]' },
];

function barberColor(id: string | undefined, all: Barber[]) {
  if (!id) return BARBER_PALETTE[0];
  const idx = all.findIndex(b => b.id === id);
  if (idx < 0) return BARBER_PALETTE[0];
  return BARBER_PALETTE[idx % BARBER_PALETTE.length];
}

type Tab = 'upcoming' | 'history';

function dateHeader(date: Date): string {
  if (isToday(date))    return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date))return 'Ontem';
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export default function AppointmentsPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>('upcoming');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const start = format(subDays(new Date(), 120), "yyyy-MM-dd'T'00:00:00'Z'");
      const end   = format(addDays(new Date(), 180), "yyyy-MM-dd'T'23:59:59'Z'");
      const [apps, brbs] = await Promise.all([
        crudService.getAppointments(tenantId, start, end),
        getActiveBarbers(tenantId).catch(() => [] as Barber[]),
      ]);
      setAppointments(apps);
      setBarbers(brbs);
    } catch (err) {
      console.error('Erro ao buscar atendimentos:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { upcoming, history } = useMemo(() => {
    const now = new Date();
    const filterByBarber = (a: Appointment) =>
      selectedBarberId === 'all' || a.barber_id === selectedBarberId;
    const filterBySearch = (a: Appointment) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (a.clients?.name ?? '').toLowerCase().includes(q) ||
        (a.services?.name ?? '').toLowerCase().includes(q) ||
        (a.barbers?.name ?? '').toLowerCase().includes(q)
      );
    };
    const base = appointments.filter(a => filterByBarber(a) && filterBySearch(a));
    const upcoming = base
      .filter(a => isAfter(parseISO(a.ends_at), now) && a.status !== 'canceled' && a.status !== 'no_show')
      .sort((a, b) => parseISO(a.starts_at).getTime() - parseISO(b.starts_at).getTime());
    const history = base
      .filter(a => isBefore(parseISO(a.ends_at), now) || a.status === 'canceled' || a.status === 'no_show')
      .sort((a, b) => parseISO(b.starts_at).getTime() - parseISO(a.starts_at).getTime());
    return { upcoming, history };
  }, [appointments, selectedBarberId, search]);

  const grouped = useMemo(() => {
    const list = tab === 'upcoming' ? upcoming : history;
    const map = new Map<string, Appointment[]>();
    for (const app of list) {
      const key = format(startOfDay(parseISO(app.starts_at)), 'yyyy-MM-dd');
      const existing = map.get(key);
      if (existing) existing.push(app);
      else map.set(key, [app]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      date: parseISO(key + 'T00:00:00'),
      items,
    }));
  }, [tab, upcoming, history]);

  const upcomingCount = upcoming.length;
  const historyCount  = history.length;
  const upcomingRevenue = upcoming
    .filter(a => a.status !== 'canceled' && a.status !== 'no_show')
    .reduce((s, a) => s + Number(a.services?.price ?? 0), 0);

  if (tenantLoading) return null;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
      <header className="mb-6 lg:mb-8">
        <p className="page-eyebrow">Gestão</p>
        <h1 className="page-title">Atendimentos</h1>
        <p className="page-subtitle">Histórico completo e próximos atendimentos agendados, por barbeiro.</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-soft flex items-center justify-center text-gold-dark">
              <Sparkles size={17} />
            </div>
          </div>
          <p className="text-[12px] text-ink-soft font-medium mb-1">Próximos</p>
          <p className="text-2xl font-bold text-ink">{upcomingCount}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#E8F6F0] flex items-center justify-center text-[#11895C]">
              <DollarSign size={17} />
            </div>
          </div>
          <p className="text-[12px] text-ink-soft font-medium mb-1">Faturamento estimado</p>
          <p className="text-2xl font-bold text-ink">R$ {upcomingRevenue.toFixed(0)}</p>
        </div>

        <div className="card p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#F7F6F4] flex items-center justify-center text-[#12100D]">
              <History size={17} />
            </div>
          </div>
          <p className="text-[12px] text-ink-soft font-medium mb-1">Histórico</p>
          <p className="text-2xl font-bold text-ink">{historyCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="segmented mb-4 w-full sm:w-auto">
        <button
          onClick={() => setTab('upcoming')}
          className={cn(
            'segmented-item flex-1 sm:flex-none',
            tab === 'upcoming' && 'segmented-item-active'
          )}
        >
          Próximos ({upcomingCount})
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'segmented-item flex-1 sm:flex-none',
            tab === 'history' && 'segmented-item-active'
          )}
        >
          Histórico ({historyCount})
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço ou barbeiro…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Barber filter */}
      {barbers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 pb-1">
          <button
            onClick={() => setSelectedBarberId('all')}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-semibold transition-colors',
              selectedBarberId === 'all'
                ? 'bg-[#12100D] text-white'
                : 'bg-white border border-line text-ink-soft hover:text-ink'
            )}
          >
            <User size={13} /> Todos
          </button>
          {barbers.map(b => {
            const color = barberColor(b.id, barbers);
            const active = selectedBarberId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBarberId(b.id!)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-semibold transition-colors border',
                  active
                    ? cn(color.border, color.bg, color.text)
                    : 'bg-white border-line text-ink-soft hover:text-ink'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
                <span className="max-w-[140px] truncate">{b.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F6F4] flex items-center justify-center mb-4">
            {tab === 'upcoming' ? <CalendarIcon size={24} className="text-ink-soft" /> : <History size={24} className="text-ink-soft" />}
          </div>
          <p className="text-ink font-semibold">
            {tab === 'upcoming' ? 'Nenhum próximo atendimento' : 'Nenhum atendimento no histórico'}
          </p>
          <p className="text-ink-soft text-sm mt-1">
            {search || selectedBarberId !== 'all'
              ? 'Ajuste os filtros de busca.'
              : tab === 'upcoming'
                ? 'Os próximos agendamentos aparecerão aqui.'
                : 'O histórico de atendimentos aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {grouped.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-[13px] font-semibold text-ink capitalize">
                    {dateHeader(group.date)}
                  </h2>
                  <div className="flex-1 h-px bg-line" />
                  <span className="text-[12px] text-ink-faint">
                    {group.items.length} {group.items.length === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.items.map(app => {
                    const start = parseISO(app.starts_at);
                    const end = parseISO(app.ends_at);
                    const color = barberColor(app.barber_id, barbers);
                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card-hover p-4 sm:p-5 group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Time block */}
                          <div className="shrink-0 flex flex-col items-center justify-center w-16 bg-[#F7F6F4] rounded-xl py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                              {format(start, 'EEE', { locale: ptBR })}
                            </p>
                            <p className="text-base font-bold text-ink leading-none my-0.5">
                              {format(start, 'HH:mm')}
                            </p>
                            <p className="text-[10px] text-ink-faint">
                              {format(end, 'HH:mm')}
                            </p>
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="text-[15px] font-semibold text-ink truncate">
                                {app.clients?.name ?? 'Cliente removido'}
                              </h3>
                              <span className={cn('shrink-0', STATUS_BADGE[app.status])}>
                                {STATUS_LABELS[app.status]}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[13px] text-ink-soft mb-3 flex-wrap">
                              <span className="flex items-center gap-1.5">
                                <Scissors size={12} className="text-ink-faint" /> {app.services?.name ?? '—'}
                              </span>
                              {app.clients?.phone && (
                                <span className="hidden sm:flex items-center gap-1.5 text-ink-faint">
                                  <Phone size={12} /> {app.clients.phone}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold',
                                app.barber_id
                                  ? cn(color.border, color.bg, color.text)
                                  : 'border-line bg-[#F7F6F4] text-ink-faint'
                              )}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', app.barber_id ? color.dot : 'bg-[#A39F9D]')} />
                                {app.barbers?.name ?? 'Sem barbeiro'}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[12px] text-ink-faint">
                                  <Clock size={11} /> {Math.round((end.getTime() - start.getTime()) / 60000)} min
                                </span>
                                <span className="text-[15px] font-bold text-ink">
                                  R$ {Number(app.services?.price ?? 0).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {app.notes && (
                              <p className="text-[12px] text-ink-soft mt-3 border-l-2 border-[#E9DEC9] pl-3">
                                {app.notes}
                              </p>
                            )}
                          </div>

                          <ChevronRight size={16} className="text-ink-faint shrink-0 hidden sm:block" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
