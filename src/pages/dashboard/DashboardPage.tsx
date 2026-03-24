import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  MessageSquare, 
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
  { label: 'Faturamento Mensal', value: 'R$ 12.450', change: '+12.5%', icon: DollarSign, color: 'text-green-500' },
  { label: 'Novos Clientes', value: '48', change: '+8.2%', icon: Users, color: 'text-blue-500' },
  { label: 'Agendamentos IA', value: '156', change: '+24.1%', icon: MessageSquare, color: 'text-purple-500' },
  { label: 'Taxa de Conversão', value: '64%', change: '+3.4%', icon: TrendingUp, color: 'text-orange-500' },
];

const RECENT_APPOINTMENTS = [
  { id: 1, client: 'João Silva', service: 'Corte Degradê', time: '14:30', status: 'Confirmado', price: 'R$ 50' },
  { id: 2, client: 'Pedro Santos', service: 'Barba & Toalha', time: '15:15', status: 'Aguardando', price: 'R$ 35' },
  { id: 3, client: 'Marcos Oliveira', service: 'Corte & Barba', time: '16:00', status: 'Confirmado', price: 'R$ 75' },
  { id: 4, client: 'Lucas Ferreira', service: 'Corte Tesoura', time: '17:00', status: 'Finalizado', price: 'R$ 60' },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-serif italic mb-2">Visão Geral</h1>
          <p className="text-sm opacity-50 uppercase tracking-[0.2em] font-mono font-bold">Segunda-feira, 24 de Março de 2026</p>
        </div>
        <button className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform">
          <Calendar size={18} /> Novo Agendamento
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-[#141414]/5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-lg bg-[#E4E3E0]/50", stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] opacity-50 uppercase tracking-widest mb-1 font-bold">{stat.label}</p>
            <p className="text-2xl font-mono font-bold tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#141414]/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#141414]/5 flex justify-between items-center">
            <h3 className="font-serif italic text-xl">Próximos Agendamentos</h3>
            <button className="text-xs font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Ver todos</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#E4E3E0]/30 text-[10px] uppercase tracking-widest font-bold text-[#141414]/50">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Serviço</th>
                  <th className="px-6 py-4">Horário</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/5">
                {RECENT_APPOINTMENTS.map((app) => (
                  <tr key={app.id} className="hover:bg-[#E4E3E0]/20 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-bold text-sm">{app.client}</td>
                    <td className="px-6 py-4 text-sm opacity-70">{app.service}</td>
                    <td className="px-6 py-4 font-mono text-sm">{app.time}</td>
                    <td className="px-6 py-4 font-mono text-sm">{app.price}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                        app.status === 'Confirmado' ? "bg-green-100 text-green-700" : 
                        app.status === 'Aguardando' ? "bg-orange-100 text-orange-700" : 
                        "bg-blue-100 text-blue-700"
                      )}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[#141414] text-[#E4E3E0] rounded-xl p-6 shadow-xl">
          <h3 className="font-serif italic text-xl mb-6">Atividade da IA</h3>
          <div className="space-y-6">
            <ActivityItem 
              time="Agora" 
              text="Novo agendamento via WhatsApp: João Silva para Corte às 14:30." 
              icon={MessageSquare}
            />
            <ActivityItem 
              time="12m atrás" 
              text="Cliente Pedro Santos perguntou sobre horários de Sábado." 
              icon={MessageSquare}
            />
            <ActivityItem 
              time="45m atrás" 
              text="Lembrete de consulta enviado para Marcos Oliveira." 
              icon={Clock}
            />
            <ActivityItem 
              time="1h atrás" 
              text="Relatório de faturamento diário gerado." 
              icon={DollarSign}
            />
          </div>
          
          <button className="w-full mt-8 py-3 border border-[#E4E3E0]/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#E4E3E0]/10 transition-all">
            Ver Logs Completos
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ time, text, icon: Icon }: { time: string, text: string, icon: React.ComponentType<{ size?: number }> }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-[#E4E3E0]/10 flex items-center justify-center text-secondary">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-xs leading-relaxed opacity-80">{text}</p>
        <p className="text-[10px] font-mono opacity-40 mt-1 uppercase">{time}</p>
      </div>
    </div>
  );
}
