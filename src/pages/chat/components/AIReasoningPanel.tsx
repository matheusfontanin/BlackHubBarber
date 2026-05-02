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
  replied:     { label: 'Respondeu',       color: 'text-[#11895C]' },
  tool_call:   { label: 'Usou ferramenta', color: 'text-[#9C7B47]' },
  escalated:   { label: 'Escalou',         color: 'text-[#B67A18]' },
  error:       { label: 'Erro',            color: 'text-[#D84A4A]' },
  no_response: { label: 'Sem resposta',    color: 'text-ink-faint' },
};

function formatCost(usd: number | null): string {
  if (usd === null) return '—';
  return usd < 0.01 ? `US$ ${usd.toFixed(4)}` : `US$ ${usd.toFixed(2)}`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '—';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function buildReportMarkdown(log: AIDecisionLog): string {
  return [
    `## Erro reportado na IA`,
    `- **Log ID:** ${log.id}`,
    `- **Modelo:** ${log.model}`,
    `- **Outcome:** ${log.outcome ?? '—'}`,
    `- **Data:** ${log.created_at}`,
    `### Prompt ativo`,
    '```',
    log.system_prompt_snapshot ?? '(não registrado)',
    '```',
    `### Mensagem do cliente`,
    log.user_message ?? '(não registrada)',
    `### Resposta da IA`,
    log.response_text ?? '(sem resposta)',
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
      handleSuccess('Relatório copiado');
    } catch { /* noop */ }
  };

  return (
    <AnimatePresence>
      {messageId && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[#12100D]/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white border-l border-line z-50 flex flex-col shadow-floating"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center">
                  <Bot size={16} className="text-gold-dark" />
                </div>
                <h3 className="text-sm font-bold text-ink">Raciocínio da IA</h3>
              </div>
              <button onClick={onClose} aria-label="Fechar" className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-[#BE9B64]" size={22} />
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FDECEC] border border-[#D84A4A]/20 text-[#D84A4A] text-sm">
                  <AlertTriangle size={15} /> Não foi possível carregar o raciocínio desta mensagem.
                </div>
              )}
              {!isLoading && !error && !log && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={26} className="text-ink-faint mb-3" />
                  <p className="text-sm text-ink-soft">Nenhum log registrado para esta mensagem.</p>
                </div>
              )}
              {log && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <MetricCard icon={Clock} label="Latência" value={formatLatency(log.latency_ms)} />
                    <MetricCard icon={DollarSign} label="Custo" value={formatCost(log.cost_usd)} />
                    <MetricCard icon={Wrench} label="Tokens" value={`${log.tokens_input + log.tokens_output}`} />
                  </div>

                  <div className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="label-muted mb-1">Resultado</p>
                      <p className={`text-sm font-semibold ${OUTCOME_LABEL[log.outcome ?? 'replied']?.color ?? 'text-ink'}`}>
                        {OUTCOME_LABEL[log.outcome ?? 'replied']?.label ?? log.outcome}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="label-muted mb-1">Modelo</p>
                      <p className="text-xs font-mono text-ink">{log.model}</p>
                    </div>
                  </div>

                  {log.tool_calls && log.tool_calls.length > 0 && (
                    <section>
                      <p className="label-muted mb-2">Ferramentas chamadas</p>
                      <div className="space-y-2">
                        {log.tool_calls.map((tc, idx) => (
                          <div key={idx} className="card p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench size={12} className="text-[#BE9B64]" />
                              <code className="text-xs font-mono text-[#9C7B47]">{tc.name}</code>
                            </div>
                            {tc.arguments && (
                              <pre className="text-[11px] font-mono text-ink-soft whitespace-pre-wrap break-all bg-[#F7F6F4] rounded-lg p-2">
                                {JSON.stringify(tc.arguments, null, 2)}
                              </pre>
                            )}
                            {tc.result !== undefined && tc.result !== null && (
                              <div className="mt-2">
                                <p className="label-muted mb-1">Resultado</p>
                                <pre className="text-[11px] font-mono text-ink-soft whitespace-pre-wrap break-all bg-[#F7F6F4] rounded-lg p-2">
                                  {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {log.system_prompt_snapshot && (
                    <section>
                      <p className="label-muted mb-2">Prompt ativo</p>
                      <pre className="text-[11px] font-mono text-ink-soft whitespace-pre-wrap bg-[#F7F6F4] border border-line rounded-xl p-3 max-h-60 overflow-y-auto">
                        {log.system_prompt_snapshot}
                      </pre>
                    </section>
                  )}

                  {log.reasoning && (
                    <section>
                      <p className="label-muted mb-2">Raciocínio</p>
                      <pre className="text-xs text-ink-soft whitespace-pre-wrap bg-[#F7F6F4] border border-line rounded-xl p-3">
                        {log.reasoning}
                      </pre>
                    </section>
                  )}

                  {log.error_message && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FDECEC] border border-[#D84A4A]/20 text-[#D84A4A] text-sm">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{log.error_message}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {log && (
              <div className="px-5 py-4 border-t border-line shrink-0">
                <button
                  onClick={handleCopyReport}
                  className="btn-secondary w-full gap-2"
                >
                  <Copy size={14} /> Copiar relatório
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
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} className="text-[#BE9B64]" />
        <span className="label-muted">{label}</span>
      </div>
      <p className="text-sm font-mono font-semibold text-ink">{value}</p>
    </div>
  );
}
