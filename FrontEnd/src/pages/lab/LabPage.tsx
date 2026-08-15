import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search, Upload } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formInputClass, formLabelClass, formSelectClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  labAdminService,
  type LabOrder,
  type LabOrderTest,
  type LabReportItem,
} from '@/services/lab/labAdmin.service';
import { masterService } from '@/services/master/master.service';
import type { MasterItem } from '@/types/api.types';
import { getApiErrorMessage } from '@/utils/helpers';
import { ROUTES, patientDetailPath } from '@/constants/routes';

const PAGE_SIZE = 8;

type LabTestMasterRow = MasterItem & {
  categoryCode?: string;
  categoryName?: string;
  category?: string;
};

type UploadTarget = {
  order: LabOrder;
  test: LabOrderTest;
};

/** Lab workspace — requests, filters, upload (analytics live on Dashboard for Lab role). */
export const LabPage = () => {
  const { showToast } = useToast();
  const { canView, canEdit } = usePermissions();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [reports, setReports] = useState<LabReportItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [masterTests, setMasterTests] = useState<LabTestMasterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [testFilter, setTestFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [page, setPage] = useState(1);

  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [reportName, setReportName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<'Normal' | 'Abnormal'>('Normal');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, reportsRes, catRes, testRes] = await Promise.all([
        labAdminService.listOrders({
          status: statusFilter,
          search: search.trim() || undefined,
          categoryCode: categoryFilter || undefined,
          testCode: testFilter || undefined,
          patientCode: patientFilter || undefined,
        }),
        labAdminService.listReports({
          search: search.trim() || undefined,
          categoryCode: categoryFilter || undefined,
          testCode: testFilter || undefined,
          patientCode: patientFilter || undefined,
        }),
        masterService.listLabCategories(true),
        masterService.listLabTests(true),
      ]);
      setOrders(ordersRes.data.res?.orders ?? []);
      setReports(reportsRes.data.res?.reports ?? []);
      setCategories(catRes.data.res?.items ?? []);
      setMasterTests(testRes.data.res?.items ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, statusFilter, search, categoryFilter, testFilter, patientFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, categoryFilter, testFilter, patientFilter]);

  const patientOptions = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => map.set(o.patientCode, o.patientName));
    reports.forEach((r) => map.set(r.patientCode, r.patientName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [orders, reports]);

  const filteredMasterTests = useMemo(() => {
    if (!categoryFilter) return masterTests;
    return masterTests.filter((t) => t.categoryCode === categoryFilter);
  }, [masterTests, categoryFilter]);

  const requestRows = useMemo(() => {
    const rows: Array<{
      key: string;
      order: LabOrder;
      test: LabOrderTest;
    }> = [];
    for (const order of orders) {
      for (const test of order.tests) {
        if (categoryFilter && test.categoryCode !== categoryFilter) continue;
        if (testFilter && test.testCode !== testFilter) continue;
        if (statusFilter === 'Pending' && test.status === 'Completed') continue;
        if (statusFilter === 'Completed' && test.status !== 'Completed') continue;
        rows.push({
          key: `${order.orderCode}-${test.testCode}`,
          order,
          test,
        });
      }
    }
    return rows;
  }, [orders, categoryFilter, testFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(requestRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = requestRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!canView('lab')) {
    return <Navigate to={ROUTES.ADMIN_ACCESS_DENIED} replace />;
  }

  const openUpload = (order: LabOrder, test: LabOrderTest) => {
    setUploadTarget({ order, test });
    setReportName(test.testName);
    setFile(null);
    setResult('');
    setStatus('Normal');
  };

  const handleUpload = async () => {
    if (!uploadTarget || !file) {
      showToast('Attach the report file', 'error');
      return;
    }
    if (!reportName.trim()) {
      showToast('Enter report / test name', 'error');
      return;
    }

    const { order, test } = uploadTarget;
    const form = new FormData();
    form.append('file', file);
    form.append('patientCode', order.patientCode);
    form.append('orderCode', order.orderCode);
    form.append('prescriptionCode', order.prescriptionCode || '');
    form.append('testCode', test.testCode);
    form.append('testName', reportName.trim());
    form.append('categoryCode', test.categoryCode || '');
    form.append('categoryName', test.categoryName || '');
    form.append('result', result || 'Report uploaded');
    form.append('status', status);

    setSaving(true);
    try {
      await labAdminService.uploadReport(form);
      showToast('Report uploaded — doctor & patient notified', 'success');
      setUploadTarget(null);
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
          <ClipboardList className="h-5 w-5 text-sage-deep" />
          <h1 className="font-serif text-xl font-semibold text-ink">Lab requests</h1>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Filter and upload doctor-requested reports. Analytics are on your Dashboard.
        </p>
        <Link
          to={ROUTES.ADMIN_DASHBOARD}
          className="mt-2 inline-block text-xs font-semibold text-sage-deep hover:underline"
        >
          View lab analytics on Dashboard →
        </Link>
      </div>

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[10rem] flex-1">
            <span className={formLabelClass}>Search patient / order / test</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${formInputClass} pl-9`}
                placeholder="Name, code, test…"
              />
            </div>
          </label>
          <label className="w-full sm:w-40">
            <span className={formLabelClass}>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={formSelectClass}
            >
              <option value="all">All requests</option>
              <option value="Pending">Pending / Partial</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label className="w-full sm:w-44">
            <span className={formLabelClass}>Patient</span>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className={formSelectClass}
            >
              <option value="">All patients</option>
              {patientOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
          </label>
          <label className="w-full sm:w-40">
            <span className={formLabelClass}>Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setTestFilter('');
              }}
              className={formSelectClass}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="w-full sm:w-44">
            <span className={formLabelClass}>Test</span>
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className={formSelectClass}
            >
              <option value="">All tests</option>
              {filteredMasterTests.map((t) => (
                <option key={t._id} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h2 className="mb-3 font-serif text-lg font-semibold text-ink">
          Lab requests ({requestRows.length})
        </h2>

        {loading ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : pageRows.length === 0 ? (
          <p className="text-sm text-ink-ghost">No matching lab requests.</p>
        ) : (
          <ul className="space-y-3">
            {pageRows.map(({ key, order, test }) => (
              <li key={key} className="rounded-xl border border-border-sage/80 px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{test.testName}</p>
                    <p className="text-xs text-ink-soft">
                      {order.patientName} · #{order.patientCode}
                      {test.categoryName ? ` · ${test.categoryName}` : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-ghost">
                      Dr. {order.doctorName || '—'} · {order.orderCode}
                      {order.prescriptionCode ? ` · Rx ${order.prescriptionCode}` : ''} ·{' '}
                      <span className="font-semibold text-ink-soft">{test.status}</span>
                    </p>
                    <Link
                      to={patientDetailPath(order.patientCode)}
                      className="mt-1 inline-block text-[11px] font-semibold text-sage-deep hover:underline"
                    >
                      Open patient profile
                    </Link>
                  </div>
                  {canEdit('lab') && test.status !== 'Completed' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-1 text-xs"
                      onClick={() => openUpload(order, test)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload this report
                    </Button>
                  ) : test.status === 'Completed' ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                      Done
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        {requestRows.length > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-sage pt-3 text-xs text-ink-soft">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, requestRows.length)} of {requestRows.length}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="px-2 py-1">
                {safePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border-sage bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-serif text-lg font-semibold text-ink">
          Recent reports ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-ink-ghost">No reports uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {reports.slice(0, 20).map((r) => (
              <li
                key={r.reportCode}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-sage/70 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">{r.testName}</p>
                  <p className="text-xs text-ink-soft">
                    {r.patientName} · {r.date} · {r.status} · {r.source}
                  </p>
                </div>
                {r.fileUrl ? (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-sage-deep hover:underline"
                  >
                    View file
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(uploadTarget)}
        onClose={() => setUploadTarget(null)}
        title={`Upload report — ${uploadTarget?.test.testName || ''}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            {uploadTarget?.order.patientName} — {uploadTarget?.order.orderCode}
          </p>
          <p className="text-xs text-ink-ghost">
            Doctor recommended:{' '}
            <span className="font-medium text-ink">{uploadTarget?.test.testName}</span>
            {uploadTarget?.test.categoryName ? ` (${uploadTarget.test.categoryName})` : ''}
          </p>
          <label className="block">
            <span className={formLabelClass}>Report / test name *</span>
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className={formInputClass}
              placeholder="Can differ from doctor recommendation"
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Result note</span>
            <input
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={formInputClass}
              placeholder="e.g. Within normal limits"
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Normal' | 'Abnormal')}
              className={formSelectClass}
            >
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
            </select>
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
              {saving ? 'Uploading…' : 'Upload & notify'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LabPage;
