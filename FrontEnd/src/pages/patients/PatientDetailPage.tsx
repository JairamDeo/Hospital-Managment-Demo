import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PatientFormModal } from '@/components/modals/PatientFormModal';
import { PatientProfileCard } from '@/components/patients/detail/PatientProfileCard';
import { PatientVitalsRow } from '@/components/patients/detail/PatientVitalsCard';
import { PatientActiveTreatmentCard } from '@/components/patients/detail/PatientActiveTreatmentCard';
import { PatientDetailTabs } from '@/components/patients/detail/PatientDetailTabs';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { buildPatientDetail } from './data/mockPatientDetails';
import { MOCK_PATIENTS, type PatientFormValues } from './data/mockPatients';
import { formToPatient, patientToForm } from '@/utils/patientHelpers';

export const PatientDetailPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [patients, setPatients] = useState(MOCK_PATIENTS);

  const patient = useMemo(() => {
    const base = patients.find((p) => p.id === patientId);
    return base ? buildPatientDetail(base) : null;
  }, [patientId, patients]);

  if (!patientId || !patient) {
    return <Navigate to={ROUTES.PATIENTS} replace />;
  }

  const formInitial = patientToForm(patient);

  const handleEditSubmit = (values: PatientFormValues) => {
    const updated = formToPatient(values, patient.id, patient);
    setPatients((prev) => prev.map((p) => (p.id === patient.id ? updated : p)));
    setEditOpen(false);
    showToast('Patient updated successfully', 'success');
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <PatientProfileCard
            patient={patient}
            onBookAppt={() => showToast('Appointment booking — coming soon', 'success')}
            onEdit={() => setEditOpen(true)}
          />
          {patient.activeTreatment ? (
            <PatientActiveTreatmentCard treatment={patient.activeTreatment} />
          ) : null}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <PatientDetailTabs patient={patient} />
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Current Vitals
            </h3>
            <PatientVitalsRow vitals={patient.vitals} />
          </div>
        </section>
      </div>

      <PatientFormModal
        key={`edit-${patient.id}`}
        open={editOpen}
        mode="edit"
        initial={formInitial}
        patientId={patient.id}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default PatientDetailPage;
