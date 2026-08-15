import { CalendarCheck, Phone, SquarePen, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { patientDetailPath, staffDetailPath } from '@/constants/routes';
import type { AppointmentDetail } from '@/types/appointmentDetail.types';

interface Props {
  appointment: AppointmentDetail;
  onReschedule: () => void;
  onEdit?: () => void;
}

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-cream/60 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const AppointmentProfileCard = ({ appointment, onReschedule, onEdit }: Props) => (
  <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
    <div className="bg-gradient-to-b from-sage-mist/80 to-white px-5 pb-5 pt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-deep text-white shadow-sm">
        <CalendarCheck className="h-6 w-6" strokeWidth={2} />
      </div>
      <h2 className="mt-3 font-serif text-xl font-semibold text-ink">{appointment.id}</h2>
      <p className="mt-0.5 text-xs text-ink-ghost">
        {appointment.formattedDate} · {appointment.formattedTime}
      </p>
      <div className="mt-2.5 flex justify-center">
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <p className="mt-3 text-sm font-medium text-sage-deep">{appointment.type}</p>
    </div>

    <div className="space-y-3 px-5 pb-5">
      <div className="flex items-center gap-3 rounded-xl border border-border-sage/80 bg-cream/30 p-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${appointment.avatarClass}`}
        >
          {appointment.initials}
        </div>
        <div className="min-w-0">
          <Link
            to={patientDetailPath(appointment.patientId)}
            className="truncate font-serif text-sm font-semibold text-sage-deep hover:underline"
          >
            {appointment.patientName}
          </Link>
          <p className="text-xs text-ink-ghost">
            #{appointment.patientId}
            {appointment.patientPrakriti ? ` · ${appointment.patientPrakriti}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DetailCell label="Doctor" value={appointment.doctor} />
        <DetailCell label="Room" value={appointment.room} />
        <DetailCell label="Duration" value={appointment.duration} />
        <DetailCell label="Department" value={appointment.department} />
      </div>

      <div className="space-y-2 rounded-xl border border-border-sage/80 bg-cream/30 p-3">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Phone className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
          <span>{appointment.patientPhone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
          <Link
            to={staffDetailPath(appointment.doctorId)}
            className="truncate font-medium text-sage-deep hover:underline"
          >
            {appointment.doctor}
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button
          className="w-full whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-[1.4]"
          onClick={onReschedule}
        >
          <CalendarCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
          Reschedule
        </Button>
        {onEdit ? (
          <Button
            variant="secondary"
            className="w-full gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-1"
            onClick={onEdit}
          >
            <SquarePen className="h-4 w-4 shrink-0" strokeWidth={2} />
            Edit
          </Button>
        ) : null}
      </div>
    </div>
  </div>
);
