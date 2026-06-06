import { ChevronDown, ChevronUp } from 'lucide-react';
import type { StaffActivityRecord } from '@/types/staffProfile.types';

const STATUS_STYLES = {
  Active: 'bg-success-bg text-success',
  Completed: 'bg-sage-mist text-ink-soft',
};

const TYPE_LABELS: Record<string, string> = {
  check_in: 'Check-in',
  check_out: 'Check-out',
  leave_applied: 'Leave applied',
  leave_approved: 'Leave approved',
  leave_rejected: 'Leave rejected',
};

interface Props {
  record: StaffActivityRecord;
  isLast?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export const StaffActivityItem = ({
  record,
  isLast = false,
  expanded = false,
  onToggle,
}: Props) => {
  const typeLabel = record.activityType ? TYPE_LABELS[record.activityType] : undefined;
  const hasDetails =
    Boolean(record.description) || record.tags.length > 0 || Boolean(typeLabel);

  return (
    <article className={`relative flex gap-2.5 pb-4 ${isLast ? 'pb-0' : ''}`}>
      <div className="relative flex flex-col items-center pt-1">
        <span
          className={`z-10 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${
            record.status === 'Active' ? 'bg-sage-deep' : 'bg-sage-pale'
          }`}
        />
        {!isLast ? (
          <span className="absolute top-3 h-[calc(100%-4px)] w-px bg-border-sage" aria-hidden />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 rounded-lg border border-border-sage/80 bg-cream/20 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={onToggle}
            disabled={!hasDetails}
            className={`min-w-0 flex-1 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
            aria-expanded={expanded}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-ink">{record.title}</h4>
                <p className="mt-0.5 text-[11px] text-ink-ghost">{record.dateRange}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[record.status]}`}
              >
                {record.status}
              </span>
            </div>
          </button>

          {hasDetails ? (
            <button
              type="button"
              onClick={onToggle}
              className="mt-0.5 shrink-0 cursor-pointer rounded-md p-1 text-ink-ghost hover:bg-sage-mist/60 hover:text-ink-soft"
              aria-label={expanded ? 'Collapse activity' : 'Expand activity'}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </button>
          ) : null}
        </div>

        {expanded ? (
          <>
            <p className="mt-1.5 text-xs leading-snug text-ink-soft">{record.description}</p>
            {record.tags.length > 0 || typeLabel ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {typeLabel ? (
                  <span className="rounded-full bg-sage-mist/80 px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                    {typeLabel}
                  </span>
                ) : null}
                {record.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sage-mist/80 px-2 py-0.5 text-[10px] font-medium text-sage-deep"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
};
