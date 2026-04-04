import { motion } from 'motion/react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Scissors,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
  {
    label: 'Faturamento Mensal',
    value: 'R$ 12.450',
    change: '+12.5%',
    positive: true,
    icon: DollarSign,
    iconColor: 'text-gold',
    iconBg: 'bg-gold/10 border border-gold/20',
  },
  {
    label: 'Novos Clientes',
    value: '48',
    change: '+8.2%',
    positive: true,
    icon: Users,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border border-blue-500/20',
  },
  {
    label: 'Agendamentos IA',
    value: '156',
    change: '+24.1%',
    positive: true,
    icon: MessageSquare,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border border-purple-500/20',
  },
  {
    label: 'Taxa de Conversão',
    value: '64%',
    change: '+3.4%',
    positive: true,
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
  },
];

const RECENT_APPOINTMENTS = [
  { id: 1, client: 'João Silva', service: 'Corte Degradê', time: '14:30', status: 'confirmed' as const, price: 'R$ 50', initials: 'JS' },
  { id: 2, client: 'Pedro Santos', service: 'Barba & Toalha', time: '15:15', status: 'pending' as const, price: 'R$ 35', initials: 'PS' },
  { id: 3, client: 'Marcos Oliveira', service: 'Corte & Barba', time: '16:00', status: 'confirmed' as const, price: 'R$ 75', initials: 'MO' },
  { id: 4, client: 'Lucas Ferreira', service: 'Corte Tesoura', time: '17:00', status: 'completed' as const, price: 'R$ 60', initials: 'LF' },
];

const STATUS_MAP = {
  confirmed: { label: 'Confirmado', classes: 'badge-confirmed' },
  pending: { label: 'Aguardando', classes: 'badge-pending' },
  completed: { label: 'Finalizado', classes: 'badge-completed' },
};

const AI_ACTIVITY = [
  { time: 'Agora', text: 'Novo agendamento via WhatsApp: João Silva para Corte às 14:30.', dot: 'bg-emerald-400' },
  { time: '12min', text: 'Pedro Santos perguntou sobre horários de Sábado.', dot: 'bg-blue-400' },
  { time: '45min', text: 'Lembrete enviado para Marcos Oliveira.', dot: 'bg-gold' },
  { time: '1h', text: 'Relatório de faturamento diário gerado.', dot: 'bg-purple-400' },
];

const TOP_BARBERS = [
  { name: 'Carlos Silva', appointments: 42, revenue: 'R$ 4.200', initials: 'CS' },
  { name: 'Rafael Santos', appointments: 38, revenue: 'R$ 3.800', initials: 'RS' },
  { name: 'Bruno Costa', appointments: 31, revenue: 'R$ 3.100', initials: 'BC' },
];

export default function DashboardPage() {
  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <p className="text-xs text-muted font-medium mb-1 capitalize tracking-wider uppercase">{dayName}, {dateStr}</p>
          <h1 className="text-3xl font-heading font-bold text-primary italic heading-underline">Visão Geral</h1>
        </div>
        <button className="btn-gold flex items-center gap-2">
          <Calendar size={16} /> Novo Agendamento
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="card p-5 hover:border-border2 transition-all duration-300 group cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.iconBg, stat.iconColor)}>
                <stat.icon size={20} />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-lg",
                stat.positive
                  ? "bg-emerald-950/80 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                  : "bg-red-950/80 text-red-400 ring-1 ring-inset ring-red-500/20"
              )}>
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-mono font-bold text-gold tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

        {/* Appointments Table */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="p-5 lg:p-6 flex justify-between items-center border-b border-border">
            <div>
              <h3 className="font-heading font-bold text-xl text-primary italic">Próximos Agendamentos</h3>
              <p className="text-xs text-muted mt-0.5">Hoje, {dateStr}</p>
            </div>
            <button className="text-xs font-semibold text-gold hover:text-gold-light flex items-center gap-1 transition-colors">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-faint">Cliente</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-faint">Serviço</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-faint">Horário</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-faint">Valor</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-faint">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_APPOINTMENTS.map((app) => {
                  const status = STATUS_MAP[app.status];
                  return (
                    <tr key={app.id} className="hover:bg-surface/50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">
                            {app.initials}
                          </div>
                          <span className="font-semibold text-sm text-primary">{app.client}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">{app.service}</td>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{app.time}</td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-gold">{app.price}</td>
                      <td className="px-6 py-4">
                        <span className={status.classes}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Activity Feed */}
        <div className="bg-sidebar border border-border rounded-2xl p-5 lg:p-6 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
              <Sparkles size={16} className="text-gold" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-primary italic">Atividade IA</h3>
              <p className="text-[10px] text-gold/60 uppercase tracking-wider font-semibold">Tempo real</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {AI_ACTIVITY.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <div className={cn("w-2 h-2 rounded-full", item.dot)} />
                  {i < AI_ACTIVITY.length - 1 && <div className="w-px flex-1 bg-border min-h-[20px]" />}
                </div>
                <div className="pb-4">
                  <p className="text-[13px] text-muted leading-relaxed">{item.text}</p>
                  <p className="text-[10px] font-mono text-faint mt-1 uppercase">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-2 py-2.5 border border-border2 rounded-xl text-xs font-semibold text-muted hover:text-primary hover:border-gold/30 transition-all flex items-center justify-center gap-2">
            Ver Logs Completos <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Barbers */}
        <div className="card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-bold text-lg text-primary italic">Top Barbeiros</h3>
            <span className="text-[10px] font-bold text-faint uppercase tracking-wider">Este mês</span>
          </div>
          <div className="space-y-2">
            {TOP_BARBERS.map((barber, i) => (
              <div key={barber.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface/60 transition-colors">
                <span className="text-xs font-mono font-bold text-faint w-4">{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                  {barber.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-primary">{barber.name}</p>
                  <p className="text-xs text-muted">{barber.appointments} agendamentos</p>
                </div>
                <span className="font-mono text-sm font-bold text-gold">{barber.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Summary */}
        <div className="card p-5 lg:p-6 relative overflow-hidden">
          {/* subtle gold glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/[0.04] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-center gap-3 mb-5 relative">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-gold" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-primary italic">Resumo do Dia</h3>
              <p className="text-xs text-muted">Performance de hoje</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 relative">
            <div className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-xs text-muted font-medium mb-1">Agendamentos</p>
              <p className="text-2xl font-mono font-bold text-primary">12</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">8 confirmados</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-xs text-muted font-medium mb-1">Faturamento</p>
              <p className="text-2xl font-mono font-bold text-gold">R$ 680</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">+15% vs ontem</p>
            </div>
          </div>

          <div className="space-y-3 relative">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-muted">Ocupação do dia</span>
                <span className="text-xs font-mono font-bold text-primary">75%</span>
              </div>
              <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-muted">Respostas pela IA</span>
                <span className="text-xs font-mono font-bold text-primary">92%</span>
              </div>
              <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
