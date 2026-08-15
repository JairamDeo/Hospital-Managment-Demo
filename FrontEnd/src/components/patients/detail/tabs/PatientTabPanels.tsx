import { useEffect, useState, type ReactNode } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { invoiceDetailPath } from '@/constants/routes';
import { labAdminService } from '@/services/lab/labAdmin.service';
import type { PatientDocument, LabReport, PatientInvoice } from '@/types/patientDetail.types';
import { formatPatientRupee } from '@/types/patientDetail.types';

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

export { PatientPrescriptionsTab } from './PatientPrescriptionsTab';

export const PatientLabReportsTab = ({
  reports: seedReports,
  patientCode,
}: {
  reports: LabReport[];
  patientCode?: string;
}) => {
  const [reports, setReports] = useState(seedReports);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReports(seedReports);
  }, [seedReports]);

  useEffect(() => {
    if (!patientCode) return;
    let cancelled = false;
    setLoading(true);
    labAdminService
      .listReports({ patientCode })
      .then((res) => {
        if (cancelled) return;
        const live = (res.data.res?.reports ?? []).map((r) => ({
          id: r.reportCode,
          testName: r.testName,
          date: r.date || '',
          result: r.result || '',
          status: r.status,
          lab: r.labName || r.lab || 'Lab',
          fileUrl: r.fileUrl || '',
        }));
        if (live.length) setReports(live);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientCode]);

  if (loading && reports.length === 0) {
    return <p className="py-6 text-sm text-ink-soft">Loading lab reports…</p>;
  }

  if (!reports.length) {
    return <p className="py-6 text-sm text-ink-ghost">No lab reports yet.</p>;
  }

  return (
  <TableShell>
    <thead>
      <tr className="border-b border-border-sage bg-cream/60">
        <Th>Test</Th>
        <Th>Date</Th>
        <Th>Result</Th>
        <Th>Lab</Th>
        <Th>Status</Th>
        <Th>Report</Th>
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
          <td className="px-4 py-3">
            {r.fileUrl ? (
              <a
                href={r.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-border-sage bg-white px-2.5 py-1 text-xs font-semibold text-sage-deep transition hover:bg-sage-mist"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </a>
            ) : (
              <span className="text-xs text-ink-ghost">No file</span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </TableShell>
  );
};

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
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-soft">
                No invoices yet
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30">
                <td className="px-4 py-3">
                  <Link
                    to={invoiceDetailPath(inv.id)}
                    className="text-sm font-semibold text-sage-deep hover:underline"
                  >
                    #{inv.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-ink-ghost">{inv.date}</td>
                <td className="px-4 py-3 text-sm text-ink-soft">{inv.feeType || '—'}</td>
                <td className="px-4 py-3 text-sm text-ink-soft">{inv.treatment}</td>
                <td className="px-4 py-3 text-sm font-semibold text-ink">{formatPatientRupee(inv.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${INV_STATUS[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))
          )}
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
