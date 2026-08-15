import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddStaffModal } from '@/components/modals/AddStaffModal';
import { StaffSectionNav } from '@/components/staff/StaffSectionNav';
import { StaffRoleFilters, StaffFilterChips } from '@/components/staff/StaffRoleFilters';
import { StaffCard } from '@/components/staff/StaffCard';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { staffDetailPath } from '@/constants/routes';
import { staffAdminService } from '@/services/staff/staffAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import type { StaffFilter, StaffFormValues, StaffMember, StaffStats } from '@/types/staff.types';
import {
  defaultStaffStats,
  emptyStaffForm,
  filterToRole,
  hmsToStaff,
} from '@/utils/staffHelpers';

const PAGE_SIZE = 6;

export const StaffPage = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>(defaultStaffStats());
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffFilter>('all');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(emptyStaffForm());
  const { showToast } = useToast();
  const { canEdit } = usePermissions();

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const [staffRes, statsRes] = await Promise.all([
        staffAdminService.list(),
        staffAdminService.getStats(),
      ]);
      setStaff((staffRes.data.res?.staff ?? []).map(hmsToStaff));
      setStats(statsRes.data.res?.stats ?? defaultStaffStats());
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let list = [...staff];
    const role = filterToRole(roleFilter);
    if (role) list = list.filter((s) => s.role === role);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [staff, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStaff = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const setFilter = (f: StaffFilter) => {
    setRoleFilter(f);
    setPage(1);
  };

  const handleAdd = async (values: StaffFormValues) => {
    setSubmitting(true);
    try {
      const { data } = await staffAdminService.create(values);
      if (data.status_code === 201 && data.res?.staff) {
        setAddOpen(false);
        showToast(`${values.name.trim()} added to staff directory`, 'success');
        await loadData();
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <StaffSectionNav />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Staff Directory
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {stats.total} total staff · {stats.onDuty} on duty today
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canEdit('staff') ? (
            <Button
              className="gap-2 rounded-lg px-4 py-2"
              onClick={() => {
                setFormInitial(emptyStaffForm());
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Staff
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <StaffRoleFilters active={roleFilter} stats={stats} onChange={setFilter} />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-full border border-border-sage bg-white py-2 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-ghost focus:border-sage focus:ring-2 focus:ring-sage-pale"
          />
        </div>
        <StaffFilterChips active={roleFilter} onChange={setFilter} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
        <div className="p-4">
          {listLoading ? (
            <p className="py-16 text-center text-sm text-ink-soft">Loading staff directory…</p>
          ) : pageStaff.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-soft">No staff found</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onViewProfile={(m) => navigate(staffDetailPath(m.id))}
                />
              ))}
            </div>
          )}
        </div>

        <StaffPagination
          from={from}
          to={to}
          total={filtered.length}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <AddStaffModal
        key={addOpen ? 'open' : 'closed'}
        open={addOpen}
        initial={formInitial}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        submitting={submitting}
      />

    </div>
  );
};

export default StaffPage;
