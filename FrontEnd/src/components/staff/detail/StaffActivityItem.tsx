import type { StaffActivity } from '@/pages/staff/data/mockStaffDetails';

const STATUS_STYLES = {
  Active: 'bg-success-bg text-success ring-success/20',
  Completed: 'bg-sage-mist text-ink-soft ring-border-sage',
};

interface Props {
  record: StaffActivity;
  isLast?: boolean;
}

export const StaffActivityItem = ({ record, isLast = false }: Props) => (
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
          <p className="mt-1 text-xs text-ink-ghost">{record.dateRange}</p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[record.status]}`}
        >
          {record.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{record.description}</p>
      {record.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {record.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border border-sage-pale bg-white px-2.5 py-0.5 text-xs font-medium text-sage-deep"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  </article>
);
