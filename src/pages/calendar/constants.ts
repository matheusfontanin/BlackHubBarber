import type { ElementType } from 'react';
import { Check, PlayCircle, CheckCircle2, UserX, XCircle } from 'lucide-react';
import type { AppointmentStatus } from '@/services/crudService';

export interface BarberPaletteEntry {
  dot: string;
  ring: string;
  text: string;
  bg: string;
  border: string;
}

export const BARBER_PALETTE: BarberPaletteEntry[] = [
  { dot: 'bg-[#11895C]', ring: 'ring-[#11895C]/30', text: 'text-[#11895C]', bg: 'bg-[#E8F6F0]', border: 'border-[#11895C]/25' },
  { dot: 'bg-[#2E6FE8]', ring: 'ring-[#2E6FE8]/30', text: 'text-[#2E6FE8]', bg: 'bg-[#EAF1FF]', border: 'border-[#2E6FE8]/25' },
  { dot: 'bg-[#9C7B47]', ring: 'ring-[#9C7B47]/30', text: 'text-[#9C7B47]', bg: 'bg-[#E9DEC9]', border: 'border-[#9C7B47]/25' },
  { dot: 'bg-[#B67A18]', ring: 'ring-[#B67A18]/30', text: 'text-[#B67A18]', bg: 'bg-[#FFF4DE]', border: 'border-[#B67A18]/25' },
  { dot: 'bg-[#D84A4A]', ring: 'ring-[#D84A4A]/30', text: 'text-[#D84A4A]', bg: 'bg-[#FDECEC]', border: 'border-[#D84A4A]/25' },
  { dot: 'bg-[#12100D]', ring: 'ring-[#12100D]/20', text: 'text-[#12100D]', bg: 'bg-[#F3F3F1]', border: 'border-[#DED8D1]' },
];

export const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:   'Agendado',
  confirmed:   'Confirmado',
  canceled:    'Cancelado',
  completed:   'Concluído',
  no_show:     'Não compareceu',
  in_progress: 'Em andamento',
};

/** Event chip color on calendar grid. */
export const STATUS_CHIP: Record<AppointmentStatus, string> = {
  scheduled:   'bg-[#E9DEC9] text-[#12100D] border-[#9C7B47]/30',
  confirmed:   'bg-[#E8F6F0] text-[#11895C] border-[#11895C]/25',
  canceled:    'bg-[#FDECEC] text-[#D84A4A] border-[#D84A4A]/25 opacity-70',
  completed:   'bg-[#F3F3F1] text-[#645F5C] border-[#DED8D1]',
  no_show:     'bg-[#FFF4DE] text-[#B67A18] border-[#B67A18]/25 opacity-70',
  in_progress: 'bg-[#EAF1FF] text-[#2E6FE8] border-[#2E6FE8]/25',
};

export const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled:   'bg-[#E9DEC9] text-[#9C7B47]',
  confirmed:   'bg-[#E8F6F0] text-[#11895C]',
  canceled:    'bg-[#FDECEC] text-[#D84A4A]',
  completed:   'bg-[#F3F3F1] text-[#645F5C]',
  no_show:     'bg-[#FFF4DE] text-[#B67A18]',
  in_progress: 'bg-[#EAF1FF] text-[#2E6FE8]',
};

export interface QuickAction {
  status: AppointmentStatus;
  label: string;
  icon: ElementType;
  classes: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { status: 'confirmed',   label: 'Confirmar', icon: Check,        classes: 'bg-[#E8F6F0] text-[#11895C] hover:bg-[#11895C]/15' },
  { status: 'in_progress', label: 'Iniciar',   icon: PlayCircle,   classes: 'bg-[#EAF1FF] text-[#2E6FE8] hover:bg-[#2E6FE8]/15' },
  { status: 'completed',   label: 'Concluir',  icon: CheckCircle2, classes: 'bg-[#E9DEC9] text-[#9C7B47] hover:bg-[#9C7B47]/15' },
  { status: 'no_show',     label: 'Falta',     icon: UserX,        classes: 'bg-[#FFF4DE] text-[#B67A18] hover:bg-[#B67A18]/15' },
  { status: 'canceled',    label: 'Cancelar',  icon: XCircle,      classes: 'bg-[#FDECEC] text-[#D84A4A] hover:bg-[#D84A4A]/15' },
];
