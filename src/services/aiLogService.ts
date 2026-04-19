import { supabase } from '@/lib/supabase/client';
import {
  aiDecisionLogSchema,
  aiHealthMetricsSchema,
  type AIDecisionLog,
  type AIHealthMetrics,
} from '@/schemas/aiDecisionLogSchema';

export const aiLogService = {
  async getByMessage(messageId: string): Promise<AIDecisionLog | null> {
    const { data, error } = await supabase
      .from('ai_decision_logs')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return aiDecisionLogSchema.parse(data);
  },

  async getByConversation(conversationId: string): Promise<AIDecisionLog[]> {
    const { data, error } = await supabase
      .from('ai_decision_logs')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => aiDecisionLogSchema.parse(row));
  },

  async getHealth(tenantId: string, periodDays: number): Promise<AIHealthMetrics> {
    const { data, error } = await supabase.rpc('get_ai_health', {
      p_tenant_id: tenantId,
      p_period_days: periodDays,
    });
    if (error) throw error;
    return aiHealthMetricsSchema.parse(data);
  },
};
