import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PrescriptionEditor } from '@/components/prescriptions/PrescriptionEditor';
import { ROUTES, patientDetailPath } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';

export const PrescriptionPage = () => {
  const [searchParams] = useSearchParams();
  const patientCode = searchParams.get('patientCode') ?? '';
  const appointmentCode = searchParams.get('appointmentCode') ?? '';
  const { canCreatePrescription } = usePermissions();

  if (!patientCode) {
    return <Navigate to={ROUTES.ADMIN_PATIENTS} replace />;
  }

  if (!canCreatePrescription) {
    return <Navigate to={patientDetailPath(patientCode)} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <Link
        to={patientDetailPath(patientCode)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patient
      </Link>

      <h1 className="font-serif text-2xl font-bold text-sage-deep">New prescription</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Patient {patientCode}
        {appointmentCode ? ` · Visit ${appointmentCode}` : ''}
      </p>

      <div className="mt-5 rounded-xl border border-border-sage bg-white p-4 shadow-sm">
        <PrescriptionEditor patientCode={patientCode} appointmentCode={appointmentCode} />
      </div>
    </div>
  );
};

export default PrescriptionPage;
