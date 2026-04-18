import { z } from 'zod';

export const tenantSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  owner_name: z.string().max(120).nullable(),
  business_phone: z.string().max(30).nullable(),
  business_email: z.string().email('E-mail inválido').max(160).nullable().or(z.literal('').transform(() => null)),
  address: z.string().max(240).nullable(),
  city: z.string().max(120).nullable(),
  state: z.string().max(40).nullable(),
  instagram_handle: z.string().max(60).nullable(),
  description: z.string().max(1000).nullable(),
  business_style: z.string().max(120).nullable(),
  target_audience: z.string().max(240).nullable(),
  differentiators: z.string().max(1000).nullable(),
  updated_at: z.string().optional(),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
