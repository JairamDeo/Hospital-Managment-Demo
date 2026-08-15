import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Patient } from '@/types/patient.types';
import { PrakritiBadge } from '@/components/patients/PrakritiBadge';
import { PatientStatusBadge } from '@/components/patients/PatientStatusBadge';

interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onEdit: () => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-1 text-sm font-medium text-ink">{value || '—'}</p>
  </div>
);

export const PatientViewModal = ({ open, patient, onClose, onEdit }: Props) => {
  if (!patient) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Patient Details"
      subtitle={`#${patient.id}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit Patient</Button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-sage-mist/50 p-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${patient.avatarClass}`}
        >
          {patient.initials}
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink">{patient.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <PrakritiBadge prakriti={patient.prakriti} />
            <PatientStatusBadge status={patient.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patient ID" value={`#${patient.id}`} />
        <Field label="Age" value={`${patient.age} yrs`} />
        <Field label="Last Visit" value={patient.lastVisit} />
        <Field label="Treatment" value={patient.treatment} />
        <Field label="Mobile" value={patient.mobile} />
        <Field label="Email" value={patient.email} />
      </div>
    </Modal>
  );
};
