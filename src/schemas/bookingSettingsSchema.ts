import { z } from 'zod';

export const bookingSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  min_booking_notice_minutes: z.number().int().min(0).max(7 * 24 * 60),
  max_booking_notice_days: z.number().int().min(1).max(365),
  buffer_between_appointments_minutes: z.number().int().min(0).max(240),
  allow_ai_booking: z.boolean(),
  require_manual_confirmation: z.boolean(),
  cancellation_policy: z.string().max(2000).nullable(),
  reschedule_limit: z.number().int().min(0).max(20),
  confirmation_message_template: z.string().max(1000).nullable(),
  cancellation_message_template: z.string().max(1000).nullable(),
  updated_at: z.string().optional(),
});

export type BookingSettings = z.infer<typeof bookingSettingsSchema>;
