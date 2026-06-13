import { useCallback, useEffect, useMemo, useState } from 'react';
import { IndianRupee, Pencil, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EditStaffCompensationModal } from '@/components/staff/compensation/EditStaffCompensationModal';
import { StaffSectionNav } from '@/components/staff/StaffSectionNav';
import { SelectStaffModal } from '@/components/staff/SelectStaffModal';
import { StaffRoleFilters, StaffFilterChips } from '@/components/staff/StaffRoleFilters';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { staffAdminService } from '@/services/staff/staffAdmin.service';
import type { StaffFilter, StaffStats } from '@/types/staff.types';
import type { StaffCompensationFormValues, StaffCompensationRow } from '@/types/staffCompensation.types';
import { defaultStaffStats, filterToRole } from '@/utils/staffHelpers';
import { formatPay } from '@/utils/staffCompensation.util';
import { getApiErrorMessage } from '@/utils/helpers';

export const StaffCompensationPage = () => {
  const { canEdit } = usePermissions();
  const { showToast } = useToast();
  const [rows, setRows] = useState<StaffCompensationRow[]>([]);
  const [stats, setStats] = useState<StaffStats>(defaultStaffStats());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffFilter>('all');
  const [editRow, setEditRow] = useState<StaffCompensationRow | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const canManage = canEdit('staff');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        staffAdminService.listCompensation(),
        staffAdminService.getStats(),
      ]);
      setRows(compRes.data.res?.rows ?? []);
      setStats(statsRes.data.res?.stats ?? defaultStaffStats());
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
    const role = filterToRole(roleFilter);
    if (role) list = list.filter((r) => r.role === role);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.staffCode.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, roleFilter, search]);

  const pickerItems = useMemo(
    () =>
      rows.map((r) => ({
        staffCode: r.staffCode,
        name: r.name,
        role: r.role,
        subtitle: r.title,
        hint: r.compensation.basicSalary > 0 ? undefined : 'Not set',
      })),
    [rows]
  );

  const openEditorForStaff = (staffCode: string) => {
    const row = rows.find((r) => r.staffCode === staffCode);
    if (row) setEditRow(row);
  };

  const handleSave = async (values: StaffCompensationFormValues) => {
    if (!editRow) return;
    setSaving(true);
    try {
      const { data } = await staffAdminService.updateCompensation(editRow.staffCode, values);
      if (data.res?.row) {
        setRows((prev) =>
          prev.map((r) => (r.staffCode === editRow.staffCode ? data.res!.row! : r))
        );
        showToast('Compensation saved', 'success');
        setEditRow(null);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-4">
      <StaffSectionNav />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Staff compensation
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Monthly salary structure, deductions, and doctor consultation fees
          </p>
        </div>
        {canManage ? (
          <Button className="gap-2 shrink-0 rounded-lg px-4 py-2" onClick={() => setSelectOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add compensation
          </Button>
        ) : null}
      </div>

      <div className="mb-4">
        <StaffRoleFilters active={roleFilter} stats={stats} onChange={setRoleFilter} />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search by name or staff code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
          />
        </div>
        <StaffFilterChips active={roleFilter} onChange={setRoleFilter} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-sage bg-cream/50 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                {['Staff', 'Role', 'Basic', 'Gross', 'Deductions', 'Net pay', 'Consult fee', ''].map(
                  (col) => (
                    <th key={col || 'actions'} className="px-4 py-2.5">
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-ink-soft">
                    Loading compensation…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-ink-soft">
                    No staff found
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.staffCode}
                    className="border-b border-border-sage/70 last:border-0 hover:bg-sage-mist/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{row.name}</p>
                      <p className="text-[11px] text-ink-ghost">{row.staffCode}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{row.role}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatPay(row.compensation.basicSalary)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-ink">
                      {formatPay(row.grossMonthly)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                      {formatPay(row.totalDeductions)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-sage-deep">
                      {formatPay(row.netMonthly)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                      {row.role === 'Doctor' && row.consultationFee > 0
                        ? formatPay(row.consultationFee)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <Button
                          variant="secondary"
                          className="gap-1.5 px-2.5 py-1.5 text-xs"
                          onClick={() => setEditRow(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
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
        <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" />
        <p>
          <strong className="text-ink">Gross</strong> = basic + HRA + DA + allowances.{' '}
          <strong className="text-ink">Net</strong> = gross − PF − professional tax − other deductions.
          Set consultation fee only for doctors (OPD billing).
        </p>
      </div>

      <SelectStaffModal
        open={selectOpen}
        title="Select staff"
        subtitle="Choose a staff member to add or update their compensation"
        items={pickerItems}
        onClose={() => setSelectOpen(false)}
        onSelect={(staffCode) => {
          setSelectOpen(false);
          openEditorForStaff(staffCode);
        }}
      />

      <EditStaffCompensationModal
        open={Boolean(editRow)}
        row={editRow}
        saving={saving}
        onClose={() => !saving && setEditRow(null)}
        onSave={handleSave}
      />
    </div>
  );
};

export default StaffCompensationPage;
