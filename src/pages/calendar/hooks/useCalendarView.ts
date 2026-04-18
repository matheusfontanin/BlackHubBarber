import { useState } from 'react';
import {
  addDays, addMonths, addWeeks,
  eachDayOfInterval, endOfMonth, endOfWeek,
  format, startOfMonth, startOfWeek,
  subDays, subMonths, subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CalendarView } from '../types';

function getDefaultView(): CalendarView {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
    return 'day';
  }
  return 'week';
}

export function useCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(getDefaultView);

  const navigateDate = (dir: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      if (view === 'day')  return dir === 'prev' ? subDays(prev, 1)   : addDays(prev, 1);
      if (view === 'week') return dir === 'prev' ? subWeeks(prev, 1)  : addWeeks(prev, 1);
      return                      dir === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
    });
  };

  const periodLabel = (): string => {
    if (view === 'day') return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, 'd MMM', { locale: ptBR })} – ${format(we, 'd MMM yyyy', { locale: ptBR })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  };

  const rangeISO = (): { from: string; to: string } => {
    if (view === 'day') {
      return {
        from: format(currentDate, "yyyy-MM-dd'T'00:00:00'Z'"),
        to:   format(currentDate, "yyyy-MM-dd'T'23:59:59'Z'"),
      };
    }
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        from: format(ws, "yyyy-MM-dd'T'00:00:00'Z'"),
        to:   format(we, "yyyy-MM-dd'T'23:59:59'Z'"),
      };
    }
    return {
      from: format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00'Z'"),
      to:   format(endOfMonth(currentDate),   "yyyy-MM-dd'T'23:59:59'Z'"),
    };
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end:   endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  return {
    currentDate,
    setCurrentDate,
    view,
    setView,
    navigateDate,
    periodLabel,
    rangeISO,
    weekDays,
  };
}
