import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  History,
  Pill,
  Receipt,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { MasterItem } from '@/types/api.types';
import type { PatientDetail, PatientDetailTab } from '@/types/patientDetail.types';
import type { PatientClinicalProfile } from '@/types/patientClinical.types';
import type { PatientPrescriptionPdf } from '@/types/patientPrescription.types';
import { PatientClinicalInfoPanel } from './PatientClinicalInfoPanel';
import { TreatmentHistoryItem } from './TreatmentHistoryItem';
import {
  PatientAppointmentsTab,
  PatientLabReportsTab,
  PatientBillingTab,
  PatientDocumentsTab,
} from './tabs/PatientTabPanels';
import { PatientPrescriptionsTab } from './tabs/PatientPrescriptionsTab';

const MAIN_TABS: { id: PatientDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'patient-info', label: 'Patient Info', icon: ClipboardList },
  { id: 'history', label: 'Treatment History', icon: History },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'labs', label: 'Lab Reports', icon: FlaskConical },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'documents', label: 'Documents', icon: FileText },
];

interface ClinicalProps {
  clinical: PatientClinicalProfile;
  clinicalLoading: boolean;
  savingClinical: boolean;
  clinicalEditing: boolean;
  onClinicalChange: (clinical: PatientClinicalProfile) => void;
  onClinicalStartEdit: () => void;
  onClinicalCancelEdit: () => void;
  onClinicalSave: () => void | Promise<void>;
}

interface PrescriptionProps {
  patientCode: string;
  prescriptions: PatientPrescriptionPdf[];
  loading: boolean;
  uploading: boolean;
  readOnly?: boolean;
  onUpload: (file: File) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

interface Props {
  patient: PatientDetail;
  activeTab?: PatientDetailTab;
  onTabChange?: (tab: PatientDetailTab) => void;
  clinical?: ClinicalProps;
  prakritiMasters?: MasterItem[];
  prescriptions?: PrescriptionProps;
}

export const PatientDetailTabs = ({
  patient,
  activeTab: controlledTab,
  onTabChange,
  clinical,
  prakritiMasters = [],
  prescriptions,
}: Props) => {
  const [internalTab, setInternalTab] = useState<PatientDetailTab>('patient-info');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: PatientDetailTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  useEffect(() => {
    if (controlledTab) setInternalTab(controlledTab);
  }, [controlledTab]);

  useEffect(() => {
    if (window.location.hash !== '#patient-info') return;
    if (onTabChange) onTabChange('patient-info');
    else setInternalTab('patient-info');
    requestAnimationFrame(() => {
      document.getElementById('patient-detail-tabs')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [onTabChange]);

  return (
    <div
      id="patient-detail-tabs"
      className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm scroll-mt-4"
    >
      <div className="border-b border-border-sage bg-gradient-to-r from-cream/60 via-white to-cream/40 px-3 py-3 sm:px-5">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin rounded-xl bg-sage-mist/40 p-1">
          {MAIN_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-3.5 sm:text-sm ${
                  active
                    ? 'bg-white text-sage-deep shadow-sm ring-1 ring-border-sage/80'
                    : 'text-ink-soft hover:bg-white/70 hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === 'patient-info' && clinical ? (
          <PatientClinicalInfoPanel
            clinical={clinical.clinical}
            prakritiMasters={prakritiMasters}
            loading={clinical.clinicalLoading}
            saving={clinical.savingClinical}
            editing={clinical.clinicalEditing}
            onChange={clinical.onClinicalChange}
            onStartEdit={clinical.onClinicalStartEdit}
            onCancelEdit={clinical.onClinicalCancelEdit}
            onSave={clinical.onClinicalSave}
          />
        ) : null}

        {activeTab === 'patient-info' && !clinical ? (
          <p className="py-8 text-center text-sm text-ink-soft">Clinical data unavailable.</p>
        ) : null}

        {activeTab === 'history' ? (
          <div className="space-y-0">
            {patient.treatmentHistory.map((record, i) => (
              <TreatmentHistoryItem
                key={record.id}
                record={record}
                isLast={i === patient.treatmentHistory.length - 1}
              />
            ))}
          </div>
        ) : null}

        {activeTab === 'appointments' ? (
          <PatientAppointmentsTab appointments={patient.appointments} />
        ) : null}

        {activeTab === 'prescriptions' && prescriptions ? (
          <PatientPrescriptionsTab
            patientCode={prescriptions.patientCode}
            prescriptions={prescriptions.prescriptions}
            loading={prescriptions.loading}
            uploading={prescriptions.uploading}
            readOnly={prescriptions.readOnly}
            onUpload={prescriptions.onUpload}
            onDelete={prescriptions.onDelete}
          />
        ) : null}

        {activeTab === 'prescriptions' && !prescriptions ? (
          <p className="py-8 text-center text-sm text-ink-soft">Prescriptions unavailable.</p>
        ) : null}

        {activeTab === 'labs' ? <PatientLabReportsTab reports={patient.labReports} /> : null}

        {activeTab === 'billing' ? <PatientBillingTab invoices={patient.invoices} /> : null}

        {activeTab === 'documents' ? <PatientDocumentsTab documents={patient.documents} /> : null}
      </div>
    </div>
  );
};
