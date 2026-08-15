import { Activity, ClipboardList, FileText, History, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type {
  AppointmentDetail,
  AppointmentDetailTab,
} from '@/types/appointmentDetail.types';
import { AppointmentActivityItem } from './AppointmentActivityItem';
import {
  AppointmentDocumentsTab,
  AppointmentNotesTab,
  AppointmentOverviewTab,
  AppointmentVitalsTab,
} from './tabs/AppointmentTabPanels';

const TABS: { id: AppointmentDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: Stethoscope },
  { id: 'vitals', label: 'Vitals', icon: Activity },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'documents', label: 'Documents', icon: FileText },
];

interface Props {
  appointment: AppointmentDetail;
}

export const AppointmentDetailTabs = ({ appointment }: Props) => {
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
        {activeTab === 'overview' ? <AppointmentOverviewTab appointment={appointment} /> : null}
        {activeTab === 'vitals' ? <AppointmentVitalsTab vitals={appointment.vitals} /> : null}
        {activeTab === 'notes' ? <AppointmentNotesTab appointment={appointment} /> : null}
        {activeTab === 'activity' ? (
          appointment.activityLog.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No activity recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {appointment.activityLog.map((record, i) => (
                <AppointmentActivityItem
                  key={record.id}
                  record={record}
                  isLast={i === appointment.activityLog.length - 1}
                />
              ))}
            </div>
          )
        ) : null}
        {activeTab === 'documents' ? (
          <AppointmentDocumentsTab documents={appointment.documents} />
        ) : null}
      </div>
    </div>
  );
};
