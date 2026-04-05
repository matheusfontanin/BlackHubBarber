import { supabase } from '@/lib/supabase/client';

export interface AIUsageStats {
  total_interactions: number;
  total_tokens: number;
  total_cost_usd: number;
  total_cost_brl: number;
}

export const statsService = {
  async getAIUsageStats(tenantId: string): Promise<AIUsageStats | null> {
    const { data, error } = await supabase
      .from('ai_usage_stats')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching AI usage stats:', error);
      return null;
    }

    return data;
  }
};
