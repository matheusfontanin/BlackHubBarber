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
  whatsappInstanceName?: string;
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
    // 1. Obter usuário autenticado atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado');

    // 2. Criar Tenant (Barbearia)
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
        whatsapp_instance: data.whatsappInstanceName ?? null,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 3. Vincular usuário ao tenant como owner
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    // 4. Salvar Serviços
    if (data.services.length > 0) {
      const { error: servicesError } = await supabase
        .from('services')
        .insert(
          data.services.map(service => ({
            tenant_id: tenant.id,
            name: service.name,
            price: service.price,
            duration: service.duration,
          }))
        );

      if (servicesError) throw servicesError;
    }

    // 5. Notificar N8N (fire-and-forget)
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, ...data }),
      }).catch(err => console.error('Falha ao notificar N8N:', err));
    }

    return { success: true, tenantId: tenant.id };
  } catch (error) {
    console.error('Erro ao salvar onboarding:', error);
    return { success: false, error };
  }
}
