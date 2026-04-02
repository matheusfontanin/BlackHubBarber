import { supabase } from '@/lib/supabase/client';
import { BarbershopFormData, Service, DayHours } from '@/types/onboarding';
import type { TeamBarber } from '@/components/onboarding/TeamStep';
import type { AiStepData } from '@/components/onboarding/AiStep';

export interface OnboardingData extends BarbershopFormData {
  whatsappInstanceName?: string;
  googleCalendarConnected?: boolean;
  services: Service[];
  businessHours: DayHours[];
  team?: TeamBarber[];
  aiSettings?: AiStepData;
}

export async function saveOnboardingData(data: OnboardingData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado');

    // 1. Criar tenant
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

    // 2. Criar membro (owner)
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    // 3. Criar serviços
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

    // 4. Criar tenant_settings (dados complementares)
    const { error: settingsError } = await supabase
      .from('tenant_settings')
      .insert({
        tenant_id: tenant.id,
        owner_name: data.ownerName,
        business_phone: data.phone,
        business_email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        instagram_handle: data.instagram ?? null,
      });

    if (settingsError) console.error('Aviso: erro ao salvar tenant_settings:', settingsError);

    // 5. Criar barbeiros (se preenchido)
    if (data.team && data.team.length > 0) {
      const { error: barbersError } = await supabase
        .from('barbers')
        .insert(
          data.team.map(barber => ({
            tenant_id: tenant.id,
            name: barber.name,
            role: barber.role,
            specialties: barber.specialties || null,
            is_active: true,
          }))
        );

      if (barbersError) console.error('Aviso: erro ao salvar barbeiros:', barbersError);
    }

    // 6. Criar AI settings (se preenchido)
    if (data.aiSettings) {
      const ai = data.aiSettings;
      const { error: aiError } = await supabase
        .from('tenant_ai_settings')
        .insert({
          tenant_id: tenant.id,
          assistant_name: ai.assistantName || 'Assistente',
          tone_of_voice: ai.toneOfVoice || 'profissional',
          service_style: ai.serviceStyle || 'direto',
          business_summary: ai.businessSummary || null,
          customer_profile: ai.targetAudience || null,
          differentiators: ai.differentiators || null,
          important_notes: ai.importantNotes || null,
        });

      if (aiError) console.error('Aviso: erro ao salvar AI settings:', aiError);
    }

    // 7. Criar booking settings (padrão)
    const { error: bookingError } = await supabase
      .from('tenant_booking_settings')
      .insert({
        tenant_id: tenant.id,
        min_booking_notice_minutes: 60,
        max_booking_notice_days: 30,
        buffer_between_appointments_minutes: 10,
        allow_ai_booking: false,
        require_manual_confirmation: true,
        reschedule_limit: 2,
      });

    if (bookingError) console.error('Aviso: erro ao salvar booking settings:', bookingError);

    // 8. Notificar N8N (se webhook configurado)
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
