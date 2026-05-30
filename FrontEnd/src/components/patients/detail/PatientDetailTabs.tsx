import {
  CalendarDays,
  FileText,
  FlaskConical,
  History,
  Pill,
  Receipt,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { PatientDetail, PatientDetailTab } from '@/pages/patients/data/mockPatientDetails';
import { TreatmentHistoryItem } from './TreatmentHistoryItem';
import {
  PatientAppointmentsTab,
  PatientPrescriptionsTab,
  PatientLabReportsTab,
  PatientBillingTab,
  PatientDocumentsTab,
} from './tabs/PatientTabPanels';

const TABS: { id: PatientDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'history', label: 'Treatment History', icon: History },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'labs', label: 'Lab Reports', icon: FlaskConical },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'documents', label: 'Documents', icon: FileText },
];

interface Props {
  patient: PatientDetail;
}

export const PatientDetailTabs = ({ patient }: Props) => {
  const [activeTab, setActiveTab] = useState<PatientDetailTab>('history');

  return (
    <div className="overflow-hidden rounded-2xl border border-border-sage bg-white shadow-sm">
      <div className="border-b border-border-sage bg-cream/40 px-3 py-3 sm:px-5">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin rounded-xl bg-sage-mist/50 p-1">
          {TABS.map((tab) => {
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
                    : 'text-ink-soft hover:text-ink'
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
        {activeTab === 'prescriptions' ? (
          <PatientPrescriptionsTab prescriptions={patient.prescriptions} />
        ) : null}
        {activeTab === 'labs' ? <PatientLabReportsTab reports={patient.labReports} /> : null}
        {activeTab === 'billing' ? <PatientBillingTab invoices={patient.invoices} /> : null}
        {activeTab === 'documents' ? <PatientDocumentsTab documents={patient.documents} /> : null}
      </div>
    </div>
  );
};
