import { supabase } from '@/lib/supabase/client';

export interface OnboardingData {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  instagram?: string;
  services: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
  businessHours: Array<{
    day: string;
    isOpen: boolean;
    open: string;
    close: string;
  }>;
}

export async function saveOnboardingData(data: OnboardingData) {
  try {
    // 1. Save Tenant (Barbershop)
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.name,
        owner_name: data.ownerName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        instagram: data.instagram,
        business_hours: data.businessHours,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 2. Save Services
    if (data.services.length > 0) {
      const servicesToInsert = data.services.map(service => ({
        tenant_id: tenant.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
      }));

      const { error: servicesError } = await supabase
        .from('services')
        .insert(servicesToInsert);

      if (servicesError) throw servicesError;
    }

    // 3. Trigger N8N Webhook (Backend Integration)
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          ...data,
        }),
      }).catch(err => console.error('Failed to trigger N8N webhook:', err));
    }

    return { success: true, tenantId: tenant.id };
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return { success: false, error };
  }
}
