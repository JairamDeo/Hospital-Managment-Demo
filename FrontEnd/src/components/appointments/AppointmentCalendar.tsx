import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, CalendarDotType } from '@/types/appointment.types';
import { buildCalendarDots } from '@/utils/appointmentHelpers';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DOT_COLORS: Record<CalendarDotType, string> = {
  upcoming: 'bg-warning',
  'checked-in': 'bg-success',
  panchakarma: 'bg-violet-500',
};

interface Props {
  month: number;
  year: number;
  selectedDay: number;
  appointments?: Appointment[];
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  compact?: boolean;
}

export const AppointmentCalendar = ({
  month,
  year,
  selectedDay,
  appointments = [],
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  compact = false,
}: Props) => {
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDots = useMemo(
    () => buildCalendarDots(appointments, month, year),
    [appointments, month, year]
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const cellMinH = compact ? 'min-h-[1.75rem]' : 'min-h-[2.5rem]';

  return (
    <div className="flex w-full flex-col rounded-xl border border-border-sage bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-3 py-1.5">
        <h3 className="text-xs font-bold text-ink">{monthLabel}</h3>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onPrevMonth}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border-sage text-ink-soft hover:bg-sage-mist"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border-sage text-ink-soft hover:bg-sage-mist"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-border-sage bg-cream/40 px-1 py-0.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-ink-ghost"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px p-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className={cellMinH} />;
          }

          const isSelected = day === selectedDay;
          const dots = calendarDots[day] ?? [];

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex ${cellMinH} cursor-pointer flex-col items-center justify-center rounded-md text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-sage-deep text-white shadow-sm'
                  : 'text-ink-soft hover:bg-sage-mist/70'
              }`}
            >
              <span className="leading-none">{day}</span>
              {dots.length > 0 ? (
                <span className="mt-0.5 flex gap-px">
                  {dots.slice(0, 3).map((dot, j) => (
                    <span
                      key={j}
                      className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white/90' : DOT_COLORS[dot]}`}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border-sage px-3 py-1.5">
        <LegendDot color="bg-warning" label="Pending" />
        <LegendDot color="bg-success" label="In" />
        <LegendDot color="bg-violet-500" label="PK" />
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1 text-[10px] text-ink-soft">
    <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
    {label}
  </span>
);
