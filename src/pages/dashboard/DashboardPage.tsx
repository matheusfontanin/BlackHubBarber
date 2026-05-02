import { motion } from 'motion/react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/contexts/AuthContext';
import { statsService, type AIUsageStats } from '@/services/statsService';
import { seedDevTestData, type SeedReport } from '@/services/devSeedService';

const RECENT_APPOINTMENTS = [
  { id: 1, client: 'João Silva', service: 'Corte Degradê', time: '14:30', status: 'confirmed' as const, price: 'R$ 50', initials: 'JS' },
  { id: 2, client: 'Pedro Santos', service: 'Barba & Toalha', time: '15:15', status: 'pending' as const, price: 'R$ 35', initials: 'PS' },
  { id: 3, client: 'Marcos Oliveira', service: 'Corte & Barba', time: '16:00', status: 'confirmed' as const, price: 'R$ 75', initials: 'MO' },
  { id: 4, client: 'Lucas Ferreira', service: 'Corte Tesoura', time: '17:00', status: 'completed' as const, price: 'R$ 60', initials: 'LF' },
];

const STATUS_MAP = {
  confirmed: { label: 'Confirmado', classes: 'badge-success' },
  pending: { label: 'Aguardando', classes: 'badge-warning' },
  completed: { label: 'Finalizado', classes: 'badge-info' },
};

const AI_ACTIVITY = [
  { time: 'Agora', text: 'Novo agendamento via WhatsApp: João Silva para Corte às 14:30.', dot: 'bg-[#11895C]' },
  { time: '12min', text: 'Pedro Santos perguntou sobre horários de Sábado.', dot: 'bg-[#2E6FE8]' },
  { time: '45min', text: 'Lembrete enviado para Marcos Oliveira.', dot: 'bg-[#BE9B64]' },
  { time: '1h', text: 'Relatório de faturamento diário gerado.', dot: 'bg-[#9C7B47]' },
];

const TOP_BARBERS = [
  { name: 'Carlos Silva', appointments: 42, revenue: 'R$ 4.200', initials: 'CS' },
  { name: 'Rafael Santos', appointments: 38, revenue: 'R$ 3.800', initials: 'RS' },
  { name: 'Bruno Costa', appointments: 31, revenue: 'R$ 3.100', initials: 'BC' },
];


