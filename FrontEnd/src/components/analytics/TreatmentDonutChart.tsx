import { useEffect, useMemo, useState } from 'react';
import type { DonutSegment } from '@/pages/analytics/data/mockAnalytics';

interface Props {
  segments: DonutSegment[];
  centerValue: number;
  centerLabel: string;
}

const RADIUS = 72;
const STROKE = 22;
const SIZE = (RADIUS + STROKE) * 2;
const CENTER = RADIUS + STROKE;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TreatmentDonutChart = ({ segments, centerValue, centerLabel }: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const frame = requestAnimationFrame(() => setProgress(1));
    return () => cancelAnimationFrame(frame);
  }, [segments]);

  const arcs = useMemo(() => {
    let cumulative = 0;
    return segments.map((seg) => {
      const length = (seg.percent / 100) * CIRCUMFERENCE;
      const offset = -cumulative;
      cumulative += length;
      return { ...seg, length, offset };
    });
  }, [segments]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#eef7f2"
            strokeWidth={STROKE}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              strokeDasharray={`${arc.length * progress} ${CIRCUMFERENCE}`}
              strokeDashoffset={arc.offset}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-ink">{centerValue}</p>
          <p className="text-xs text-ink-soft">{centerLabel}</p>
        </div>
      </div>

      <div className="w-full min-w-[140px] space-y-2.5 sm:w-auto">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm text-ink-soft">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              {seg.label}
            </span>
            <span className="text-sm font-semibold text-ink">{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
