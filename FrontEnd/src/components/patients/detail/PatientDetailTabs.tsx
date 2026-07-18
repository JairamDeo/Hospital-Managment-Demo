import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  History,
  Pill,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { MasterItem } from '@/types/api.types';
import type { PatientDetail, PatientDetailTab } from '@/types/patientDetail.types';
import type { PatientClinicalProfile } from '@/types/patientClinical.types';
import type { StructuredPrescription } from '@/types/structuredPrescription.types';
import type { PatientVitalsEntry } from '@/types/patientVitals.types';
import { PatientClinicalInfoPanel } from './PatientClinicalInfoPanel';
import {
  PatientLabReportsTab,
  PatientBillingTab,
  PatientDocumentsTab,
} from './tabs/PatientTabPanels';
import { PatientAppointmentsTab } from './tabs/PatientAppointmentsTab';
import { PatientPrescriptionsTab } from './tabs/PatientPrescriptionsTab';
import { PatientPanchakarmaTab } from './tabs/PatientPanchakarmaTab';
import { PatientTreatmentHistoryTab } from './tabs/PatientTreatmentHistoryTab';
import type { HmsPanchakarmaProgram } from '@/types/api.types';
import type { PatientTreatmentHistory } from '@/types/patientDetail.types';

const MAIN_TABS: { id: PatientDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'patient-info', label: 'Patient Info', icon: ClipboardList },
  { id: 'history', label: 'Treatment History', icon: History },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'panchakarma', label: 'Panchakarma', icon: Sparkles },
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
  prescriptions: StructuredPrescription[];
  loading: boolean;
  canCreate?: boolean;
  canView?: boolean;
  onRefresh?: () => void | Promise<void>;
}

interface PanchakarmaProps {
  patientCode: string;
  programs: HmsPanchakarmaProgram[];
  loading: boolean;
}

interface TreatmentHistoryProps {
  history: PatientTreatmentHistory | null;
  loading: boolean;
}

interface Props {
  patient: PatientDetail;
  activeTab?: PatientDetailTab;
  onTabChange?: (tab: PatientDetailTab) => void;
  canManageVisits?: boolean;
  clinical?: ClinicalProps;
  prakritiMasters?: MasterItem[];
  prescriptions?: PrescriptionProps;
  panchakarma?: PanchakarmaProps;
  treatmentHistory?: TreatmentHistoryProps;
  vitalsHistory?: PatientVitalsEntry[];
  canRecordVitals?: boolean;
  onAddVitals?: () => void;
}

export const PatientDetailTabs = ({
  patient,
  activeTab: controlledTab,
  onTabChange,
  canManageVisits = false,
  clinical,
  prakritiMasters = [],
  prescriptions,
  panchakarma,
  treatmentHistory,
  vitalsHistory = [],
  canRecordVitals = false,
  onAddVitals,
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
          <>
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
            {vitalsHistory.length > 0 || canRecordVitals ? (
              <div className="mt-6 border-t border-border-sage pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                    Vitals history
                  </h3>
                  {canRecordVitals && onAddVitals ? (
                    <button
                      type="button"
                      onClick={onAddVitals}
                      className="text-[11px] font-semibold text-sage-deep hover:underline"
                    >
                      Add vitals
                    </button>
                  ) : null}
                </div>
                {vitalsHistory.length === 0 ? (
                  <p className="text-sm text-ink-soft">No vitals recorded yet</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border-sage">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border-sage bg-cream/50 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                          {[
                            'Date',
                            'BP',
                            'Pulse',
                            'SpO₂',
                            'Fasting',
                            'Post-meal',
                            'Random',
                            'Weight',
                            'By',
                          ].map((col) => (
                              <th key={col} className="px-3 py-2">
                                {col}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {vitalsHistory.map((row) => (
                          <tr key={row.id} className="border-b border-border-sage/60 last:border-0">
                            <td className="px-3 py-2 text-ink-soft">{row.date}</td>
                            <td className="px-3 py-2">{row.bp || '—'}</td>
                            <td className="px-3 py-2">{row.pulse || '—'}</td>
                            <td className="px-3 py-2">{row.spo2 || '—'}</td>
                            <td className="px-3 py-2">{row.fasting || '—'}</td>
                            <td className="px-3 py-2">{row.postMeal || '—'}</td>
                            <td className="px-3 py-2">{row.random || '—'}</td>
                            <td className="px-3 py-2">{row.weight || '—'}</td>
                            <td className="px-3 py-2 text-xs text-ink-ghost">{row.recordedByName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === 'patient-info' && !clinical ? (
          <p className="py-8 text-center text-sm text-ink-soft">Clinical data unavailable.</p>
        ) : null}

        {activeTab === 'history' ? (
          <PatientTreatmentHistoryTab
            history={treatmentHistory?.history ?? null}
            loading={treatmentHistory?.loading ?? false}
          />
        ) : null}

        {activeTab === 'appointments' ? (
          <PatientAppointmentsTab
            appointments={patient.appointments}
            canManageVisits={canManageVisits}
          />
        ) : null}

        {activeTab === 'prescriptions' && prescriptions ? (
          <PatientPrescriptionsTab
            patientCode={prescriptions.patientCode}
            prescriptions={prescriptions.prescriptions}
            loading={prescriptions.loading}
            canCreate={prescriptions.canCreate}
            onRefresh={prescriptions.onRefresh}
          />
        ) : null}

        {activeTab === 'prescriptions' && !prescriptions ? (
          <p className="py-8 text-center text-sm text-ink-soft">Prescriptions unavailable.</p>
        ) : null}

        {activeTab === 'panchakarma' && panchakarma ? (
          <PatientPanchakarmaTab
            patientCode={panchakarma.patientCode}
            programs={panchakarma.programs}
            loading={panchakarma.loading}
          />
        ) : null}

        {activeTab === 'panchakarma' && !panchakarma ? (
          <p className="py-8 text-center text-sm text-ink-soft">Panchakarma data unavailable.</p>
        ) : null}

        {activeTab === 'labs' ? (
          <PatientLabReportsTab reports={patient.labReports} patientCode={patient.id} />
        ) : null}

        {activeTab === 'billing' ? <PatientBillingTab invoices={patient.invoices} /> : null}

        {activeTab === 'documents' ? <PatientDocumentsTab documents={patient.documents} /> : null}
      </div>
    </div>
  );
};
