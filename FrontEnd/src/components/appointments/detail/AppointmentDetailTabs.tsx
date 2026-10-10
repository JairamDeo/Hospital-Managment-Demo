import { Activity, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { AppointmentDetail, AppointmentDetailTab } from '@/types/appointmentDetail.types';
import type { AppointmentDoctor } from '@/types/appointment.types';
import {
  AppointmentOverviewTab,
  AppointmentVitalsTab,
  type VisitClinicalForm,
} from './tabs/AppointmentTabPanels';

const TABS: { id: AppointmentDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: Stethoscope },
  { id: 'vitals', label: 'Vitals', icon: Activity },
];

interface Props {
  appointment: AppointmentDetail;
  form: VisitClinicalForm;
  doctors: AppointmentDoctor[];
  canEdit: boolean;
  canChangeDoctor?: boolean;
  errors?: { chiefComplaint?: string };
  vitalsEditing: boolean;
  onVitalsEditingChange: (editing: boolean) => void;
  onChange: (patch: Partial<VisitClinicalForm>) => void;
}

export const AppointmentDetailTabs = ({
  appointment,
  form,
  doctors,
  canEdit,
  canChangeDoctor = true,
  errors,
  vitalsEditing,
  onVitalsEditingChange,
  onChange,
}: Props) => {
  const [activeTab, setActiveTab] = useState<AppointmentDetailTab>('overview');

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
        {activeTab === 'overview' ? (
          <AppointmentOverviewTab
            appointment={appointment}
            form={form}
            doctors={doctors}
            canEdit={canEdit}
            canChangeDoctor={canChangeDoctor}
            errors={errors}
            onChange={onChange}
          />
        ) : null}
        {activeTab === 'vitals' ? (
          <AppointmentVitalsTab
            vitals={appointment.vitals}
            formVitals={form.visitVitals}
            canEdit={canEdit}
            editing={vitalsEditing}
            onStartEdit={() => onVitalsEditingChange(true)}
            onChangeVitals={(patch) =>
              onChange({ visitVitals: { ...form.visitVitals, ...patch } })
            }
          />
        ) : null}
      </div>
    </div>
  );
};
