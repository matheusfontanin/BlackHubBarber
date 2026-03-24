import { supabase } from '@/lib/supabase/client';
import { BarbershopFormData, Service, DayHours } from '@/types/onboarding';

export interface OnboardingData extends BarbershopFormData {
  whatsappInstanceName?: string;
  googleCalendarConnected?: boolean;
  services: Service[];
  businessHours: DayHours[];
}

export async function saveOnboardingData(data: OnboardingData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado');

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
        instagram_handle: data.instagram ?? null,
        opening_hours: data.businessHours,
        whatsapp_instance_id: data.whatsappInstanceName ?? null,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    if (data.services.length > 0) {
      const { error: servicesError } = await supabase
        .from('services')
        .insert(
          data.services.map(service => ({
            tenant_id: tenant.id,
            name: service.name,
            price: service.price,
            duration_minutes: service.duration,
          }))
        );

      if (servicesError) throw servicesError;
    }

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, ...data }),
      }).catch(err => console.error('Falha ao notificar N8N:', err));
    }

    return { success: true, tenantId: tenant.id as string };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro ao salvar onboarding:', error);
    return { success: false, error: errorMessage };
  }
}
