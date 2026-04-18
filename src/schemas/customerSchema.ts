import { z } from 'zod';

export const clientPreferencesSchema = z
  .object({
    corte_preferido: z.string().optional(),
    barba: z.string().optional(),
    barbeiro_favorito: z.string().optional(),
    produtos: z.array(z.string()).optional(),
    alergias: z.array(z.string()).optional(),
    observacoes: z.string().optional(),
    ultima_atualizacao_ia: z.string().optional(),
  })
  .partial();

export type ClientPreferences = z.infer<typeof clientPreferencesSchema>;

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(2, 'Nome muito curto').max(120),
  phone: z
    .string()
    .min(8, 'Telefone muito curto')
    .max(30, 'Telefone muito longo'),
  email: z
    .string()
    .email('E-mail inválido')
    .max(160)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  notes: z.string().max(2000).optional(),
  instagram_handle: z.string().max(60).optional(),
  birthday: z.string().optional(),
  preferences: clientPreferencesSchema.optional(),
  last_visit_at: z.string().optional(),
  total_visits: z.number().int().nonnegative().optional(),
  total_spent: z.number().nonnegative().optional(),
  loyalty_points: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

const optionalEmail = z
  .string()
  .max(160)
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'E-mail inválido',
  })
  .transform((v) => (v === '' ? undefined : v))
  .optional();

export const customerFormSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(120),
  phone: z.string().min(8, 'Telefone muito curto').max(30),
  email: optionalEmail,
  notes: z.string().max(2000).optional(),
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
