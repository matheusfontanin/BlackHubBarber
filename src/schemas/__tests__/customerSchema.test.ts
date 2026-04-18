import { describe, it, expect } from 'vitest';
import { customerFormSchema } from '@/schemas/customerSchema';

describe('customerFormSchema', () => {
  it('aceita um cliente válido', () => {
    const result = customerFormSchema.safeParse({
      name: 'João Silva',
      phone: '(11) 98888-7777',
      email: 'joao@teste.com',
      notes: 'Prefere corte baixo',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita nome muito curto', () => {
    const result = customerFormSchema.safeParse({ name: 'A', phone: '(11) 98888-7777' });
    expect(result.success).toBe(false);
  });

  it('rejeita telefone muito curto', () => {
    const result = customerFormSchema.safeParse({ name: 'João', phone: '123' });
    expect(result.success).toBe(false);
  });

  it('normaliza email vazio para undefined', () => {
    const result = customerFormSchema.safeParse({
      name: 'João Silva',
      phone: '(11) 98888-7777',
      email: '',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeUndefined();
  });

  it('rejeita email inválido', () => {
    const result = customerFormSchema.safeParse({
      name: 'João Silva',
      phone: '(11) 98888-7777',
      email: 'invalido',
    });
    expect(result.success).toBe(false);
  });
});
