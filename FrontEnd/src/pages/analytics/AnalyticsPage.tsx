import { useState } from 'react';
import { AnalyticsStatCard } from '@/components/analytics/AnalyticsStatCard';
import { TimeRangeSwitcher } from '@/components/analytics/TimeRangeSwitcher';
import { OpdIpdBarChart } from '@/components/analytics/OpdIpdBarChart';
import { TreatmentDonutChart } from '@/components/analytics/TreatmentDonutChart';
import { TopDoctorsList } from '@/components/analytics/TopDoctorsList';
import { TreatmentDemandBars } from '@/components/analytics/TreatmentDemandBars';
import {
  DONUT_CENTER,
  KPI_STATS,
  OPD_IPD_MONTHLY,
  TOP_DOCTORS,
  TREATMENT_DEMAND,
  TREATMENT_DONUT,
  type TimeRange,
} from './data/mockAnalytics';

export const AnalyticsPage = () => {
  const [range, setRange] = useState<TimeRange>('30D');

  return (
    <div className="pb-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Hospital performance · October 2023</p>
        </div>
        <TimeRangeSwitcher value={range} onChange={setRange} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPI_STATS.map((stat) => (
          <AnalyticsStatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            OPD vs IPD — Monthly
          </h3>
          <OpdIpdBarChart key={range} data={OPD_IPD_MONTHLY} />
        </div>

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Treatment Distribution
          </h3>
          <TreatmentDonutChart
            key={range}
            segments={TREATMENT_DONUT}
            centerValue={DONUT_CENTER.value}
            centerLabel={DONUT_CENTER.label}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Top Doctors by Patients
          </h3>
          <TopDoctorsList doctors={TOP_DOCTORS} />
        </div>

        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Most Requested Treatments
          </h3>
          <TreatmentDemandBars key={range} items={TREATMENT_DEMAND} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
