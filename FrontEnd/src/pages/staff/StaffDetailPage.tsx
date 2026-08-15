import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { staffAdminService } from '@/services/staff/staffAdmin.service';
import { appointmentsToStaffAssignments } from '@/utils/appointmentHelpers';
import { programsToStaffAssignments } from '@/utils/panchakarmaHelpers';
import { hmsToStaffProfileCard } from '@/utils/staffDetailHelpers';
import { getApiErrorMessage } from '@/utils/helpers';
import type { StaffAssignment } from './data/mockStaffDetails';
import { AddStaffModal } from '@/components/modals/AddStaffModal';
import { StaffProfileCard } from '@/components/staff/detail/StaffProfileCard';
import { StaffDetailTabs } from '@/components/staff/detail/StaffDetailTabs';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { ROUTES } from '@/constants/routes';
import type { StaffFormValues } from '@/types/staff.types';
import type { StaffProfileCardData } from '@/types/staffProfile.types';

export const StaffDetailPage = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const { showToast } = useToast();
  const { isAdmin, isStaff, staffCode, canEdit } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [staff, setStaff] = useState<StaffProfileCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignmentRows, setAssignmentRows] = useState<StaffAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const isOwnProfile = Boolean(isStaff && staffCode && staffId === staffCode);

  useEffect(() => {
    if (!staffId) return;
    let cancelled = false;

    const loadStaff = async () => {
      setLoading(true);
      try {
        const { data } = await staffAdminService.get(staffId);
        const member = data.res?.staff;
        if (!member) throw new Error('Staff not found');
        if (!cancelled) {
          setStaff(hmsToStaffProfileCard(member));
        }
      } catch (err) {
        if (!cancelled) {
          showToast(getApiErrorMessage(err), 'error');
          setStaff(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStaff();
    return () => {
      cancelled = true;
    };
  }, [staffId, showToast]);

  useEffect(() => {
    if (!staffId || !staff) return;
    let cancelled = false;
    setAssignmentsLoading(true);

    const loadAssignments = async () => {
      try {
        const requests: Promise<StaffAssignment[]>[] = [];

        if (staff.role === 'Doctor') {
          requests.push(
            appointmentAdminService.listByStaff(staffId).then((res) =>
              appointmentsToStaffAssignments(res.data.res?.appointments ?? [])
            )
          );
        }

        if (staff.role === 'Therapist') {
          requests.push(
            panchakarmaAdminService.listByStaff(staffId).then((res) =>
              programsToStaffAssignments(res.data.res?.programs ?? [])
            )
          );
        }

        if (requests.length === 0) {
          if (!cancelled) setAssignmentRows([]);
          return;
        }

        const results = await Promise.all(requests);
        if (!cancelled) setAssignmentRows(results.flat());
      } catch {
        if (!cancelled) setAssignmentRows([]);
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    };

    void loadAssignments();
    return () => {
      cancelled = true;
    };
  }, [staffId, staff]);

  const formInitial = useMemo(() => {
    if (!staff) return undefined;
    return {
      name: staff.name,
      role: staff.role,
      title: staff.title,
      shift: staff.shift,
      registrationNumber: staff.registrationNumber ?? '',
      aadharNumber: staff.aadharNumber ?? '',
      panNumber: staff.panNumber ?? '',
      qualifications: staff.qualifications?.length
        ? staff.qualifications.map((q) => ({
            level: q.level as StaffFormValues['qualifications'][0]['level'],
            degree: q.degree,
          }))
        : [{ level: 'UG' as const, degree: '' }],
    } satisfies StaffFormValues;
  }, [staff]);

  if (!staffId) {
    return <Navigate to={ROUTES.ADMIN_STAFF} replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] py-16 text-center text-sm text-ink-soft">
        Loading staff profile…
      </div>
    );
  }

  if (!staff) {
    return <Navigate to={ROUTES.ADMIN_STAFF} replace />;
  }

  const handleEditSubmit = async (values: StaffFormValues) => {
    if (!staffId) return;
    try {
      await staffAdminService.update(staffId, values);
      showToast('Staff profile updated successfully', 'success');
      setEditOpen(false);
      setStaff((prev) =>
        prev
          ? {
              ...prev,
              name: values.name.trim(),
              role: values.role,
              title: values.title.trim(),
              shift: values.shift.trim() || prev.shift,
              registrationNumber: values.registrationNumber.trim(),
              aadharNumber: values.aadharNumber,
              panNumber: values.panNumber,
              qualifications: values.qualifications,
            }
          : prev
      );
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const canCheckInOut = isOwnProfile;
  const canUploadDocuments = isAdmin;
  const showEdit = isAdmin && canEdit('staff');

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[300px] xl:w-[320px]">
          <StaffProfileCard
            staff={staff}
            onEdit={showEdit ? () => setEditOpen(true) : undefined}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <StaffDetailTabs
            staff={staff}
            appointmentAssignments={assignmentRows}
            assignmentsLoading={assignmentsLoading}
            assignmentsMode={staff.role === 'Therapist' ? 'panchakarma' : 'appointments'}
            isAdmin={isAdmin}
            isOwnProfile={isOwnProfile}
            canCheckInOut={canCheckInOut}
            canUploadDocuments={canUploadDocuments}
            activityRefreshKey={activityRefreshKey}
            onLeaveChanged={() => setActivityRefreshKey((k) => k + 1)}
          />
        </section>
      </div>

      {showEdit && formInitial ? (
        <AddStaffModal
          key={`edit-${staff.id}`}
          open={editOpen}
          mode="edit"
          initial={formInitial}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      ) : null}
    </div>
  );
};

export default StaffDetailPage;
