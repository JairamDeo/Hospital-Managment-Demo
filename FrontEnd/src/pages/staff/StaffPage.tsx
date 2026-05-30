import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddStaffModal } from '@/components/modals/AddStaffModal';
import { StaffScheduleModal } from '@/components/modals/StaffScheduleModal';
import { StaffRoleFilters, StaffFilterChips } from '@/components/staff/StaffRoleFilters';
import { StaffCard } from '@/components/staff/StaffCard';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { useToast } from '@/hooks/useToast';
import { staffDetailPath } from '@/constants/routes';
import {
  MOCK_STAFF,
  STAFF_STATS,
  emptyStaffForm,
  filterToRole,
  getInitials,
  pickAvatarClass,
  type StaffFilter,
  type StaffFormValues,
  type StaffMember,
} from './data/mockStaff';

const PAGE_SIZE = 6;

export const StaffPage = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffFilter>('all');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(emptyStaffForm());
  const { showToast } = useToast();

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

  const handleAdd = (values: StaffFormValues) => {
    const id = `STF-${String(staff.length + 1).padStart(3, '0')}`;
    const statLabel =
      values.role === 'Pharmacist'
        ? 'Dispensed'
        : values.role === 'Support'
          ? 'Handled'
          : 'Patients';

    const newMember: StaffMember = {
      id,
      name: values.name.trim(),
      role: values.role,
      title: values.title.trim(),
      initials: getInitials(values.name),
      avatarClass: pickAvatarClass(values.name),
      status: 'On Duty',
      statPrimary: { value: 0, label: statLabel },
      today: 0,
      todayLabel: 'Today',
      rating: 5.0,
      tags: [values.role],
      shift: values.shift.trim() || '9AM – 5PM',
    };

    setStaff((prev) => [newMember, ...prev]);
    setAddOpen(false);
    showToast(`${newMember.name} added to staff directory`, 'success');
  };

  return (
    <div className="pb-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            Staff Directory
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {STAFF_STATS.total} total staff · {STAFF_STATS.onDuty} on duty today
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="gap-2 rounded-lg px-4 py-2"
            onClick={() => setScheduleOpen(true)}
          >
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
            Schedule
          </Button>
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
        </div>
      </div>

      <div className="mb-4">
        <StaffRoleFilters active={roleFilter} onChange={setFilter} />
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
          {pageStaff.length === 0 ? (
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
      />

      <StaffScheduleModal
        open={scheduleOpen}
        staff={staff}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  );
};

export default StaffPage;
