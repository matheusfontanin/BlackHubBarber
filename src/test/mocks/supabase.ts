import { vi } from 'vitest';

type QueryResult<T> = { data: T | null; error: { message: string } | null };

export interface MockQueryBuilder<T = unknown> {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  then: (resolve: (value: QueryResult<T>) => unknown) => unknown;
}

/**
 * Builder chainable que resolve para { data, error }. Todos os métodos de
 * filtro retornam o próprio builder para simular a API fluente do Supabase.
 */
export function createQueryBuilder<T = unknown>(result: QueryResult<T>): MockQueryBuilder<T> {
  const builder: Partial<MockQueryBuilder<T>> = {};
  const self = () => builder as MockQueryBuilder<T>;

  builder.select = vi.fn(() => self());
  builder.eq = vi.fn(() => self());
  builder.gte = vi.fn(() => self());
  builder.lte = vi.fn(() => self());
  builder.lt = vi.fn(() => self());
  builder.in = vi.fn(() => self());
  builder.order = vi.fn(() => self());
  builder.limit = vi.fn(() => self());
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.insert = vi.fn(() => self());
  builder.update = vi.fn(() => self());
  builder.upsert = vi.fn(() => self());
  builder.delete = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve) => resolve(result);

  return builder as MockQueryBuilder<T>;
}

export function createSupabaseMock(
  fromImpl: (table: string) => MockQueryBuilder = () => createQueryBuilder({ data: null, error: null }),
) {
  return {
    from: vi.fn((table: string) => fromImpl(table)),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  };
}
