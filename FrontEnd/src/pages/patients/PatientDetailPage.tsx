import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { PatientProfileCard } from '@/components/patients/detail/PatientProfileCard';
import { PatientVitalsRow } from '@/components/patients/detail/PatientVitalsCard';
import { PatientActiveTreatmentCard } from '@/components/patients/detail/PatientActiveTreatmentCard';
import { PatientDetailTabs } from '@/components/patients/detail/PatientDetailTabs';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { buildPatientDetail } from '@/utils/buildPatientDetail';
import { mergeClinicalFromApi } from '@/utils/patientClinicalHelpers';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { masterService } from '@/services/master/master.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { detailToProfileForm } from '@/utils/patientHelpers';
import type { MasterItem } from '@/types/api.types';
import type { PatientClinicalProfile } from '@/types/patientClinical.types';
import type { PatientPrescriptionPdf } from '@/types/patientPrescription.types';
import type { PatientProfileFormValues } from '@/types/patient.types';
import type { PatientDetail, PatientDetailTab } from '@/types/patientDetail.types';
import { emptyClinicalProfile } from '@/utils/patientClinicalHelpers';

export const PatientDetailPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clinicalLoading, setClinicalLoading] = useState(true);
  const [savingClinical, setSavingClinical] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [clinical, setClinical] = useState<PatientClinicalProfile>(emptyClinicalProfile());
  const clinicalSnapshot = useRef<PatientClinicalProfile>(emptyClinicalProfile());
  const [clinicalEditing, setClinicalEditing] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<PatientProfileFormValues | null>(null);
  const [activeTab, setActiveTab] = useState<PatientDetailTab>('patient-info');
  const [prakritiMasters, setPrakritiMasters] = useState<MasterItem[]>([]);
  const [treatmentMasters, setTreatmentMasters] = useState<MasterItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PatientPrescriptionPdf[]>([]);
  const [rxLoading, setRxLoading] = useState(true);
  const [rxUploading, setRxUploading] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    if (!patientId) return;
    setRxLoading(true);
    try {
      const { data } = await patientAdminService.listPrescriptions(patientId);
      setPrescriptions(data.res?.prescriptions ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setPrescriptions([]);
    } finally {
      setRxLoading(false);
    }
  }, [patientId, showToast]);

  const applyPatient = useCallback((detail: PatientDetail, clinicalData: PatientClinicalProfile) => {
    setPatient(detail);
    setProfileForm(detailToProfileForm(detail));
    const merged = mergeClinicalFromApi(clinicalData);
    setClinical(merged);
    clinicalSnapshot.current = merged;
  }, []);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setClinicalLoading(true);
    try {
      const [overviewRes, prakritiRes, treatmentRes] = await Promise.all([
        patientAdminService.getOverview(patientId),
        masterService.listPrakriti(),
        masterService.listTreatments(),
      ]);
      if (overviewRes.data.status_code !== 200 || !overviewRes.data.res?.patient) {
        setPatient(null);
        return;
      }
      const detail = buildPatientDetail(overviewRes.data.res.patient, overviewRes.data.res.care);
      applyPatient(detail, overviewRes.data.res.clinical);
      setPrakritiMasters(prakritiRes.data.res?.items ?? []);
      setTreatmentMasters(treatmentRes.data.res?.items ?? []);
      void loadPrescriptions();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
      setPatient(null);
    } finally {
      setLoading(false);
      setClinicalLoading(false);
    }
  }, [patientId, showToast, loadPrescriptions, applyPatient]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.hash !== '#patient-info') return;
    setActiveTab('patient-info');
    setClinicalEditing(true);
    setProfileEditing(false);
    requestAnimationFrame(() => {
      document.getElementById('patient-detail-tabs')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [location.hash, patient?.id]);

  const startProfileEdit = () => {
    if (!patient) return;
    setProfileForm(detailToProfileForm(patient));
    setProfileEditing(true);
    setClinicalEditing(false);
  };

  const cancelProfileEdit = () => {
    if (patient) setProfileForm(detailToProfileForm(patient));
    setProfileEditing(false);
  };

  const startClinicalEdit = () => {
    clinicalSnapshot.current = clinical;
    setClinicalEditing(true);
    setProfileEditing(false);
    setActiveTab('patient-info');
  };

  const cancelClinicalEdit = () => {
    setClinical(clinicalSnapshot.current);
    setClinicalEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!patientId || !patient || !profileForm) return;
    setSavingProfile(true);
    try {
      const { data } = await patientAdminService.updateProfile(patientId, profileForm);
      if (data.status_code !== 200 || !data.res?.patient) {
        showToast(data.message || 'Could not save profile.', 'error');
        return;
      }
      const overviewRes = await patientAdminService.getOverview(patientId);
      if (overviewRes.data.res?.patient) {
        const detail = buildPatientDetail(overviewRes.data.res.patient, overviewRes.data.res.care);
        applyPatient(detail, overviewRes.data.res.clinical ?? clinical);
      }
      setProfileEditing(false);
      showToast('Patient profile saved', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not save profile.'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveClinical = async () => {
    if (!patientId || !patient) return;
    setSavingClinical(true);
    try {
      const { data } = await patientAdminService.updateClinical(patientId, clinical);
      if (data.status_code !== 200 || !data.res?.clinical) {
        showToast(data.message || 'Could not save patient info.', 'error');
        return;
      }
      const merged = mergeClinicalFromApi(data.res.clinical);
      setClinical(merged);
      clinicalSnapshot.current = merged;
      setClinicalEditing(false);
      showToast('Patient clinical info saved', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not save patient info.'), 'error');
    } finally {
      setSavingClinical(false);
    }
  };

  const handleUploadPrescription = async (file: File) => {
    if (!patientId) return;
    setRxUploading(true);
    try {
      const { data } = await patientAdminService.uploadPrescription(patientId, file);
      if (data.status_code === 201 && data.res?.prescription) {
        setPrescriptions((prev) => [data.res!.prescription, ...prev]);
        showToast('Prescription PDF uploaded', 'success');
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not upload PDF.'), 'error');
    } finally {
      setRxUploading(false);
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!patientId) return;
    if (!window.confirm('Remove this prescription PDF?')) return;
    try {
      const { data } = await patientAdminService.deletePrescription(patientId, id);
      if (data.status_code === 200) {
        setPrescriptions((prev) => prev.filter((p) => p.id !== id));
        showToast('Prescription removed', 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  if (!patientId) {
    return <Navigate to={ROUTES.ADMIN_PATIENTS} replace />;
  }

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading patient…</p>;
  }

  if (!patient || !profileForm) {
    return <Navigate to={ROUTES.ADMIN_PATIENTS} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full min-w-0 shrink-0 flex-col gap-4 lg:w-[min(100%,320px)] lg:max-w-[320px]">
          <PatientProfileCard
            patient={patient}
            editing={profileEditing}
            saving={savingProfile}
            profileForm={profileForm}
            prakritiMasters={prakritiMasters.filter((m) => m.active !== false)}
            treatmentMasters={treatmentMasters.filter((m) => m.active !== false)}
            onProfileFormChange={setProfileForm}
            onBookAppt={() => showToast('Appointment booking — coming soon', 'success')}
            onStartEdit={startProfileEdit}
            onCancelEdit={cancelProfileEdit}
            onSaveProfile={handleSaveProfile}
          />
          {patient.activeTreatment ? (
            <PatientActiveTreatmentCard treatment={patient.activeTreatment} />
          ) : null}
          <div className="hidden lg:block">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Current Vitals
            </h3>
            <PatientVitalsRow vitals={patient.vitals} layout="sidebar" />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <PatientDetailTabs
            patient={patient}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            clinical={{
              clinical,
              clinicalLoading,
              savingClinical,
              clinicalEditing,
              onClinicalChange: setClinical,
              onClinicalStartEdit: startClinicalEdit,
              onClinicalCancelEdit: cancelClinicalEdit,
              onClinicalSave: handleSaveClinical,
            }}
            prescriptions={{
              patientCode: patient.id,
              prescriptions,
              loading: rxLoading,
              uploading: rxUploading,
              onUpload: handleUploadPrescription,
              onDelete: handleDeletePrescription,
            }}
          />

          <div className="lg:hidden">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Current Vitals
            </h3>
            <PatientVitalsRow vitals={patient.vitals} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default PatientDetailPage;