export default function DashboardPage() {
  const { tenantId } = useTenant();
  const { isDev } = useAuth();
  const navigate = useNavigate();
  const [aiStats, setAiStats] = useState<AIUsageStats | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedReport, setSeedReport] = useState<SeedReport | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      statsService.getAIUsageStats(tenantId).then(setAiStats);
    }
  }, [tenantId]);

  const handleSeed = async () => {
    if (!tenantId) return;
    const ok = confirm(
      'Carregar dados de teste?\n\nIsso vai inserir barbeiros, serviços, clientes, atendimentos e conversas de exemplo no tenant atual.'
    );
    if (!ok) return;
    setSeeding(true);
    setSeedError(null);
    setSeedReport(null);
    try {
      const report = await seedDevTestData(tenantId);
      setSeedReport(report);
    } catch (err) {
      let msg = 'Erro desconhecido.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === 'object') {
        const e = err as { message?: string; details?: string; hint?: string; code?: string };
        msg = [e.message, e.details, e.hint, e.code ? `(${e.code})` : null]
          .filter(Boolean)
          .join(' — ') || JSON.stringify(err);
      }
      setSeedError(msg);
    } finally {
      setSeeding(false);
    }
  };

  const stats = [
    {
      label: 'Faturamento Mensal',
      value: 'R$ 12.450',
      change: '+12.5%',
      positive: true,
      icon: DollarSign,
    },
    {
      label: 'Novos Clientes',
      value: '48',
      change: '+8.2%',
      positive: true,
      icon: Users,
    },
    {
      label: 'Agendamentos IA',
      value: aiStats?.total_interactions?.toString() || '0',
      change: '+24.1%',
      positive: true,
      icon: MessageSquare,
    },
    {
      label: 'Custo IA',
      value: aiStats?.total_cost_brl
        ? `R$ ${aiStats.total_cost_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'R$ 0,00',
      change: aiStats?.total_tokens ? `${(aiStats.total_tokens / 1000).toFixed(1)}k tokens` : '0 tokens',
      positive: false,
      icon: Sparkles,
    },
  ];

  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="page-header">
        <div>
          <p className="page-eyebrow capitalize">{dayName}, {dateStr}</p>
          <h1 className="page-title">Visão Geral</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isDev && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="btn-secondary w-full sm:w-auto"
            >
              <Sparkles size={15} /> {seeding ? 'Carregando…' : 'Dados de teste'}
            </button>
          )}
          <button
            onClick={() => navigate('/calendar?new=1')}
            className="btn-primary w-full sm:w-auto"
          >
            <Calendar size={16} /> Novo Agendamento
          </button>
        </div>
      </header>

      {seedReport && (
        <div className="mb-6 p-4 rounded-2xl border border-[#11895C]/20 bg-[#E8F6F0] text-[#11895C] text-sm space-y-1">
          <p className="font-semibold">Dados de teste carregados</p>
          <p className="text-[13px]">
            {seedReport.barbers} barbeiros, {seedReport.services} serviços, {seedReport.clients} clientes,{' '}
            {seedReport.appointments} atendimentos, {seedReport.conversations} conversas ({seedReport.messages} mensagens),{' '}
            {seedReport.memories} memórias IA.
          </p>
          {seedReport.warnings.length > 0 && (
            <div className="pt-2 mt-2 border-t border-[#11895C]/15 text-[#B67A18]">
              <p className="font-semibold mb-1">Avisos</p>
              {seedReport.warnings.map((w, i) => (
                <p key={i} className="text-[12px]">• {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
      {seedError && (
        <div className="mb-6 p-4 rounded-2xl border border-[#D84A4A]/20 bg-[#FDECEC] text-[#D84A4A] text-sm">
          <p className="font-semibold mb-1">Falha ao carregar dados de teste</p>
          <p className="text-[13px]">{seedError}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#F7F6F4] flex items-center justify-center text-[#12100D]">
                <stat.icon size={20} />
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                  stat.positive
                    ? 'bg-[#E8F6F0] text-[#11895C]'
                    : 'bg-[#F3F3F1] text-[#645F5C]'
                )}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-[12px] text-ink-soft font-medium mb-1">{stat.label}</p>
            <p className="text-[28px] font-bold text-ink tracking-tight leading-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Appointments table */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="px-6 py-5 flex justify-between items-center border-b border-line">
            <div>
              <h3 className="section-title">Próximos Agendamentos</h3>
              <p className="text-[13px] text-ink-soft mt-0.5">Hoje, {dateStr}</p>
            </div>
            <button className="text-sm font-semibold text-gold hover:text-gold-dark flex items-center gap-1 transition-colors">
              Ver todos <ChevronRight size={15} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Horário</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_APPOINTMENTS.map((app) => {
                  const status = STATUS_MAP[app.status];
                  return (
                    <tr key={app.id} className="cursor-pointer">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#E9DEC9] text-[#9C7B47] flex items-center justify-center text-[12px] font-semibold">
                            {app.initials}
                          </div>
                          <span className="font-semibold text-ink">{app.client}</span>
                        </div>
                      </td>
                      <td className="text-ink-soft">{app.service}</td>
                      <td className="font-mono text-ink">{app.time}</td>
                      <td className="font-semibold text-ink">{app.price}</td>
                      <td>
                        <span className={status.classes}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Activity */}
        <div className="card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-soft flex items-center justify-center">
              <Sparkles size={17} className="text-gold-dark" />
            </div>
            <div>
              <h3 className="section-title">Atividade IA</h3>
              <p className="text-[12px] text-ink-faint">Tempo real</p>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            {AI_ACTIVITY.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center gap-1 pt-1.5 shrink-0">
                  <div className={cn('w-2 h-2 rounded-full', item.dot)} />
                  {i < AI_ACTIVITY.length - 1 && <div className="w-px flex-1 bg-line min-h-[24px]" />}
                </div>
                <div className="pb-4">
                  <p className="text-[13px] text-ink leading-relaxed">{item.text}</p>
                  <p className="text-[11px] text-ink-faint mt-1">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="btn-secondary w-full mt-2">
            Ver logs completos <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Top Barbeiros</h3>
            <span className="text-[12px] text-ink-faint">Este mês</span>
          </div>
          <div className="space-y-1">
            {TOP_BARBERS.map((barber, i) => (
              <div key={barber.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-soft transition-colors">
                <span className="text-sm font-mono font-semibold text-ink-faint w-4">{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-[#E9DEC9] text-[#9C7B47] flex items-center justify-center text-[12px] font-semibold">
                  {barber.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{barber.name}</p>
                  <p className="text-[12px] text-ink-soft">{barber.appointments} agendamentos</p>
                </div>
                <span className="font-semibold text-sm text-ink">{barber.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#F7F6F4] flex items-center justify-center">
              <TrendingUp size={18} className="text-[#12100D]" />
            </div>
            <div>
              <h3 className="section-title">Resumo do Dia</h3>
              <p className="text-[12px] text-ink-soft">Performance de hoje</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl border border-line p-4">
              <p className="text-[12px] text-ink-soft mb-1">Agendamentos</p>
              <p className="text-2xl font-bold text-ink">12</p>
              <p className="text-[11px] text-[#11895C] font-semibold mt-1">8 confirmados</p>
            </div>
            <div className="rounded-xl border border-line p-4">
              <p className="text-[12px] text-ink-soft mb-1">Faturamento</p>
              <p className="text-2xl font-bold text-ink">R$ 680</p>
              <p className="text-[11px] text-[#11895C] font-semibold mt-1">+15% vs ontem</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] text-ink-soft">Ocupação do dia</span>
                <span className="text-[12px] font-semibold text-ink">75%</span>
              </div>
              <div className="h-1.5 bg-[#F3F3F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#BE9B64] rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] text-ink-soft">Respostas pela IA</span>
                <span className="text-[12px] font-semibold text-ink">92%</span>
              </div>
              <div className="h-1.5 bg-[#F3F3F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#11895C] rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
