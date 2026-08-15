import { Briefcase, FileText, History, Palmtree } from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { StaffAssignment } from '@/pages/staff/data/mockStaffDetails';
import type { StaffDetailTab, StaffProfileCardData } from '@/types/staffProfile.types';
import { StaffAssignmentsTab } from './tabs/StaffTabPanels';
import { StaffActivityPanel } from './panels/StaffActivityPanel';
import { StaffDocumentsPanel } from './panels/StaffDocumentsPanel';
import { StaffLeavePanel } from './panels/StaffLeavePanel';

const TABS: { id: StaffDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'activity', label: 'Activity Log', icon: History },
  { id: 'assignments', label: 'Assignments', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'leave', label: 'Leave', icon: Palmtree },
];

interface Props {
  staff: StaffProfileCardData;
  appointmentAssignments?: StaffAssignment[];
  assignmentsLoading?: boolean;
  assignmentsMode?: 'appointments' | 'panchakarma';
  isAdmin: boolean;
  isOwnProfile: boolean;
  canCheckInOut: boolean;
  canUploadDocuments: boolean;
  activityRefreshKey?: number;
  onLeaveChanged?: () => void;
}

export const StaffDetailTabs = ({
  staff,
  appointmentAssignments = [],
  assignmentsLoading = false,
  assignmentsMode = 'appointments',
  isAdmin,
  isOwnProfile,
  canCheckInOut,
  canUploadDocuments,
  activityRefreshKey = 0,
  onLeaveChanged,
}: Props) => {
  const [activeTab, setActiveTab] = useState<StaffDetailTab>('activity');
  const showAppointments = assignmentsMode === 'appointments';

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
        {activeTab === 'activity' ? (
          <StaffActivityPanel
            key={activityRefreshKey}
            staffCode={staff.id}
            canCheckInOut={canCheckInOut}
          />
        ) : null}
        {activeTab === 'assignments' ? (
          assignmentsLoading ? (
            <p className="py-8 text-center text-sm text-ink-soft">Loading assignments…</p>
          ) : (
            <StaffAssignmentsTab
              assignments={appointmentAssignments}
              showAppointments={showAppointments}
              showPanchakarma={assignmentsMode === 'panchakarma'}
            />
          )
        ) : null}
        {activeTab === 'documents' ? (
          <StaffDocumentsPanel staffCode={staff.id} canUpload={canUploadDocuments} />
        ) : null}
        {activeTab === 'leave' ? (
          <StaffLeavePanel
            staffCode={staff.id}
            staffName={staff.name}
            isAdmin={isAdmin}
            isOwnProfile={isOwnProfile}
            onLeaveChanged={onLeaveChanged}
          />
        ) : null}
      </div>
    </div>
  );
};
