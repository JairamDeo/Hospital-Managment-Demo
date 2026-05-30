import {
  Briefcase,
  CalendarPlus,
  Mail,
  Phone,
  SquarePen,
  Stethoscope,
  UserCog,
  Pill,
  Headphones,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { StaffDetail } from '@/pages/staff/data/mockStaffDetails';
import type { StaffRole } from '@/pages/staff/data/mockStaff';

interface Props {
  staff: StaffDetail;
  onEdit: () => void;
  onSchedule: () => void;
}

const ROLE_STYLES: Record<StaffRole, string> = {
  Doctor: 'bg-violet-50 text-violet-700 ring-violet-200',
  Therapist: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Pharmacist: 'bg-amber-50 text-amber-700 ring-amber-200',
  Support: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const ROLE_ICONS: Record<StaffRole, LucideIcon> = {
  Doctor: Stethoscope,
  Therapist: Briefcase,
  Pharmacist: Pill,
  Support: Headphones,
};

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-cream/60 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const StaffProfileCard = ({ staff, onEdit, onSchedule }: Props) => {
  const RoleIcon = ROLE_ICONS[staff.role];
  const isOnDuty = staff.status === 'On Duty';

  return (
    <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
      <div className="bg-gradient-to-b from-sage-mist/80 to-white px-5 pb-5 pt-6 text-center">
        <div
          className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-bold ring-4 ring-white shadow-sm ${staff.avatarClass}`}
        >
          {staff.initials}
        </div>
        <h2 className="mt-3 font-serif text-xl font-semibold text-ink">{staff.name}</h2>
        <p className="mt-0.5 text-xs font-medium text-ink-soft">{staff.title}</p>
        <p className="mt-0.5 text-xs text-ink-ghost">#{staff.id}</p>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isOnDuty ? 'bg-success-bg text-success' : 'bg-cream text-ink-ghost'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnDuty ? 'bg-success' : 'bg-ink-ghost'}`} />
            {staff.status}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ROLE_STYLES[staff.role]}`}
          >
            <RoleIcon className="h-3 w-3" strokeWidth={2.25} />
            {staff.role}
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5">
        <div className="grid grid-cols-2 gap-2">
          <DetailCell label="Department" value={staff.department} />
          <DetailCell label="Experience" value={staff.experience} />
          <DetailCell label="Joined" value={staff.joinedDate} />
          <DetailCell label="Shift" value={staff.shift} />
        </div>

        <div className="space-y-2 rounded-xl border border-border-sage/80 bg-cream/30 p-3">
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Phone className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
            <span>{staff.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Mail className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
            <span className="truncate">{staff.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <UserCog className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
            <span>{staff.department}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {staff.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-sage-mist px-2.5 py-0.5 text-[10px] font-semibold text-sage-deep"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            className="w-full whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-[1.4]"
            onClick={onSchedule}
          >
            <CalendarPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
            View Schedule
          </Button>
          <Button
            variant="secondary"
            className="w-full gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-1"
            onClick={onEdit}
          >
            <SquarePen className="h-4 w-4 shrink-0" strokeWidth={2} />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};
