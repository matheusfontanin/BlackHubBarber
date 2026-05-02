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
  const gridCols = weekMode ? 'grid-cols-8' : 'grid-cols-[64px_1fr]';

  return (
    <div className="card overflow-hidden">
      <div className={cn('grid border-b border-line bg-[#F8F8F7]', gridCols)}>
        <div className="p-3 border-r border-line" />
        {days.map((day) => (
          <button
            key={day.toString()}
            onClick={() => onDayHeaderClick(day)}
            className={cn(
              'p-3 text-center border-r border-line last:border-r-0 transition-colors cursor-pointer hover:bg-white',
              isToday(day) && 'bg-white',
              isSameDay(day, panelDate) && 'bg-gold-soft/50',
            )}
          >
            <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-faint mb-0.5">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p className={cn('text-lg font-bold', isToday(day) ? 'text-[#BE9B64]' : 'text-ink')}>
              {format(day, 'dd')}
            </p>
            {appointments.some((a) => isSameDay(parseISO(a.starts_at), day)) && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#BE9B64] mx-auto mt-1 opacity-70" />
            )}
          </button>
        ))}
      </div>

      <div className={cn('grid h-[520px] lg:h-[600px] overflow-y-auto relative bg-white', gridCols)}>
        <div className="border-r border-line">
          {HOURS.map((hour) => (
            <div key={hour} className="h-20 px-2 pt-1 text-right border-b border-line">
              <span className="text-[11px] font-medium text-ink-faint">{hour}:00</span>
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.toString()} className="relative border-r border-line last:border-r-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                onClick={() => onSlotClick(day, hour)}
                className="h-20 border-b border-line hover:bg-[#FBFAF8] transition-colors cursor-pointer group"
              >
                <div className="opacity-0 group-hover:opacity-100 p-1.5 flex justify-end">
                  <Plus size={12} className="text-[#BE9B64]" />
                </div>
              </div>
            ))}

            {appointments
              .filter((app) => isSameDay(parseISO(app.starts_at), day))
              .map((app) => {
                const start = parseISO(app.starts_at);
                const top = (start.getHours() - 8) * 80 + (start.getMinutes() / 60) * 80;
                const duration = (parseISO(app.ends_at).getTime() - start.getTime()) / 60000;
                const height = Math.max((duration / 60) * 80, 32);
                const color = barberColor(app.barber_id, barbers);

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(app);
                    }}
                    className={cn(
                      'absolute left-1.5 right-1.5 p-2 rounded-xl z-10 overflow-hidden cursor-pointer border transition-colors',
                      STATUS_CHIP[app.status] ?? STATUS_CHIP.scheduled,
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {app.barber_id && (
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
                      )}
                      <p className="text-[11px] font-semibold leading-tight truncate">
                        {app.clients?.name}
                      </p>
                    </div>
                    <p className="text-[10px] opacity-80 truncate mt-0.5">{app.services?.name}</p>
                    <p className="text-[10px] opacity-70 font-medium flex items-center gap-1 justify-between mt-0.5">
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
