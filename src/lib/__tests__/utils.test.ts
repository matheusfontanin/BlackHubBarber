import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('concatena classes simples', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignora valores falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('respeita a precedência do twMerge para classes conflitantes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('aceita objetos no estilo clsx', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });

  it('faz merge de modificadores do tailwind', () => {
    expect(cn('text-sm font-bold', 'text-lg')).toBe('font-bold text-lg');
  });
});
