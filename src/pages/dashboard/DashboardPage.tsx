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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
  {
    label: 'Faturamento Mensal',
    value: 'R$ 12.450',
    change: '+12.5%',
    icon: DollarSign,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    changeBg: 'bg-emerald-50 text-emerald-700'
  },
  {
    label: 'Novos Clientes',
    value: '48',
    change: '+8.2%',
    icon: Users,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    changeBg: 'bg-blue-50 text-blue-700'
  },
  {
    label: 'Agendamentos IA',
    value: '156',
    change: '+24.1%',
    icon: MessageSquare,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    changeBg: 'bg-purple-50 text-purple-700'
  },
  {
    label: 'Taxa de Conversão',
    value: '64%',
    change: '+3.4%',
    icon: TrendingUp,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    changeBg: 'bg-amber-50 text-amber-700'
  },
];

const RECENT_APPOINTMENTS = [
  { id: 1, client: 'João Silva', service: 'Corte Degradê', time: '14:30', status: 'confirmed' as const, price: 'R$ 50', initials: 'JS' },
  { id: 2, client: 'Pedro Santos', service: 'Barba & Toalha', time: '15:15', status: 'pending' as const, price: 'R$ 35', initials: 'PS' },
  { id: 3, client: 'Marcos Oliveira', service: 'Corte & Barba', time: '16:00', status: 'confirmed' as const, price: 'R$ 75', initials: 'MO' },
  { id: 4, client: 'Lucas Ferreira', service: 'Corte Tesoura', time: '17:00', status: 'completed' as const, price: 'R$ 60', initials: 'LF' },
];

const STATUS_MAP = {
  confirmed: { label: 'Confirmado', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
  pending: { label: 'Aguardando', classes: 'bg-amber-50 text-amber-700 ring-amber-600/10' },
  completed: { label: 'Finalizado', classes: 'bg-blue-50 text-blue-700 ring-blue-600/10' },
};

const AI_ACTIVITY = [
  { time: 'Agora', text: 'Novo agendamento via WhatsApp: João Silva para Corte às 14:30.', icon: Calendar, dot: 'bg-emerald-400' },
  { time: '12min', text: 'Pedro Santos perguntou sobre horários de Sábado.', icon: MessageSquare, dot: 'bg-blue-400' },
  { time: '45min', text: 'Lembrete enviado para Marcos Oliveira.', icon: Clock, dot: 'bg-amber-400' },
  { time: '1h', text: 'Relatório de faturamento diário gerado.', icon: DollarSign, dot: 'bg-purple-400' },
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
          <p className="text-sm text-primary/40 font-medium mb-1 capitalize">{dayName}, {dateStr}</p>
          <h1 className="text-3xl font-heading font-medium tracking-tight text-primary">Visão Geral</h1>
        </div>
        <button className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
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
            className="bg-white p-5 rounded-2xl border border-primary/[0.04] shadow-sm hover:shadow-md transition-shadow group cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.iconBg, stat.iconColor)}>
                <stat.icon size={20} />
              </div>
              <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-lg", stat.changeBg)}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs text-primary/40 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-mono font-bold text-primary tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

        {/* Appointments Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-primary/[0.04] shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 flex justify-between items-center">
            <div>
              <h3 className="font-heading font-medium tracking-tight text-xl text-primary">Próximos Agendamentos</h3>
              <p className="text-xs text-primary/40 mt-0.5">Hoje, {dateStr}</p>
            </div>
            <button className="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1 transition-colors">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-primary/[0.04]">
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-primary/30">Cliente</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-primary/30">Servico</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-primary/30">Horario</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-primary/30">Valor</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-primary/30">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/[0.04]">
                {RECENT_APPOINTMENTS.map((app) => {
                  const status = STATUS_MAP[app.status];
                  return (
                    <tr key={app.id} className="hover:bg-primary/[0.015] transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary/60">
                            {app.initials}
                          </div>
                          <span className="font-semibold text-sm text-primary">{app.client}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary/60">{app.service}</td>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{app.time}</td>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{app.price}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ring-1 ring-inset",
                          status.classes
                        )}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Activity Feed */}
        <div className="bg-primary rounded-2xl p-5 lg:p-6 shadow-lg shadow-primary/10 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Sparkles size={16} className="text-secondary" />
            </div>
            <div>
              <h3 className="font-heading font-medium tracking-tight text-lg text-white">Atividade IA</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Tempo real</p>
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
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", item.dot)} />
                  {i < AI_ACTIVITY.length - 1 && <div className="w-px flex-1 bg-white/10" />}
                </div>
                <div className="pb-4">
                  <p className="text-[13px] text-white/70 leading-relaxed">{item.text}</p>
                  <p className="text-[10px] font-mono text-white/25 mt-1 uppercase">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-2 py-2.5 border border-white/10 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
            Ver Logs Completos <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Barbers */}
        <div className="bg-white rounded-2xl border border-primary/[0.04] shadow-sm p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-medium tracking-tight text-lg text-primary">Top Barbeiros</h3>
            <span className="text-[10px] font-bold text-primary/30 uppercase tracking-wider">Este mes</span>
          </div>
          <div className="space-y-3">
            {TOP_BARBERS.map((barber, i) => (
              <div key={barber.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/[0.02] transition-colors">
                <span className="text-xs font-mono font-bold text-primary/20 w-4">{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-secondary">
                  {barber.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-primary">{barber.name}</p>
                  <p className="text-xs text-primary/40">{barber.appointments} agendamentos</p>
                </div>
                <span className="font-mono text-sm font-bold text-primary">{barber.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Summary / Upcoming */}
        <div className="bg-gradient-to-br from-secondary/10 via-accent/5 to-transparent rounded-2xl border border-secondary/10 p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-secondary" />
            </div>
            <div>
              <h3 className="font-heading font-medium tracking-tight text-lg text-primary">Resumo do Dia</h3>
              <p className="text-xs text-primary/40">Performance de hoje</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-primary/40 font-medium mb-1">Agendamentos Hoje</p>
              <p className="text-2xl font-mono font-bold text-primary">12</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">8 confirmados</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-primary/40 font-medium mb-1">Faturamento Hoje</p>
              <p className="text-2xl font-mono font-bold text-primary">R$ 680</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">+15% vs ontem</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-primary/50">Ocupacao do dia</span>
                <span className="text-xs font-mono font-bold text-primary">75%</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-secondary to-accent rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-primary/50">Mensagens respondidas pela IA</span>
                <span className="text-xs font-mono font-bold text-primary">92%</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
