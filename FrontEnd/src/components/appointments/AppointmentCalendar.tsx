import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarDotType } from '@/pages/appointments/data/mockAppointments';
import { CALENDAR_DOTS } from '@/pages/appointments/data/mockAppointments';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DOT_COLORS: Record<CalendarDotType, string> = {
  upcoming: 'bg-warning',
  'checked-in': 'bg-success',
  panchakarma: 'bg-violet-500',
};

interface Props {
  month: number;
  year: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const AppointmentCalendar = ({
  month,
  year,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: Props) => {
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const rowCount = Math.ceil(cells.length / 7);

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-border-sage bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-4 py-2">
        <h3 className="text-sm font-bold text-ink">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-sage text-ink-soft hover:bg-sage-mist"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-sage text-ink-soft hover:bg-sage-mist"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-border-sage bg-cream/40 px-1.5 py-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-0.5 text-center text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
          >
            {d}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-7 gap-0.5 p-1.5"
        style={{ gridTemplateRows: `repeat(${rowCount}, minmax(2.5rem, 1fr))` }}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-full min-h-[2.5rem]" />;
          }

          const isSelected = day === selectedDay;
          const dots = month === 9 && year === 2023 ? CALENDAR_DOTS[day] ?? [] : [];

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex h-full min-h-[2.5rem] cursor-pointer flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-sage-deep text-white shadow-sm'
                  : 'text-ink-soft hover:bg-sage-mist/70'
              }`}
            >
              <span className="leading-none">{day}</span>
              {dots.length > 0 ? (
                <span className="mt-1 flex gap-0.5">
                  {dots.map((dot, j) => (
                    <span
                      key={j}
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/90' : DOT_COLORS[dot]}`}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border-sage px-4 py-2">
        <LegendDot color="bg-warning" label="Upcoming" />
        <LegendDot color="bg-success" label="Checked In" />
        <LegendDot color="bg-violet-500" label="Panchakarma" />
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5 text-xs text-ink-soft">
    <span className={`h-2 w-2 rounded-full ${color}`} />
    {label}
  </span>
);
