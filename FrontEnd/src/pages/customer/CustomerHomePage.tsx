import { Leaf } from 'lucide-react';
import { PrakritiBadge } from '@/components/patients/PrakritiBadge';
import { usePatientPortalAuth } from '@/hooks/usePatientPortalAuth';

export const CustomerHomePage = () => {
  const { patient } = usePatientPortalAuth();
  const prakritiLabel = patient?.prakritiName ?? patient?.prakriti;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-sage bg-gradient-to-br from-sage-mist/80 to-white p-6 shadow-sm">
        <p className="text-sm text-ink-soft">Welcome back</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">
          Namaste, {patient?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="mt-2 text-sm text-ink-ghost">
          Your Ayurveda wellness journey continues here.
        </p>
      </div>

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Quick overview
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Patient ID</dt>
            <dd className="font-medium text-ink">#{patient?.patientCode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Mobile</dt>
            <dd className="font-medium text-ink">+91 {patient?.mobileNumber}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-ink-soft">
              <Leaf className="h-4 w-4 text-sage-deep" strokeWidth={2} />
              Prakriti
            </dt>
            <dd>
              {prakritiLabel ? (
                <PrakritiBadge prakriti={prakritiLabel} />
              ) : (
                <span className="text-ink-ghost">Not set</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Treatment</dt>
            <dd className="font-medium text-ink">
              {patient?.treatmentName ?? patient?.treatment ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Email</dt>
            <dd className="truncate font-medium text-ink">{patient?.email || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Age / Gender</dt>
            <dd className="font-medium text-ink">
              {patient?.age} yrs · {patient?.gender}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default CustomerHomePage;
