import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { format, isSameDay, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/services/crudService';
import type { Barber } from '@/types/settings';
import { HOURS, STATUS_CHIP } from '../constants';
import { barberColor } from '../utils';

interface CalendarTimeGridProps {
  days: Date[];
  weekMode: boolean;
  appointments: Appointment[];
  barbers: Barber[];
  panelDate: Date;
  onDayHeaderClick: (day: Date) => void;
  onSlotClick: (day: Date, hour: number) => void;
  onAppointmentClick: (app: Appointment) => void;
}

export function CalendarTimeGrid({
  days,
  weekMode,
  appointments,
  barbers,
  panelDate,
  onDayHeaderClick,
  onSlotClick,
  onAppointmentClick,
}: CalendarTimeGridProps) {
  const gridCols = weekMode ? 'grid-cols-8' : 'grid-cols-[56px_1fr]';

  return (
    <div className="card overflow-hidden">
      <div className={cn('grid border-b border-border', gridCols)}>
        <div className="p-4 border-r border-border bg-sidebar/50" />
        {days.map((day) => (
          <button
            key={day.toString()}
            onClick={() => onDayHeaderClick(day)}
            className={cn(
              'p-4 text-center border-r border-border last:border-r-0 transition-colors cursor-pointer hover:bg-gold/[0.04]',
              isToday(day) && 'bg-gold/5',
              isSameDay(day, panelDate) && 'bg-gold/[0.07]',
            )}
          >
            <p className="text-[10px] uppercase tracking-widest font-bold text-faint mb-1">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p className={cn('text-xl font-mono font-bold', isToday(day) ? 'text-gold' : 'text-muted')}>
              {format(day, 'dd')}
            </p>
            {appointments.some((a) => isSameDay(parseISO(a.starts_at), day)) && (
              <div className="w-1.5 h-1.5 rounded-full bg-gold mx-auto mt-1 opacity-60" />
            )}
          </button>
        ))}
      </div>

      <div className={cn('grid h-[520px] lg:h-[600px] overflow-y-auto relative', gridCols)}>
        <div className="border-r border-border bg-sidebar/30">
          {HOURS.map((hour) => (
            <div key={hour} className="h-20 p-2 text-right border-b border-border">
              <span className="text-[10px] font-mono font-bold text-faint">{hour}:00</span>
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.toString()} className="relative border-r border-border last:border-r-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                onClick={() => onSlotClick(day, hour)}
                className="h-20 border-b border-border hover:bg-gold/[0.03] transition-colors cursor-pointer group"
              >
                <div className="opacity-0 group-hover:opacity-100 p-2 flex justify-end">
                  <Plus size={11} className="text-gold" />
                </div>
              </div>
            ))}

            {appointments
              .filter((app) => isSameDay(parseISO(app.starts_at), day))
              .map((app) => {
                const start = parseISO(app.starts_at);
                const top = (start.getHours() - 8) * 80 + (start.getMinutes() / 60) * 80;
                const duration = (parseISO(app.ends_at).getTime() - start.getTime()) / 60000;
                const height = Math.max((duration / 60) * 80, 28);
                const color = barberColor(app.barber_id, barbers);

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(app);
                    }}
                    className={cn(
                      'absolute left-1 right-1 p-2 rounded-lg shadow-md z-10 overflow-hidden cursor-pointer border-l-2 transition-all hover:brightness-110 hover:shadow-lg',
                      STATUS_CHIP[app.status] ?? STATUS_CHIP.scheduled,
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {app.barber_id && (
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
                      )}
                      <p className="text-[10px] font-bold leading-tight truncate">{app.clients?.name}</p>
                    </div>
                    <p className="text-[8px] opacity-70 uppercase tracking-tighter truncate">{app.services?.name}</p>
                    <p className="text-[8px] opacity-50 font-mono flex items-center gap-1 justify-between">
                      <span>{format(start, 'HH:mm')}</span>
                      {app.barbers?.name && (
                        <span className="truncate max-w-[60%]">{app.barbers.name}</span>
                      )}
                    </p>
                  </motion.div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
