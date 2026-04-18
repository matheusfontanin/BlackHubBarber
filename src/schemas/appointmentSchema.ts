import { z } from 'zod';

export const appointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'no_show',
  'canceled',
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  client_id: z.string().uuid(),
  service_id: z.string().uuid(),
  barber_id: z.string().uuid().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: appointmentStatusSchema,
  notes: z.string().max(2000).optional(),
  source: z.string().optional(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
