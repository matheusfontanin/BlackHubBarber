import { z } from 'zod';

export const toneOfVoiceSchema = z.enum(['profissional', 'descontraído', 'premium']);
export const serviceStyleSchema = z.enum(['direto', 'consultivo', 'acolhedor']);

export type ToneOfVoice = z.infer<typeof toneOfVoiceSchema>;
export type ServiceStyle = z.infer<typeof serviceStyleSchema>;

export const aiSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  assistant_name: z.string().min(2, 'Nome muito curto').max(30, 'Nome muito longo'),
  tone_of_voice: toneOfVoiceSchema,
  service_style: serviceStyleSchema,
  business_summary: z.string().max(1000).nullable(),
  customer_profile: z.string().max(500).nullable(),
  differentiators: z.string().max(1000).nullable(),
  important_notes: z.string().max(2000).nullable(),
  can_auto_schedule: z.boolean(),
  must_confirm_before_booking: z.boolean(),
  can_reply_outside_business_hours: z.boolean(),
  greeting_message: z.string().max(500).nullable(),
  out_of_hours_message: z.string().max(500).nullable(),
  updated_at: z.string().optional(),
});

export type AiSettings = z.infer<typeof aiSettingsSchema>;
