import type { ReactNode } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import type {
  LeaveRecord,
  StaffAssignment,
  StaffDocument,
  StaffPerformanceRecord,
  StaffScheduleSlot,
} from '@/pages/staff/data/mockStaffDetails';

const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-border-sage">
    <table className="w-full min-w-[640px] border-collapse">{children}</table>
  </div>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
    {children}
  </th>
);

const SLOT_STATUS: Record<StaffScheduleSlot['status'], string> = {
  Upcoming: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-warning-bg text-warning',
  Completed: 'bg-success-bg text-success',
};

const ASSIGN_STATUS: Record<StaffAssignment['status'], string> = {
  Active: 'bg-success-bg text-success',
  Completed: 'bg-sage-mist text-ink-soft',
};

const LEAVE_STATUS: Record<LeaveRecord['status'], string> = {
  Approved: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Rejected: 'bg-danger-bg text-danger',
};

export const StaffScheduleTab = ({ slots }: { slots: StaffScheduleSlot[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Time</Th>
        <Th>Session</Th>
        <Th>Patient / Task</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {slots.map((s) => (
        <tr key={s.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3 text-sm font-medium text-ink">{s.time}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{s.title}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{s.patientOrTask}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLOT_STATUS[s.status]}`}>
              {s.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);

export const StaffAssignmentsTab = ({
  assignments,
  showAppointments = false,
  showPanchakarma = false,
}: {
  assignments: StaffAssignment[];
  showAppointments?: boolean;
  showPanchakarma?: boolean;
}) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Patient</Th>
        <Th>{showPanchakarma ? 'Panchakarma Program' : showAppointments ? 'Appointment' : 'Program'}</Th>
        <Th>{showAppointments ? 'Time' : 'Start Date'}</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {assignments.length === 0 ? (
        <tr>
          <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-soft">
            {showPanchakarma
              ? 'No Panchakarma programs assigned to this therapist yet.'
              : showAppointments
                ? 'No scheduled appointments for this doctor yet.'
                : 'No assignments yet.'}
          </td>
        </tr>
      ) : null}
      {assignments.map((a) => (
        <tr key={a.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3">
            <p className="text-sm font-semibold text-ink">{a.patientName}</p>
            {a.patientId !== '—' ? (
              <p className="text-xs text-ink-ghost">#{a.patientId}</p>
            ) : null}
          </td>
          <td className="px-4 py-3 text-sm text-ink-soft">{a.program}</td>
          <td className="px-4 py-3 text-sm text-ink-ghost">{a.since}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ASSIGN_STATUS[a.status]}`}>
              {a.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);

export const StaffPerformanceTab = ({ records }: { records: StaffPerformanceRecord[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Month</Th>
        <Th>Patients Seen</Th>
        <Th>Rating</Th>
        <Th>Notes</Th>
      </tr>
    </thead>
    <tbody>
      {records.map((r) => (
        <tr key={r.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3 text-sm font-semibold text-ink">{r.month}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{r.patientsSeen}</td>
          <td className="px-4 py-3 text-sm font-semibold text-sage-deep">{r.rating}★</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{r.notes}</td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);

export const StaffDocumentsTab = ({ documents }: { documents: StaffDocument[] }) => (
  <div className="space-y-2">
    {documents.map((doc) => (
      <div
        key={doc.id}
        className="flex items-center gap-3 rounded-xl border border-border-sage bg-cream/30 px-4 py-3 transition-colors hover:bg-sage-mist/40"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sage-deep ring-1 ring-border-sage">
          <FileText className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
          <p className="text-xs text-ink-ghost">
            {doc.type} · {doc.uploadedAt} · {doc.size}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-white hover:text-ink-soft"
            aria-label={`View ${doc.name}`}
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-white hover:text-ink-soft"
            aria-label={`Download ${doc.name}`}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

export const StaffLeaveTab = ({ records }: { records: LeaveRecord[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Type</Th>
        <Th>From</Th>
        <Th>To</Th>
        <Th>Days</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {records.map((r) => (
        <tr key={r.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3 text-sm font-semibold text-ink">{r.type}</td>
          <td className="px-4 py-3 text-sm text-ink-ghost">{r.from}</td>
          <td className="px-4 py-3 text-sm text-ink-ghost">{r.to}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{r.days || '—'}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEAVE_STATUS[r.status]}`}>
              {r.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);
