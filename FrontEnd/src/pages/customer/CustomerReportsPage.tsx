import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { patientPortalLabService } from '@/services/lab/patientPortalLab.service';
import type { LabOrder, LabOrderTest, LabReportItem } from '@/services/lab/labAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';

type UploadTarget = {
  order: LabOrder;
  test: LabOrderTest;
};

export const CustomerReportsPage = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<LabReportItem[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [repRes, ordRes] = await Promise.all([
        patientPortalLabService.listReports(),
        patientPortalLabService.listOrders(),
      ]);
      setReports(repRes.data.res?.reports ?? []);
      setOrders(ordRes.data.res?.orders ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const reportByKey = useMemo(() => {
    const map = new Map<string, LabReportItem>();
    for (const r of reports) {
      if (r.reportCode) map.set(`code:${r.reportCode}`, r);
      if (r.orderCode && r.testCode) map.set(`ot:${r.orderCode}:${r.testCode}`, r);
      if (r.testCode) map.set(`t:${r.testCode}`, r);
    }
    return map;
  }, [reports]);

  const resolveReport = (order: LabOrder, test: LabOrderTest) => {
    if (test.reportCode) {
      const byCode = reportByKey.get(`code:${test.reportCode}`);
      if (byCode) return byCode;
    }
    return (
      reportByKey.get(`ot:${order.orderCode}:${test.testCode}`) ||
      reportByKey.get(`t:${test.testCode}`) ||
      null
    );
  };

  const groupedByDate = useMemo(() => {
    const map = new Map<string, LabReportItem[]>();
    for (const r of reports) {
      const key = r.date || 'Unknown date';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()];
  }, [reports]);

  const openUpload = (order: LabOrder, test: LabOrderTest) => {
    setUploadTarget({ order, test });
    setFile(null);
    setResult('');
  };

  const handleUpload = async () => {
    if (!uploadTarget || !file) {
      showToast('Attach your report file', 'error');
      return;
    }
    const { order, test } = uploadTarget;
    const form = new FormData();
    form.append('file', file);
    form.append('orderCode', order.orderCode);
    form.append('prescriptionCode', order.prescriptionCode || '');
    form.append('testCode', test.testCode);
    form.append('testName', test.testName);
    form.append('categoryCode', test.categoryCode || '');
    form.append('categoryName', test.categoryName || '');
    form.append('result', result || 'Patient uploaded outside lab report');
    form.append('status', 'Normal');

    setSaving(true);
    try {
      await patientPortalLabService.uploadReport(form);
      showToast('Report uploaded — clinic notified', 'success');
      setUploadTarget(null);
      setFile(null);
      setResult('');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-sage bg-gradient-to-br from-sage-mist/80 to-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-sage-deep" />
          <h1 className="font-serif text-xl font-semibold text-ink">Lab reports</h1>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Tests recommended by your doctor. If lab has uploaded a report, you can only view it.
          Otherwise you can upload your outside lab report for that test.
        </p>
      </div>

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Doctor recommended tests
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-soft">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-ghost">
            No recommended tests yet. Your doctor will add tests on the prescription.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {orders.map((o) => (
              <li key={o.orderCode} className="rounded-xl border border-border-sage/70 px-3 py-3">
                <p className="text-sm font-semibold text-ink">Dr. {o.doctorName || 'Clinic'}</p>
                <p className="text-xs text-ink-soft">
                  {o.orderCode}
                  {o.prescriptionCode ? ` · Rx ${o.prescriptionCode}` : ''} · {o.status}
                </p>
                <ul className="mt-2 space-y-2">
                  {o.tests.map((t) => {
                    const report = resolveReport(o, t);
                    const done = t.status === 'Completed' || Boolean(report?.fileUrl);
                    return (
                      <li
                        key={`${o.orderCode}-${t.testCode}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cream/40 px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{t.testName}</p>
                          <p className="text-[11px] text-ink-soft">
                            {t.categoryName ? `${t.categoryName} · ` : ''}
                            {done ? (
                              <span className="font-semibold text-emerald-700">
                                {report?.source === 'patient'
                                  ? 'Uploaded by you'
                                  : report?.source === 'lab'
                                    ? 'Uploaded by lab'
                                    : 'Report ready'}
                              </span>
                            ) : (
                              <span className="font-semibold text-amber-700">Awaiting report</span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {done && report?.fileUrl ? (
                            <a
                              href={report.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-border-sage bg-white px-2.5 py-1 text-xs font-semibold text-sage-deep hover:bg-sage-mist"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </a>
                          ) : null}
                          {!done ? (
                            <Button
                              type="button"
                              variant="secondary"
                              className="gap-1 px-2.5 py-1 text-xs"
                              onClick={() => openUpload(o, t)}
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Upload
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
          Your reports (by date)
        </h2>
        {groupedByDate.length === 0 ? (
          <p className="mt-3 text-sm text-ink-ghost">No reports available yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {groupedByDate.map(([date, items]) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold text-sage-deep">{date}</p>
                <ul className="space-y-2">
                  {items.map((r) => (
                    <li
                      key={r.reportCode}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border-sage/70 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">{r.testName}</p>
                        <p className="text-xs text-ink-soft">
                          {r.status} · {r.labName || r.lab}
                          {r.source ? ` · ${r.source}` : ''}
                        </p>
                      </div>
                      {r.fileUrl ? (
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sage-deep hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(uploadTarget)}
        onClose={() => setUploadTarget(null)}
        title={`Upload — ${uploadTarget?.test.testName || 'report'}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Doctor recommended this test. Upload your outside lab report for{' '}
            <span className="font-semibold text-ink">{uploadTarget?.test.testName}</span>.
          </p>
          <label className="block">
            <span className={formLabelClass}>Note (optional)</span>
            <input
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={formInputClass}
              placeholder="e.g. Done at XYZ Diagnostics"
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Report file (PDF/image) *</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setUploadTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleUpload()} disabled={saving}>
              {saving ? 'Uploading…' : 'Upload report'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerReportsPage;
