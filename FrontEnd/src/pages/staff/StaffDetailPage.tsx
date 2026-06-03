import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AddStaffModal } from '@/components/modals/AddStaffModal';
import { StaffProfileCard } from '@/components/staff/detail/StaffProfileCard';
import { StaffTodayScheduleCard } from '@/components/staff/detail/StaffTodayScheduleCard';
import { StaffMetricsRow } from '@/components/staff/detail/StaffMetricsRow';
import { StaffDetailTabs } from '@/components/staff/detail/StaffDetailTabs';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { buildStaffDetail, staffToForm } from './data/mockStaffDetails';
import { MOCK_STAFF, type StaffFormValues, type StaffMember } from './data/mockStaff';

export const StaffDetailPage = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [staffList, setStaffList] = useState(MOCK_STAFF);

  const staff = useMemo(() => {
    const base = staffList.find((s) => s.id === staffId);
    return base ? buildStaffDetail(base) : null;
  }, [staffId, staffList]);

  if (!staffId || !staff) {
    return <Navigate to={ROUTES.ADMIN_STAFF} replace />;
  }

  const formInitial = staffToForm(staff);

  const handleEditSubmit = (values: StaffFormValues) => {
    const updated: StaffMember = {
      ...staff,
      name: values.name.trim(),
      role: values.role,
      title: values.title.trim(),
      shift: values.shift.trim() || staff.shift,
    };
    setStaffList((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
    setEditOpen(false);
    showToast('Staff profile updated successfully', 'success');
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <StaffProfileCard
            staff={staff}
            onEdit={() => setEditOpen(true)}
            onSchedule={() => showToast('Full schedule shown in Schedule tab', 'success')}
          />
          <StaffTodayScheduleCard slots={staff.todaySchedule} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <StaffDetailTabs staff={staff} />
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Performance Overview
            </h3>
            <StaffMetricsRow metrics={staff.metrics} />
          </div>
        </section>
      </div>

      <AddStaffModal
        key={`edit-${staff.id}`}
        open={editOpen}
        initial={formInitial}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default StaffDetailPage;
