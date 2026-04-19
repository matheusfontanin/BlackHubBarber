import React, { useState, useMemo } from 'react';
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Wrench,
  Activity,
  Calendar,
} from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { useAIHealth } from '@/hooks/queries/useAiLogs';
import type { AIHealthMetrics } from '@/schemas/aiDecisionLogSchema';

const PERIODS = [
  { days: 1, label: 'Hoje' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
];

function formatUsd(v: number): string {
  if (v < 0.01) return `US$ ${v.toFixed(4)}`;
  return `US$ ${v.toFixed(2)}`;
}

function formatMs(v: number): string {
  if (!v) return '—';
  if (v < 1000) return `${Math.round(v)} ms`;
  return `${(v / 1000).toFixed(2)} s`;
}

function computeRates(m: AIHealthMetrics) {
  const total = m.total_messages || 1;
  return {
    errorRate: (m.error_count / total) * 100,
    escalationRate: (m.escalation_count / total) * 100,
    replyRate: (m.replied_count / total) * 100,
  };
}

export default function AIHealthDashboard() {
  const { tenantId } = useTenant();
  const [periodDays, setPeriodDays] = useState(7);
  const { data, isLoading, error } = useAIHealth(tenantId, periodDays);

  const rates = useMemo(() => (data ? computeRates(data) : null), [data]);
  const maxCost = useMemo(
    () => (data?.cost_by_day?.length ? Math.max(...data.cost_by_day.map((d) => d.cost)) : 0),
    [data],
  );
  const maxToolUse = useMemo(
    () => (data?.tools_usage?.length ? Math.max(...data.tools_usage.map((t) => t.uses)) : 0),
    [data],
  );

  const showHighErrorAlert = rates && data && data.total_messages >= 10 && rates.errorRate > 10;
  const showHighLatencyAlert = data && data.p95_latency_ms > 10_000;

  return (
    <section className="space-y-6">
      <header className="border-b border-primary/[0.06] pb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-heading font-medium tracking-tight text-primary">
            Diagnóstico da IA
          </h2>
          <p className="text-xs text-muted mt-1">
            Acompanhamento de custo, latência e decisões do assistente.
          </p>
        </div>
        <nav className="inline-flex items-center gap-1 bg-sidebar/60 border border-border rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriodDays(p.days)}
              className={
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ' +
                (periodDays === p.days
                  ? 'bg-gold/10 text-gold border border-gold/25'
                  : 'text-muted hover:text-primary')
              }
            >
              {p.label}
            </button>
          ))}
        </nav>
      </header>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle size={16} />
          Não foi possível carregar as métricas da IA.
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* Alertas */}
          {(showHighErrorAlert || showHighLatencyAlert) && (
            <div className="space-y-2">
              {showHighErrorAlert && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400">
                      Taxa de erro acima de 10% no período
                    </p>
                    <p className="text-xs text-red-300/80 mt-1">
                      Revise os logs recentes para identificar a causa.
                    </p>
                  </div>
                </div>
              )}
              {showHighLatencyAlert && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <Clock size={18} className="text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-400">
                      Latência p95 acima de 10 segundos
                    </p>
                    <p className="text-xs text-orange-300/80 mt-1">
                      A IA pode estar demorando para responder.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI
              icon={Activity}
              label="Mensagens"
              value={data.total_messages.toLocaleString('pt-BR')}
            />
            <KPI icon={DollarSign} label="Custo total" value={formatUsd(data.total_cost_usd)} />
            <KPI icon={Clock} label="Latência média" value={formatMs(data.avg_latency_ms)} />
            <KPI icon={TrendingUp} label="Latência p95" value={formatMs(data.p95_latency_ms)} />
          </div>

          {/* Outcomes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <OutcomeCard
              label="Respondidas"
              value={data.replied_count}
              total={data.total_messages}
              tone="emerald"
            />
            <OutcomeCard
              label="Escaladas"
              value={data.escalation_count}
              total={data.total_messages}
              tone="orange"
            />
            <OutcomeCard
              label="Erros"
              value={data.error_count}
              total={data.total_messages}
              tone="red"
            />
          </div>

          {/* Custo por dia */}
          <div>
            <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider mb-3">
              Custo por dia
            </h3>
            {data.cost_by_day.length === 0 ? (
              <EmptyBlock icon={Calendar} label="Sem dados no período" />
            ) : (
              <div className="bg-surface/40 border border-border rounded-xl p-4">
                <div className="flex items-end gap-1.5 h-32">
                  {data.cost_by_day.map((d) => {
                    const heightPct = maxCost > 0 ? (d.cost / maxCost) * 100 : 0;
                    return (
                      <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center justify-end group relative"
                      >
                        <div
                          className="w-full rounded-t bg-gold/70 hover:bg-gold transition-all min-h-[2px]"
                          style={{ height: `${heightPct}%` }}
                        />
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-appbg border border-border rounded-md px-2 py-1 text-[10px] font-mono text-primary whitespace-nowrap shadow-lg">
                          {d.day} · {formatUsd(d.cost)} · {d.messages} msgs
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono text-faint">
                  <span>{data.cost_by_day[0]?.day}</span>
                  <span>{data.cost_by_day[data.cost_by_day.length - 1]?.day}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tools mais usadas */}
          <div>
            <h3 className="text-xs font-bold text-primary/40 uppercase tracking-wider mb-3">
              Ferramentas mais usadas
            </h3>
            {data.tools_usage.length === 0 ? (
              <EmptyBlock icon={Wrench} label="Nenhuma ferramenta chamada no período" />
            ) : (
              <div className="bg-surface/40 border border-border rounded-xl p-4 space-y-3">
                {data.tools_usage.map((t) => {
                  const widthPct = maxToolUse > 0 ? (t.uses / maxToolUse) * 100 : 0;
                  return (
                    <div key={t.name}>
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-xs font-mono text-primary">{t.name}</code>
                        <span className="text-xs font-mono text-gold">{t.uses}</span>
                      </div>
                      <div className="h-2 bg-appbg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agendamentos via IA */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1">
                Agendamentos criados pela IA
              </p>
              <p className="text-2xl font-heading font-bold text-emerald-400">
                {data.appointments_created_by_ai.toLocaleString('pt-BR')}
              </p>
            </div>
            <Calendar size={28} className="text-emerald-400/40" />
          </div>
        </>
      )}
    </section>
  );
}

interface KPIProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function KPI({ icon: Icon, label, value }: KPIProps) {
  return (
    <div className="p-4 rounded-xl bg-surface/60 border border-border">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} className="text-gold" />
        <span className="text-[10px] text-faint uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className="text-xl font-heading font-bold text-primary">{value}</p>
    </div>
  );
}

interface OutcomeCardProps {
  label: string;
  value: number;
  total: number;
  tone: 'emerald' | 'orange' | 'red';
}

function OutcomeCard({ label, value, total, tone }: OutcomeCardProps) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const toneClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  }[tone];

  return (
    <div className={`p-4 rounded-xl border ${toneClasses}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold opacity-80 mb-1">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-xl font-heading font-bold">{value.toLocaleString('pt-BR')}</p>
        <p className="text-xs font-mono opacity-70">{pct.toFixed(1)}%</p>
      </div>
    </div>
  );
}

interface EmptyBlockProps {
  icon: React.ElementType;
  label: string;
}

function EmptyBlock({ icon: Icon, label }: EmptyBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center bg-surface/40 border border-border rounded-xl">
      <Icon size={24} className="text-faint mb-2" />
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
