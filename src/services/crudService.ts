import { supabase } from '@/lib/supabase/client';

export interface Service {
  id?: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
  tenant_id: string;
  is_active?: boolean;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tenant_id: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'finished' | 'no_show';

export interface Appointment {
  id?: string;
  client_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  tenant_id: string;
  source?: string;
}

export const crudService = {
  // Services
  async getServices(tenantId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data as Service[];
  },
  async createService(service: Omit<Service, 'id'>) {
    const { data, error } = await supabase.from('services').insert(service).select().single();
    if (error) throw error;
    return data as Service;
  },
  async updateService(id: string, service: Partial<Service>) {
    const { data, error } = await supabase.from('services').update(service).eq('id', id).select().single();
    if (error) throw error;
    return data as Service;
  },
  async deleteService(id: string) {
    const { error } = await supabase.from('services').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  // Clients (tabela "clients" no schema)
  async getCustomers(tenantId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
    if (error) throw error;
    return data as Customer[];
  },
  async createCustomer(customer: Omit<Customer, 'id'>) {
    const { data, error } = await supabase.from('clients').insert(customer).select().single();
    if (error) throw error;
    return data as Customer;
  },
  async updateCustomer(id: string, customer: Partial<Customer>) {
    const { data, error } = await supabase.from('clients').update(customer).eq('id', id).select().single();
    if (error) throw error;
    return data as Customer;
  },
  async deleteCustomer(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // Appointments
  async getAppointments(tenantId: string, start: string, end: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, price, duration_minutes)')
      .eq('tenant_id', tenantId)
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time');
    if (error) throw error;
    return data ?? [];
  },
  async createAppointment(appointment: Omit<Appointment, 'id'>) {
    const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
    if (error) throw error;
    return data;
  },
  async updateAppointment(id: string, appointment: Partial<Appointment>) {
    const { data, error } = await supabase.from('appointments').update(appointment).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteAppointment(id: string) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },
};
