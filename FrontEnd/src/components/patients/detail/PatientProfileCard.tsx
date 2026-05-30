import { CalendarPlus, Flame, Leaf, Mail, MapPin, Phone, SquarePen, Wind } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PatientStatusBadge } from '@/components/patients/PatientStatusBadge';
import type { PatientDetail } from '@/pages/patients/data/mockPatientDetails';
import type { PrakritiType } from '@/pages/patients/data/mockPatients';

interface Props {
  patient: PatientDetail;
  onBookAppt: () => void;
  onEdit: () => void;
}

const PRAKRITI_STYLES: Record<PrakritiType, string> = {
  Vata: 'bg-violet-50 text-violet-700 ring-violet-200',
  Pitta: 'bg-orange-50 text-orange-700 ring-orange-200',
  Kapha: 'bg-sage-mist text-sage-deep ring-border-sage',
};

const PRAKRITI_ICONS: Record<PrakritiType, typeof Flame> = {
  Vata: Wind,
  Pitta: Flame,
  Kapha: Leaf,
};

const DetailCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-cream/60 px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const PatientProfileCard = ({ patient, onBookAppt, onEdit }: Props) => {
  const PrakritiIcon = PRAKRITI_ICONS[patient.prakriti];

  return (
    <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
      <div className="bg-gradient-to-b from-sage-mist/80 to-white px-5 pb-5 pt-6 text-center">
        <div
          className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-bold ring-4 ring-white shadow-sm ${patient.avatarClass}`}
        >
          {patient.initials}
        </div>
        <h2 className="mt-3 font-serif text-xl font-semibold text-ink">{patient.name}</h2>
        <p className="mt-0.5 text-xs font-medium text-ink-ghost">#{patient.id}</p>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          <PatientStatusBadge status={patient.status} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${PRAKRITI_STYLES[patient.prakriti]}`}
          >
            <PrakritiIcon className="h-3 w-3" strokeWidth={2.25} />
            {patient.prakriti} Prakriti
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5">
        <div className="grid grid-cols-2 gap-2">
          <DetailCell label="Age" value={`${patient.age} yrs`} />
          <DetailCell label="Gender" value={patient.gender} />
          <DetailCell label="Blood" value={patient.bloodGroup} />
          <DetailCell label="Since" value={patient.memberSince} />
        </div>

        <div className="space-y-2 rounded-xl border border-border-sage/80 bg-cream/30 p-3">
          {patient.mobile ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Phone className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
              <span>{patient.mobile}</span>
            </div>
          ) : null}
          {patient.email ? (
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Mail className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
              <span className="truncate">{patient.email}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-ghost" strokeWidth={2} />
            <span>{patient.city}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button
            className="w-full whitespace-nowrap rounded-xl py-2.5 text-sm sm:flex-[1.4]"
            onClick={onBookAppt}
          >
            <CalendarPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
            Book Appt.
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
