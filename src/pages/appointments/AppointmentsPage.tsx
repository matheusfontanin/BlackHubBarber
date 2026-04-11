import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

/* ─────────────────────────────────────────────────────── */
/* Constants                                               */
/* ─────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:   'Agendado',
  confirmed:   'Confirmado',
  canceled:    'Cancelado',
  completed:   'Concluído',
  no_show:     'Não compareceu',
  in_progress: 'Em andamento',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled:   'bg-gold/10 text-gold border-gold/25',
  confirmed:   'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
  canceled:    'bg-red-950/60 text-red-300 border-red-500/25',
  completed:   'bg-surface/80 text-muted border-border',
  no_show:     'bg-orange-950/60 text-orange-300 border-orange-500/25',
  in_progress: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
};

const BARBER_PALETTE = [
  { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30' },
  { dot: 'bg-blue-400',    text: 'text-blue-300',    bg: 'bg-blue-950/60',    border: 'border-blue-500/30' },
  { dot: 'bg-purple-400',  text: 'text-purple-300',  bg: 'bg-purple-950/60',  border: 'border-purple-500/30' },
  { dot: 'bg-pink-400',    text: 'text-pink-300',    bg: 'bg-pink-950/60',    border: 'border-pink-500/30' },
  { dot: 'bg-orange-400',  text: 'text-orange-300',  bg: 'bg-orange-950/60',  border: 'border-orange-500/30' },
  { dot: 'bg-cyan-400',    text: 'text-cyan-300',    bg: 'bg-cyan-950/60',    border: 'border-cyan-500/30' },
];

function barberColor(id: string | undefined, all: Barber[]) {
  if (!id) return BARBER_PALETTE[0];
  const idx = all.findIndex(b => b.id === id);
  if (idx < 0) return BARBER_PALETTE[0];
  return BARBER_PALETTE[idx % BARBER_PALETTE.length];
}

type Tab = 'upcoming' | 'history';

/** Friendly label for a date: "Hoje", "Amanhã", "sex, 12 de abril". */
function dateHeader(date: Date): string {
  if (isToday(date))    return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date))return 'Ontem';
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

/* ─────────────────────────────────────────────────────── */
/* Component                                               */
/* ─────────────────────────────────────────────────────── */

