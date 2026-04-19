import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Wrench, Clock, DollarSign, AlertTriangle, FileText, Bot, Copy } from 'lucide-react';
import { useAIDecisionForMessage } from '@/hooks/queries/useAiLogs';
import { handleSuccess } from '@/lib/errors';
import type { AIDecisionLog } from '@/schemas/aiDecisionLogSchema';

interface AIReasoningPanelProps {
  messageId: string | null;
  onClose: () => void;
}

const OUTCOME_LABEL: Record<string, { label: string; color: string }> = {
  replied: { label: 'Respondeu', color: 'text-emerald-400' },
  tool_call: { label: 'Usou ferramenta', color: 'text-gold' },
  escalated: { label: 'Escalou', color: 'text-orange-400' },
  error: { label: 'Erro', color: 'text-red-400' },
  no_response: { label: 'Sem resposta', color: 'text-faint' },
};

function formatCost(usd: number | null): string {
  if (usd === null) return '—';
  if (usd < 0.01) return `US$ ${usd.toFixed(4)}`;
  return `US$ ${usd.toFixed(2)}`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function buildReportMarkdown(log: AIDecisionLog): string {
  return [
    `## Erro reportado na IA`,
    ``,
    `- **Log ID:** ${log.id}`,
    `- **Conversa:** ${log.conversation_id ?? '—'}`,
    `- **Mensagem:** ${log.message_id ?? '—'}`,
    `- **Modelo:** ${log.model}`,
    `- **Outcome:** ${log.outcome ?? '—'}`,
    `- **Data:** ${log.created_at}`,
    ``,
    `### Prompt ativo`,
    '```',
    log.system_prompt_snapshot ?? '(não registrado)',
    '```',
    ``,
    `### Mensagem do cliente`,
    log.user_message ?? '(não registrada)',
    ``,
    `### Resposta da IA`,
    log.response_text ?? '(sem resposta)',
    ``,
    `### Ferramentas`,
    '```json',
    JSON.stringify(log.tool_calls ?? [], null, 2),
    '```',
  ].join('\n');
}

export function AIReasoningPanel({ messageId, onClose }: AIReasoningPanelProps) {
  const { data: log, isLoading, error } = useAIDecisionForMessage(messageId);

  const handleCopyReport = async () => {
    if (!log) return;
    try {
      await navigator.clipboard.writeText(buildReportMarkdown(log));
      handleSuccess('Relatório copiado para a área de transferência');
    } catch {
      // noop
    }
  };

  return (
    <AnimatePresence>
      {messageId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-sidebar border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
                  <Bot size={16} className="text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-primary italic">Raciocínio da IA</h3>
                  <p className="text-[10px] text-faint uppercase tracking-wider font-bold">
                    Decisão registrada
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted hover:text-primary hover:bg-white/[0.04]"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-gold" size={24} />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertTriangle size={16} />
                  Não foi possível carregar o raciocínio desta mensagem.
                </div>
              )}

              {!isLoading && !error && !log && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={28} className="text-faint mb-3" />
                  <p className="text-sm text-muted">Nenhum log registrado para esta mensagem.</p>
                </div>
              )}

              {log && (
                <>
                  {/* Métricas */}
                  <section className="grid grid-cols-3 gap-2">
                    <MetricCard icon={Clock} label="Latência" value={formatLatency(log.latency_ms)} />
                    <MetricCard icon={DollarSign} label="Custo" value={formatCost(log.cost_usd)} />
                    <MetricCard
                      icon={Wrench}
                      label="Tokens"
                      value={`${log.tokens_input + log.tokens_output}`}
                    />
                  </section>

                  {/* Outcome + modelo */}
                  <section className="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-border">
                    <div>
                      <p className="text-[10px] text-faint uppercase tracking-wider font-bold mb-0.5">
                        Resultado
                      </p>
                      <p className={`text-sm font-semibold ${OUTCOME_LABEL[log.outcome ?? 'replied']?.color ?? 'text-primary'}`}>
                        {OUTCOME_LABEL[log.outcome ?? 'replied']?.label ?? log.outcome}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-faint uppercase tracking-wider font-bold mb-0.5">
                        Modelo
                      </p>
                      <p className="text-xs font-mono text-primary">{log.model}</p>
                    </div>
                  </section>

                  {/* Tools */}
                  {log.tool_calls && log.tool_calls.length > 0 && (
                    <section>
                      <h4 className="text-[10px] font-bold text-primary/40 uppercase tracking-wider mb-2">
                        Ferramentas chamadas
                      </h4>
                      <div className="space-y-2">
                        {log.tool_calls.map((tc, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-surface/60 border border-border">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Wrench size={12} className="text-gold" />
                              <code className="text-xs font-mono text-gold">{tc.name}</code>
                            </div>
                            {tc.arguments && (
                              <pre className="text-[11px] font-mono text-muted whitespace-pre-wrap break-all bg-appbg/60 rounded p-2">
                                {JSON.stringify(tc.arguments, null, 2)}
                              </pre>
                            )}
                            {tc.result !== undefined && tc.result !== null && (
                              <div className="mt-2">
                                <p className="text-[9px] text-faint uppercase tracking-wider font-bold mb-1">
                                  Resultado
                                </p>
                                <pre className="text-[11px] font-mono text-muted whitespace-pre-wrap break-all bg-appbg/60 rounded p-2">
                                  {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Prompt ativo */}
                  {log.system_prompt_snapshot && (
                    <section>
                      <h4 className="text-[10px] font-bold text-primary/40 uppercase tracking-wider mb-2">
                        Prompt ativo no momento
                      </h4>
                      <pre className="text-[11px] font-mono text-muted whitespace-pre-wrap bg-surface/60 border border-border rounded-lg p-3 max-h-60 overflow-y-auto">
                        {log.system_prompt_snapshot}
                      </pre>
                    </section>
                  )}

                  {/* Reasoning */}
                  {log.reasoning && (
                    <section>
                      <h4 className="text-[10px] font-bold text-primary/40 uppercase tracking-wider mb-2">
                        Raciocínio
                      </h4>
                      <pre className="text-xs text-muted whitespace-pre-wrap bg-surface/60 border border-border rounded-lg p-3">
                        {log.reasoning}
                      </pre>
                    </section>
                  )}

                  {/* Erro */}
                  {log.error_message && (
                    <section className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{log.error_message}</span>
                    </section>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {log && (
              <div className="px-5 py-3 border-t border-border shrink-0">
                <button
                  onClick={handleCopyReport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface/80 border border-border text-sm font-semibold text-primary transition-colors"
                >
                  <Copy size={14} />
                  Copiar relatório
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <div className="p-3 rounded-xl bg-surface/60 border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className="text-gold" />
        <span className="text-[9px] text-faint uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className="text-sm font-mono font-semibold text-primary">{value}</p>
    </div>
  );
}
