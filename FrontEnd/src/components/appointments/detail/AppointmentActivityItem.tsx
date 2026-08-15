import type { AppointmentActivity } from '@/types/appointmentDetail.types';

interface Props {
  record: AppointmentActivity;
  isLast?: boolean;
}

export const AppointmentActivityItem = ({ record, isLast = false }: Props) => (
  <article className={`relative flex gap-4 pb-8 ${isLast ? 'pb-0' : ''}`}>
    <div className="relative flex flex-col items-center">
      <span className="z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-sage-deep ring-2 ring-white" />
      {!isLast ? (
        <span className="absolute top-[18px] h-full w-px bg-border-sage" aria-hidden />
      ) : null}
    </div>

    <div className="min-w-0 flex-1 rounded-xl border border-border-sage bg-cream/20 p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <h4 className="font-serif text-base font-semibold text-ink">{record.title}</h4>
        <span className="shrink-0 text-xs text-ink-ghost">{record.date}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{record.description}</p>
      <p className="mt-2 text-xs text-ink-ghost">By {record.actor}</p>
    </div>
  </article>
);
