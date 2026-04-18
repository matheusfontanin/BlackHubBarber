import { z } from 'zod';

export const tenantBookingRulesSchema = z.object({
  tenant_id: z.string().uuid(),
  min_booking_notice_minutes: z.number().int().min(0).default(60),
  max_booking_notice_days: z.number().int().min(1).default(30),
  buffer_between_appointments_minutes: z.number().int().min(0).default(10),
  allow_simultaneous_per_barber: z.boolean().default(false),
  slot_granularity_minutes: z.number().int().min(5).default(15),
  reschedule_limit: z.number().int().min(0).default(2),
  reschedule_min_notice_hours: z.number().int().min(0).default(2),
  cancellation_min_notice_hours: z.number().int().min(0).default(2),
  cancellation_policy: z.string().optional(),
  no_show_penalty: z.string().optional(),
  no_show_blocks_future_bookings: z.boolean().default(false),
  no_show_max_before_block: z.number().int().min(1).default(2),
  send_reminder_hours_before: z.number().int().min(0).default(24),
  send_confirmation_on_booking: z.boolean().default(true),
  updated_at: z.string().optional(),
});

export type TenantBookingRules = z.infer<typeof tenantBookingRulesSchema>;