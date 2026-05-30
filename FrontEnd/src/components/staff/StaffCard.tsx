import type { StaffMember } from '@/pages/staff/data/mockStaff';

interface Props {
  member: StaffMember;
  onViewProfile: (member: StaffMember) => void;
}

export const StaffCard = ({ member, onViewProfile }: Props) => {
  const isOnDuty = member.status === 'On Duty';

  return (
    <div className="flex flex-col rounded-xl border border-border-sage bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${member.avatarClass}`}
          >
            {member.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif font-semibold text-ink">{member.name}</p>
            <p className="truncate text-xs text-ink-soft">{member.title}</p>
            <p className="mt-0.5 text-[11px] text-ink-ghost">#{member.id}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isOnDuty ? 'bg-success-bg text-success' : 'bg-cream text-ink-ghost'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOnDuty ? 'bg-success' : 'bg-ink-ghost'}`} />
          {member.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border-sage/80 py-3">
        <div className="text-center">
          <p className="text-base font-bold text-ink">{member.statPrimary.value}</p>
          <p className="text-[10px] text-ink-ghost">{member.statPrimary.label}</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-ink">{member.today}</p>
          <p className="text-[10px] text-ink-ghost">{member.todayLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-ink">{member.rating}★</p>
          <p className="text-[10px] text-ink-ghost">Rating</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {member.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-semibold text-sage-deep"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Today&apos;s Shift
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">{member.shift}</p>
        </div>
        <button
          type="button"
          onClick={() => onViewProfile(member)}
          className="cursor-pointer rounded-lg border border-border-sage px-3 py-1.5 text-xs font-semibold text-sage-deep hover:bg-sage-mist"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
