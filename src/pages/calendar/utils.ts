import type { Barber } from '@/types/settings';
import { BARBER_PALETTE, type BarberPaletteEntry } from './constants';

export function barberColor(
  id: string | undefined | null,
  all: Barber[],
): BarberPaletteEntry {
  if (!id) return BARBER_PALETTE[0];
  const idx = all.findIndex((b) => b.id === id);
  if (idx < 0) return BARBER_PALETTE[0];
  return BARBER_PALETTE[idx % BARBER_PALETTE.length];
}
