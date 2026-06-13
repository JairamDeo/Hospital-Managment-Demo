import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EditPatientInsuranceModal } from '@/components/patients/insurance/EditPatientInsuranceModal';
import { SelectPatientModal } from '@/components/patients/insurance/SelectPatientModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import type {
  PatientInsuranceFormValues,
  PatientInsuranceRow,
  PatientInsuranceStats,
} from '@/types/patientInsurance.types';
import {
  formatInsuranceDate,
  formatSumInsured,
  insuranceStatusClass,
} from '@/utils/patientInsurance.util';
import { getApiErrorMessage } from '@/utils/helpers';

const defaultInsuranceStats = (): PatientInsuranceStats => ({
  total: 0,
  enrolled: 0,
  active: 0,
  expiringSoon: 0,
  notEnrolled: 0,
});

export const PatientInsurancePage = () => {
  const { canEdit } = usePermissions();
  const { showToast } = useToast();
  const [rows, setRows] = useState<PatientInsuranceRow[]>([]);
  const [insStats, setInsStats] = useState<PatientInsuranceStats>(defaultInsuranceStats());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'notEnrolled' | 'expiring'>(
    'all'
  );
  const [editRow, setEditRow] = useState<PatientInsuranceRow | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const canManage = canEdit('patientInsurance');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [insRes, insStatsRes] = await Promise.all([
        patientAdminService.listInsurance(),
        patientAdminService.getInsuranceStats(),
      ]);
      setRows(insRes.data.res?.rows ?? []);
      setInsStats(insStatsRes.data.res?.stats ?? defaultInsuranceStats());
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...rows];

    if (statusFilter === 'enrolled') {
      list = list.filter((r) => r.insurance.isEnrolled);
    } else if (statusFilter === 'notEnrolled') {
      list = list.filter((r) => !r.insurance.isEnrolled);
    } else if (statusFilter === 'expiring') {
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      list = list.filter((r) => {
        if (!r.insurance.endDate || r.insurance.status !== 'Active') return false;
        return new Date(r.insurance.endDate) <= in30;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.patientCode.toLowerCase().includes(q) ||
          r.mobileNumber.includes(q) ||
          r.insurance.providerName.toLowerCase().includes(q) ||
          r.insurance.policyNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, statusFilter, search]);

  const pickerItems = useMemo(
    () =>
      rows.map((r) => ({
        patientCode: r.patientCode,
        name: r.name,
        subtitle: r.mobileNumber,
        hint: r.insurance.isEnrolled ? undefined : 'Not enrolled',
      })),
    [rows]
  );

  const openEditorForPatient = (patientCode: string) => {
    const row = rows.find((r) => r.patientCode === patientCode);
    if (row) setEditRow(row);
  };

  const handleSave = async (values: PatientInsuranceFormValues) => {
    if (!editRow) return;
    setSaving(true);
    try {
      const { data } = await patientAdminService.updateInsurance(editRow.patientCode, values);
      if (data.res?.row) {
        setRows((prev) =>
          prev.map((r) => (r.patientCode === editRow.patientCode ? data.res!.row! : r))
        );
        showToast('Health insurance saved', 'success');
        setEditRow(null);
        const insStatsRes = await patientAdminService.getInsuranceStats();
        setInsStats(insStatsRes.data.res?.stats ?? defaultInsuranceStats());
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Patient health insurance
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Mediclaim policies, coverage and renewal tracking for patients
          </p>
        </div>
        {canManage ? (
          <Button className="gap-2 shrink-0 rounded-lg px-4 py-2" onClick={() => setSelectOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add policy
          </Button>
        ) : null}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Enrolled</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink">{insStats.enrolled}</p>
          <p className="text-xs text-ink-soft">of {insStats.total} patients</p>
        </div>
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Active policies</p>
          <p className="mt-1 font-serif text-2xl font-bold text-success">{insStats.active}</p>
        </div>
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Renewal in 30 days</p>
          <p className="mt-1 font-serif text-2xl font-bold text-warning">{insStats.expiringSoon}</p>
        </div>
        <div className="rounded-xl border border-border-sage bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">Not enrolled</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink-soft">{insStats.notEnrolled}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search patient, provider or policy no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['enrolled', 'Enrolled'],
              ['notEnrolled', 'Not enrolled'],
              ['expiring', 'Expiring soon'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                statusFilter === id
                  ? 'border-sage-deep bg-sage-mist text-sage-deep'
                  : 'border-border-sage bg-white text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-sage bg-cream/50 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {[
                  'Patient',
                  'Provider',
                  'Policy no.',
                  'Type',
                  'Sum insured',
                  'Valid till',
                  'Status',
                  '',
                ].map((col) => (
                  <th key={col || 'actions'} className="px-4 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-ink-soft">
                    Loading insurance records…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-ink-soft">
                    No records match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.patientCode}
                    className="border-b border-border-sage/70 last:border-0 hover:bg-sage-mist/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{row.name}</p>
                      <p className="text-[11px] text-ink-ghost">
                        {row.patientCode}
                        {row.age ? ` · ${row.age}y` : ''}
                        {row.gender !== 'Not recorded' ? ` · ${row.gender}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {row.insurance.isEnrolled ? row.insurance.providerName : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {row.insurance.policyNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {row.insurance.isEnrolled ? row.insurance.policyType : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatSumInsured(row.insurance.sumInsured)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                      {formatInsuranceDate(row.insurance.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${insuranceStatusClass(row.insurance.status)}`}
                      >
                        {row.insurance.isEnrolled ? row.insurance.status : 'Not enrolled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <Button
                          variant="secondary"
                          className="gap-1.5 px-2.5 py-1.5 text-xs"
                          onClick={() => setEditRow(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {row.insurance.isEnrolled ? 'Edit' : 'Add'}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border-sage bg-cream/40 px-4 py-3 text-xs text-ink-soft">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" />
        <p>
          Track patient mediclaim policies for billing and IPD claims. Status auto-updates to{' '}
          <strong className="text-ink">Expired</strong> after the end date. Access is limited to admin
          and support staff via Settings → RBAC.
        </p>
      </div>

      <SelectPatientModal
        open={selectOpen}
        title="Select patient"
        subtitle="Choose a patient to add or update their health insurance"
        items={pickerItems}
        onClose={() => setSelectOpen(false)}
        onSelect={(patientCode) => {
          setSelectOpen(false);
          openEditorForPatient(patientCode);
        }}
      />

      <EditPatientInsuranceModal
        open={Boolean(editRow)}
        row={editRow}
        saving={saving}
        onClose={() => !saving && setEditRow(null)}
        onSave={handleSave}
      />
    </div>
  );
};

export default PatientInsurancePage;
