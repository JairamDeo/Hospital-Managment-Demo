import { useEffect, useMemo, useState } from 'react';
import type { MonthlyOpdIpd } from '@/pages/analytics/data/mockAnalytics';

interface Props {
  data: MonthlyOpdIpd[];
}

export const OpdIpdBarChart = ({ data }: Props) => {
  const [animate, setAnimate] = useState(false);
  const max = useMemo(
    () => Math.max(...data.flatMap((d) => [d.opd, d.ipd]), 1),
    [data]
  );

  useEffect(() => {
    setAnimate(false);
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-sm bg-sage-deep" />
          IPD Patients
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-sm bg-sage-pale" />
          OPD Patients
        </span>
      </div>

      <div className="flex min-h-[200px] flex-1 items-end justify-between gap-2 px-1 pt-2">
        {data.map((d) => {
          const ipdPct = (d.ipd / max) * 100;
          const opdPct = (d.opd / max) * 100;
          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[180px] w-full max-w-[52px] items-end justify-center gap-1">
                <div
                  className="w-[42%] rounded-t-md bg-sage-deep transition-[height] duration-1000 ease-out"
                  style={{ height: animate ? `${ipdPct}%` : '0%' }}
                  title={`IPD: ${d.ipd}`}
                />
                <div
                  className="w-[42%] rounded-t-md bg-sage-pale transition-[height] duration-1000 ease-out"
                  style={{ height: animate ? `${opdPct}%` : '0%' }}
                  title={`OPD: ${d.opd}`}
                />
              </div>
              <span className="text-[11px] font-medium text-ink-soft">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
