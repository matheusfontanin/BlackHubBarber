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
  { dot: 'bg-emerald-400', ring: 'ring-emerald-400/40', text: 'text-emerald-300', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30' },
  { dot: 'bg-blue-400',    ring: 'ring-blue-400/40',    text: 'text-blue-300',    bg: 'bg-blue-950/60',    border: 'border-blue-500/30' },
  { dot: 'bg-purple-400',  ring: 'ring-purple-400/40',  text: 'text-purple-300',  bg: 'bg-purple-950/60',  border: 'border-purple-500/30' },
  { dot: 'bg-pink-400',    ring: 'ring-pink-400/40',    text: 'text-pink-300',    bg: 'bg-pink-950/60',    border: 'border-pink-500/30' },
  { dot: 'bg-orange-400',  ring: 'ring-orange-400/40',  text: 'text-orange-300',  bg: 'bg-orange-950/60',  border: 'border-orange-500/30' },
  { dot: 'bg-cyan-400',    ring: 'ring-cyan-400/40',    text: 'text-cyan-300',    bg: 'bg-cyan-950/60',    border: 'border-cyan-500/30' },
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

export const STATUS_CHIP: Record<AppointmentStatus, string> = {
  scheduled:   'border-gold/60 bg-gold/20 text-gold',
  confirmed:   'border-emerald-400/60 bg-emerald-950/80 text-emerald-300',
  canceled:    'border-red-400/40 bg-red-950/60 text-red-300 opacity-50',
  completed:   'border-white/10 bg-surface text-muted',
  no_show:     'border-orange-400/40 bg-orange-950/60 text-orange-300 opacity-50',
  in_progress: 'border-blue-400/60 bg-blue-950/80 text-blue-300',
};

export const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled:   'bg-gold/10 text-gold border-gold/20',
  confirmed:   'bg-emerald-950/80 text-emerald-400 border-emerald-500/20',
  canceled:    'bg-red-950/80 text-red-400 border-red-500/20',
  completed:   'bg-surface2 text-muted border-border',
  no_show:     'bg-orange-950/80 text-orange-400 border-orange-500/20',
  in_progress: 'bg-blue-950/80 text-blue-400 border-blue-500/20',
};

export interface QuickAction {
  status: AppointmentStatus;
  label: string;
  icon: ElementType;
  classes: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { status: 'confirmed',   label: 'Confirmar', icon: Check,        classes: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/60 hover:border-emerald-400/60' },
  { status: 'in_progress', label: 'Iniciar',   icon: PlayCircle,   classes: 'border-blue-500/30 text-blue-400 hover:bg-blue-950/60 hover:border-blue-400/60' },
  { status: 'completed',   label: 'Concluir',  icon: CheckCircle2, classes: 'border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60' },
  { status: 'no_show',     label: 'Falta',     icon: UserX,        classes: 'border-orange-500/30 text-orange-400 hover:bg-orange-950/60 hover:border-orange-400/60' },
  { status: 'canceled',    label: 'Cancelar',  icon: XCircle,      classes: 'border-red-500/30 text-red-400 hover:bg-red-950/60 hover:border-red-400/60' },
];
