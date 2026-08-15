import type { TreatmentRecord } from '@/types/patientDetail.types';

const STATUS_STYLES = {
  Active: 'bg-success-bg text-success ring-success/20',
  Completed: 'bg-sage-mist text-ink-soft ring-border-sage',
};

interface Props {
  record: TreatmentRecord;
  isLast?: boolean;
}

export const TreatmentHistoryItem = ({ record, isLast = false }: Props) => (
  <article className={`relative flex gap-4 pb-8 ${isLast ? 'pb-0' : ''}`}>
    <div className="relative flex flex-col items-center">
      <span
        className={`z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-2 ring-white ${
          record.status === 'Active' ? 'bg-sage-deep' : 'bg-sage-pale'
        }`}
      />
      {!isLast ? (
        <span className="absolute top-[18px] h-full w-px bg-border-sage" aria-hidden />
      ) : null}
    </div>

    <div className="min-w-0 flex-1 rounded-xl border border-border-sage bg-cream/20 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-serif text-base font-semibold text-ink">{record.title}</h4>
          <p className="mt-1 text-xs text-ink-soft">
            {record.doctor}
            {record.status === 'Active' ? ' · Ongoing' : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-xs text-ink-ghost">{record.dateRange}</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[record.status]}`}
          >
            {record.status}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{record.description}</p>
      {record.medicines.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {record.medicines.map((med) => (
            <span
              key={med}
              className="inline-flex rounded-full border border-sage-pale bg-white px-2.5 py-0.5 text-xs font-medium text-sage-deep"
            >
              {med}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  </article>
);