export default function AppointmentsPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>('upcoming');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [search, setSearch] = useState('');

  /* ── Data fetching ── */
  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // Wide window: 120 days back, 180 days forward
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

  /* ── Derived lists ── */
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

  /* ── Group by date ── */
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

  /* ── Stats for the tab counts ── */
  const upcomingCount = upcoming.length;
  const historyCount  = history.length;
  const upcomingRevenue = upcoming
    .filter(a => a.status !== 'canceled' && a.status !== 'no_show')
    .reduce((s, a) => s + Number(a.services?.price ?? 0), 0);

  if (tenantLoading) return null;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <header className="mb-5 lg:mb-6">
        <p className="text-[11px] sm:text-xs text-muted font-semibold mb-1 uppercase tracking-wider">Gestão</p>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary italic heading-underline">Atendimentos</h1>
        <p className="text-sm text-muted mt-3">Histórico completo e próximos atendimentos agendados, por barbeiro.</p>
      </header>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 lg:mb-6">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-faint">Próximos</span>
          </div>
          <p className="text-2xl font-mono font-bold text-gold">{upcomingCount}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-0.5">Atendimentos</p>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-faint">Estimado</span>
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-400">R$ {upcomingRevenue.toFixed(0)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-0.5">Faturamento</p>
        </div>

        <div className="card p-4 sm:p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-surface border border-border text-muted flex items-center justify-center">
              <History size={16} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-faint">Histórico</span>
          </div>
          <p className="text-2xl font-mono font-bold text-primary">{historyCount}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-0.5">Atendimentos passados</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-sidebar border border-border rounded-xl p-1 mb-4 w-full sm:w-auto">
        <button
          onClick={() => setTab('upcoming')}
          className={cn(
            'flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all',
            tab === 'upcoming'
              ? 'bg-gold text-sidebar shadow-[0_1px_8px_rgba(201,168,76,0.35)]'
              : 'text-muted hover:text-primary',
          )}
        >
          Próximos ({upcomingCount})
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all',
            tab === 'history'
              ? 'bg-gold text-sidebar shadow-[0_1px_8px_rgba(201,168,76,0.35)]'
              : 'text-muted hover:text-primary',
          )}
        >
          Histórico ({historyCount})
        </button>
      </div>

      {/* ── Search + Barber filter ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço ou barbeiro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-dark pl-10"
          />
        </div>
      </div>

      {barbers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedBarberId('all')}
            className={cn(
              'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all',
              selectedBarberId === 'all'
                ? 'bg-gold/15 border-gold/40 text-gold'
                : 'bg-sidebar border-border text-muted hover:text-primary',
            )}
          >
            <User size={12} /> Todos
          </button>
          {barbers.map(b => {
            const color = barberColor(b.id, barbers);
            const active = selectedBarberId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBarberId(b.id!)}
                className={cn(
                  'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all',
                  active
                    ? cn(color.border, color.bg, color.text)
                    : 'bg-sidebar border-border text-muted hover:text-primary',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', color.dot)} />
                <span className="max-w-[120px] truncate">{b.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={36} />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
            {tab === 'upcoming' ? <CalendarIcon size={28} className="text-gold/60" /> : <History size={28} className="text-gold/60" />}
          </div>
          <p className="text-muted font-medium">
            {tab === 'upcoming' ? 'Nenhum próximo atendimento' : 'Nenhum atendimento no histórico'}
          </p>
          <p className="text-faint text-sm mt-1">
            {search || selectedBarberId !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : tab === 'upcoming'
                ? 'Os próximos agendamentos aparecerão aqui.'
                : 'O histórico de atendimentos aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {grouped.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gold capitalize">
                    {dateHeader(group.date)}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-mono font-bold text-faint">
                    {group.items.length} {group.items.length === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.items.map(app => {
                    const start = parseISO(app.starts_at);
                    const end = parseISO(app.ends_at);
                    const color = barberColor(app.barber_id, barbers);
                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-4 sm:p-5 hover:border-gold/30 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)] transition-all group"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Time block */}
                          <div className="shrink-0 flex flex-col items-center justify-center w-14 sm:w-16 bg-surface border border-border rounded-xl py-2.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-faint">
                              {format(start, 'EEE', { locale: ptBR })}
                            </p>
                            <p className="text-base sm:text-lg font-mono font-bold text-gold leading-none my-0.5">
                              {format(start, 'HH:mm')}
                            </p>
                            <p className="text-[8px] font-mono text-faint">
                              {format(end, 'HH:mm')}
                            </p>
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="text-sm sm:text-base font-bold text-primary truncate">
                                {app.clients?.name ?? 'Cliente removido'}
                              </h3>
                              <span className={cn(
                                'shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                                STATUS_BADGE[app.status],
                              )}>
                                {STATUS_LABELS[app.status]}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted mb-2 flex-wrap">
                              <span className="flex items-center gap-1 font-mono">
                                <Scissors size={10} className="text-faint" /> {app.services?.name ?? '—'}
                              </span>
                              {app.clients?.phone && (
                                <span className="flex items-center gap-1 font-mono text-faint hidden sm:flex">
                                  <Phone size={10} /> {app.clients.phone}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-2">
                              {/* Barber pill */}
                              <div className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold',
                                app.barber_id ? cn(color.border, color.bg, color.text) : 'border-border bg-surface text-faint',
                              )}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', app.barber_id ? color.dot : 'bg-faint')} />
                                {app.barbers?.name ?? 'Sem barbeiro'}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[10px] text-faint font-mono">
                                  <Clock size={9} /> {Math.round((end.getTime() - start.getTime()) / 60000)} min
                                </span>
                                <span className="text-sm font-mono font-bold text-gold">
                                  R$ {Number(app.services?.price ?? 0).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {app.notes && (
                              <p className="text-[11px] text-muted mt-2 line-clamp-2 italic border-l-2 border-gold/20 pl-2">
                                {app.notes}
                              </p>
                            )}
                          </div>

                          <ChevronRight size={16} className="text-faint shrink-0 hidden sm:block group-hover:text-gold transition-colors" />
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
