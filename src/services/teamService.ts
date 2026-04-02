/**
 * Team (Barbers) Service — BlackHub Barber
 * 
 * CRUD para profissionais da equipe.
 * Separado de tenant_members (que é auth/sistema).
 */

import { supabase } from '@/lib/supabase/client';
import type { Barber } from '@/types/settings';

export async function getBarbers(tenantId: string): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveBarbers(tenantId: string): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createBarber(barber: Omit<Barber, 'id' | 'created_at' | 'updated_at'>): Promise<Barber> {
  const { data, error } = await supabase
    .from('barbers')
    .insert(barber)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBarber(id: string, updates: Partial<Barber>): Promise<Barber> {
  const { data, error } = await supabase
    .from('barbers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleBarberActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('barbers')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteBarber(id: string): Promise<void> {
  const { error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
