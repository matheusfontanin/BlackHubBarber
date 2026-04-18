import { z } from 'zod';

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(2, 'Nome muito curto').max(80),
  price: z.number().nonnegative('Preço inválido'),
  duration_minutes: z.number().int().positive('Duração inválida').max(12 * 60),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

export type Service = z.infer<typeof serviceSchema>;
