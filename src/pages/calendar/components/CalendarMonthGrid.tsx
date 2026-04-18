import {
  eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isToday, parseISO, startOfMonth, startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/services/crudService';

interface CalendarMonthGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (day: Date) => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function CalendarMonthGrid({ currentDate, appointments, onDayClick }: CalendarMonthGridProps) {
  const firstDay = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const lastDay = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-3 text-center text-[10px] font-bold uppercase tracking-widest text-faint border-r last:border-r-0 border-border">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {week.map((day) => {
            const dayApps = appointments.filter((a) => isSameDay(parseISO(a.starts_at), day));
            const inMonth = day.getMonth() === currentDate.getMonth();
            return (
              <div
                key={day.toString()}
                onClick={() => onDayClick(day)}
                className={cn(
                  'min-h-[90px] p-2 border-r last:border-r-0 border-border cursor-pointer hover:bg-gold/[0.03] transition-colors',
                  !inMonth && 'opacity-30',
                  isToday(day) && 'bg-gold/5',
                )}
              >
                <p className={cn('text-sm font-mono font-bold mb-1', isToday(day) ? 'text-gold' : 'text-muted')}>
                  {format(day, 'd')}
                </p>
                <div className="space-y-0.5">
                  {dayApps.slice(0, 3).map((app) => (
                    <p key={app.id} className="text-[9px] font-bold bg-gold/10 border border-gold/20 text-gold rounded px-1 truncate">
                      {format(parseISO(app.starts_at), 'HH:mm')} {app.clients?.name}
                    </p>
                  ))}
                  {dayApps.length > 3 && (
                    <p className="text-[9px] text-gold/50 font-bold">+{dayApps.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
