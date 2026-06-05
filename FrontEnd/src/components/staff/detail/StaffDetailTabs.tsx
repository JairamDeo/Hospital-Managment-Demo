import {
  Briefcase,
  CalendarDays,
  FileText,
  History,
  Palmtree,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { StaffAssignment, StaffDetail, StaffDetailTab } from '@/pages/staff/data/mockStaffDetails';
import { StaffActivityItem } from './StaffActivityItem';
import {
  StaffAssignmentsTab,
  StaffDocumentsTab,
  StaffLeaveTab,
  StaffPerformanceTab,
  StaffScheduleTab,
} from './tabs/StaffTabPanels';

const TABS: { id: StaffDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'activity', label: 'Activity Log', icon: History },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'assignments', label: 'Assignments', icon: Briefcase },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'leave', label: 'Leave', icon: Palmtree },
];

interface Props {
  staff: StaffDetail;
  appointmentAssignments?: StaffAssignment[];
  assignmentsLoading?: boolean;
  assignmentsMode?: 'appointments' | 'panchakarma';
}

export const StaffDetailTabs = ({
  staff,
  appointmentAssignments = [],
  assignmentsLoading = false,
  assignmentsMode = 'appointments',
}: Props) => {
  const [activeTab, setActiveTab] = useState<StaffDetailTab>('assignments');
  const assignments =
    appointmentAssignments.length > 0 ? appointmentAssignments : staff.assignments;
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
          <div className="space-y-0">
            {staff.activityLog.map((record, i) => (
              <StaffActivityItem
                key={record.id}
                record={record}
                isLast={i === staff.activityLog.length - 1}
              />
            ))}
          </div>
        ) : null}
        {activeTab === 'schedule' ? <StaffScheduleTab slots={staff.weeklySchedule} /> : null}
        {activeTab === 'assignments' ? (
          assignmentsLoading ? (
            <p className="py-8 text-center text-sm text-ink-soft">Loading appointments…</p>
          ) : (
            <StaffAssignmentsTab
              assignments={assignments}
              showAppointments={showAppointments}
              showPanchakarma={assignmentsMode === 'panchakarma'}
            />
          )
        ) : null}
        {activeTab === 'performance' ? (
          <StaffPerformanceTab records={staff.performanceRecords} />
        ) : null}
        {activeTab === 'documents' ? <StaffDocumentsTab documents={staff.documents} /> : null}
        {activeTab === 'leave' ? <StaffLeaveTab records={staff.leaveRecords} /> : null}
      </div>
    </div>
  );
};
