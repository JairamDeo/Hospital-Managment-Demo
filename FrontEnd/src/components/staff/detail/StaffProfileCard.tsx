import { Link } from 'react-router-dom';
import {
  Briefcase,
  FlaskConical,
  Mail,
  Phone,
  SquarePen,
  Stethoscope,
  UserCog,
  Headphones,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { formatPay } from '@/utils/staffCompensation.util';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { StaffProfileCardData } from '@/types/staffProfile.types';

interface Props {
  staff: StaffProfileCardData;
  onEdit?: () => void;
}

const ROLE_STYLES: Record<StaffProfileCardData['role'], string> = {
  Doctor: 'bg-violet-50 text-violet-700 ring-violet-200',
  Therapist: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Support: 'bg-blue-50 text-blue-700 ring-blue-200',
  Lab: 'bg-amber-50 text-amber-800 ring-amber-200',
};

const ROLE_ICONS: Record<StaffProfileCardData['role'], LucideIcon> = {
  Doctor: Stethoscope,
  Therapist: Briefcase,
  Support: Headphones,
  Lab: FlaskConical,
};

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-cream/60 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const StaffProfileCard = ({ staff, onEdit }: Props) => {
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
          {(staff.netMonthly ?? 0) > 0 ? (
            <DetailCell label="Net pay / mo" value={formatPay(staff.netMonthly!)} />
          ) : null}
          {staff.role === 'Doctor' && (staff.consultationFee ?? 0) > 0 ? (
            <DetailCell label="Consultation fee" value={formatPay(staff.consultationFee!)} />
          ) : null}
          {staff.registrationNumber ? (
            <DetailCell label="Reg. number" value={staff.registrationNumber} />
          ) : null}
        </div>

        {staff.qualifications?.length ? (
          <div className="rounded-lg border border-border-sage/80 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Qualifications
            </p>
            <ul className="mt-1 space-y-0.5">
              {staff.qualifications.map((q, i) => (
                <li key={i} className="text-sm text-ink-soft">
                  <span className="font-medium text-ink">{q.degree}</span>
                  <span className="text-ink-ghost"> · {q.level}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {staff.aadharNumber ? (
            <DetailCell label="Aadhar" value={`XXXX-XXXX-${staff.aadharNumber.slice(-4)}`} />
          ) : null}
          {staff.panNumber ? (
            <DetailCell label="PAN" value={staff.panNumber} />
          ) : null}
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

        <div className="flex flex-col gap-2">
          {onEdit ? (
            <Button
              variant="secondary"
              className="w-full gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-sm"
              onClick={onEdit}
            >
              <SquarePen className="h-4 w-4 shrink-0" strokeWidth={2} />
              Edit profile
            </Button>
          ) : null}
          <Link
            to={ROUTES.ADMIN_STAFF_COMPENSATION}
            className="block text-center text-xs font-semibold text-sage-deep hover:underline"
          >
            Manage compensation
          </Link>
        </div>
      </div>
    </div>
  );
};
