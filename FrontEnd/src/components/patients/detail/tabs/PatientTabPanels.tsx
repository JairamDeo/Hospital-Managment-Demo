import type { ReactNode } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appointmentDetailPath } from '@/constants/routes';
import { MOCK_APPOINTMENTS } from '@/pages/appointments/data/mockAppointments';
import type {
  PatientAppointment,
  PatientDocument,
  PatientInvoice,
  LabReport,
  Prescription,
} from '@/pages/patients/data/mockPatientDetails';
import { formatPatientRupee } from '@/pages/patients/data/mockPatientDetails';

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

const APPT_STATUS: Record<PatientAppointment['status'], string> = {
  Upcoming: 'bg-blue-50 text-blue-700',
  Completed: 'bg-success-bg text-success',
  Cancelled: 'bg-danger-bg text-danger',
};

const RX_STATUS: Record<Prescription['status'], string> = {
  Active: 'bg-success-bg text-success',
  Completed: 'bg-sage-mist text-ink-soft',
};

const LAB_STATUS: Record<LabReport['status'], string> = {
  Normal: 'bg-success-bg text-success',
  Abnormal: 'bg-warning-bg text-warning',
  Pending: 'bg-sage-mist text-ink-soft',
};

const INV_STATUS: Record<PatientInvoice['status'], string> = {
  Paid: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  Overdue: 'bg-danger-bg text-danger',
};

export const PatientAppointmentsTab = ({
  appointments,
  patientId,
}: {
  appointments: PatientAppointment[];
  patientId: string;
}) => {
  const navigate = useNavigate();
  const linkedAppt = MOCK_APPOINTMENTS.find((a) => a.patientId === patientId);

  return (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Date & Time</Th>
        <Th>Type</Th>
        <Th>Doctor</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {appointments.map((a, index) => {
        const href = index === 0 && linkedAppt ? appointmentDetailPath(linkedAppt.id) : null;

        return (
          <tr
            key={a.id}
            onClick={href ? () => navigate(href) : undefined}
            className={`border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30 ${
              href ? 'cursor-pointer' : ''
            }`}
          >
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-ink">{a.date}</p>
              <p className="text-xs text-ink-ghost">{a.time}</p>
            </td>
            <td className="px-4 py-3 text-sm text-ink-soft">{a.type}</td>
            <td className="px-4 py-3 text-sm font-medium text-ink">{a.doctor}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${APPT_STATUS[a.status]}`}>
                {a.status}
              </span>
            </td>
          </tr>
        );
      })}
    </tbody>
  </TableShell>
  );
};

export const PatientPrescriptionsTab = ({ prescriptions }: { prescriptions: Prescription[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Medicine</Th>
        <Th>Dosage</Th>
        <Th>Frequency</Th>
        <Th>Duration</Th>
        <Th>Prescribed</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {prescriptions.map((rx) => (
        <tr key={rx.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3">
            <p className="text-sm font-semibold text-ink">{rx.medicine}</p>
            <p className="text-xs text-ink-ghost">{rx.prescribedBy}</p>
          </td>
          <td className="px-4 py-3 text-sm text-ink-soft">{rx.dosage}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{rx.frequency}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{rx.duration}</td>
          <td className="px-4 py-3 text-sm text-ink-ghost">{rx.date}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${RX_STATUS[rx.status]}`}>
              {rx.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);

export const PatientLabReportsTab = ({ reports }: { reports: LabReport[] }) => (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Test</Th>
        <Th>Date</Th>
        <Th>Result</Th>
        <Th>Lab</Th>
        <Th>Status</Th>
      </tr>
    </thead>
    <tbody>
      {reports.map((r) => (
        <tr key={r.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
          <td className="px-4 py-3 text-sm font-semibold text-ink">{r.testName}</td>
          <td className="px-4 py-3 text-sm text-ink-ghost">{r.date}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{r.result}</td>
          <td className="px-4 py-3 text-sm text-ink-soft">{r.lab}</td>
          <td className="px-4 py-3">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${LAB_STATUS[r.status]}`}>
              {r.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </TableShell>
);

export const PatientBillingTab = ({ invoices }: { invoices: PatientInvoice[] }) => {
  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paid = invoices.filter((i) => i.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border-sage bg-cream/50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Total Billed</p>
          <p className="mt-1 text-lg font-bold text-ink">{formatPatientRupee(total)}</p>
        </div>
        <div className="rounded-xl border border-border-sage bg-cream/50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Collected</p>
          <p className="mt-1 text-lg font-bold text-success">{formatPatientRupee(paid)}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border-sage bg-cream/50 px-4 py-3 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Invoices</p>
          <p className="mt-1 text-lg font-bold text-ink">{invoices.length}</p>
        </div>
      </div>

      <TableShell>
        <thead>
          <tr className="border-b border-border-sage bg-cream/60">
            <Th>Invoice</Th>
            <Th>Date</Th>
            <Th>Treatment</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
              <td className="px-4 py-3 text-sm font-semibold text-sage-deep">#{inv.id}</td>
              <td className="px-4 py-3 text-sm text-ink-ghost">{inv.date}</td>
              <td className="px-4 py-3 text-sm text-ink-soft">{inv.treatment}</td>
              <td className="px-4 py-3 text-sm font-semibold text-ink">{formatPatientRupee(inv.amount)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${INV_STATUS[inv.status]}`}>
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
};

export const PatientDocumentsTab = ({ documents }: { documents: PatientDocument[] }) => (
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
