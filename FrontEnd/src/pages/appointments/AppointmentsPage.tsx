import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal';
import { ScheduleProgramModal } from '@/components/modals/ScheduleProgramModal';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentStatsCards } from '@/components/appointments/AppointmentStatsCards';
import { ScheduleListItem } from '@/components/appointments/ScheduleListItem';
import { ViewSwitcher, type CalendarView } from '@/components/appointments/ViewSwitcher';
import { StaffPagination } from '@/components/staff/StaffPagination';
import { formInputClass, formSelectClass } from '@/components/ui/formStyles';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { panchakarmaAdminService } from '@/services/panchakarma/panchakarmaAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { emptyAppointmentForm, hmsToAppointment } from '@/utils/appointmentHelpers';
import {
  emptyScheduleProgramForm,
  mapTherapistsFromApi,
} from '@/utils/panchakarmaHelpers';
import type {
  Appointment,
  AppointmentDoctor,
  AppointmentFormValues,
  AppointmentStats,
  AppointmentStatus,
} from '@/types/appointment.types';
import type {
  ScheduleProgramFormValues,
  TherapistOnDuty,
  TreatmentRoom,
} from '@/types/panchakarma.types';

const defaultStats = (): AppointmentStats => ({
  scheduledToday: 0,
  completed: 0,
  panchakarma: 0,
  cancelled: 0,
});

const LIST_PAGE_SIZE = 8;

type StatusFilter = 'all' | AppointmentStatus;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Soon', label: 'Pending' },
  { value: 'In', label: 'Checked in' },
  { value: 'Done', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const statusPriority: Record<AppointmentStatus, number> = {
  Soon: 0,
  In: 1,
  Done: 2,
  Cancelled: 3,
};

export const AppointmentsPage = () => {
  const { patients } = useAdminPatientsList();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);
  const [stats, setStats] = useState<AppointmentStats>(defaultStats());
  const [therapists, setTherapists] = useState<TherapistOnDuty[]>([]);
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [panchakarmaSubmitting, setPanchakarmaSubmitting] = useState(false);
  const [view, setView] = useState<CalendarView>('month');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleInitial, setScheduleInitial] = useState(emptyScheduleProgramForm());
  const [formInitial, setFormInitial] = useState(emptyAppointmentForm());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [listPage, setListPage] = useState(1);
  const [filterByDay, setFilterByDay] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { canEdit, isStaff, staffRole, staffCode } = usePermissions();

  const lockedDoctor = useMemo((): AppointmentDoctor | null => {
    if (!isStaff || staffRole !== 'Doctor' || !staffCode) return null;
    const fromList = doctors.find((d) => d.staffCode === staffCode);
    if (fromList) return fromList;
    return {
      staffCode,
      id: staffCode,
      name: user?.name ?? 'You',
      title: user?.title ?? '',
      role: 'Doctor',
    };
  }, [isStaff, staffRole, staffCode, doctors, user]);

  const canCreatePanchakarma = staffRole !== 'Therapist' && canEdit('panchakarma');
  const canAttendVisits = isStaff && staffRole === 'Doctor' && canEdit('appointments');

  const selectedDateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const filteredSchedule = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...appointments];

    if (filterByDay) {
      list = list.filter((a) => a.date === selectedDateIso);
    }

    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (q) {
      list = list.filter((a) =>
        [a.patientName, a.doctorName, a.id, a.type, a.patientId]
          .some((field) => field?.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const statusCmp = statusPriority[a.status] - statusPriority[b.status];
      if (statusCmp !== 0) return statusCmp;

      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdA !== createdB) return createdB - createdA;

      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : a.time.localeCompare(b.time);
    });
  }, [appointments, filterByDay, selectedDateIso, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedule.length / LIST_PAGE_SIZE));

  const paginatedSchedule = useMemo(() => {
    const start = (listPage - 1) * LIST_PAGE_SIZE;
    return filteredSchedule.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredSchedule, listPage]);

  useEffect(() => {
    setListPage(1);
  }, [search, statusFilter, filterByDay, selectedDateIso]);

  useEffect(() => {
    if (listPage > totalPages) setListPage(totalPages);
  }, [listPage, totalPages]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setFilterByDay(true);
  };

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const requests: Promise<unknown>[] = [
        appointmentAdminService.list(),
        appointmentAdminService.getStats(),
        appointmentAdminService.listDoctors(),
      ];

      if (canCreatePanchakarma) {
        requests.push(
          panchakarmaAdminService.listTherapists(),
          panchakarmaAdminService.listRooms()
        );
      }

      const results = await Promise.all(requests);
      const apptRes = results[0] as Awaited<ReturnType<typeof appointmentAdminService.list>>;
      const statsRes = results[1] as Awaited<ReturnType<typeof appointmentAdminService.getStats>>;
      const doctorsRes = results[2] as Awaited<ReturnType<typeof appointmentAdminService.listDoctors>>;

      setAppointments((apptRes.data.res?.appointments ?? []).map(hmsToAppointment));
      setStats(statsRes.data.res?.stats ?? defaultStats());
      setDoctors(doctorsRes.data.res?.doctors ?? []);

      if (canCreatePanchakarma && results.length > 3) {
        const therapistsRes = results[3] as Awaited<
          ReturnType<typeof panchakarmaAdminService.listTherapists>
        >;
        const roomsRes = results[4] as Awaited<ReturnType<typeof panchakarmaAdminService.listRooms>>;
        setTherapists(mapTherapistsFromApi(therapistsRes.data.res?.therapists ?? []));
        setRooms(roomsRes.data.res?.rooms ?? []);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setListLoading(false);
    }
  }, [showToast, canCreatePanchakarma]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openNew = () => {
    setFormInitial({
      ...emptyAppointmentForm(),
      date: selectedDateIso,
      staffCode: lockedDoctor?.staffCode ?? '',
    });
    setModalOpen(true);
  };

  const openPanchakarmaForAppointment = (appointment: Appointment) => {
    setScheduleInitial({
      ...emptyScheduleProgramForm(),
      patientId: appointment.patientId,
      startDate: appointment.date || new Date().toISOString().slice(0, 10),
    });
    setScheduleOpen(true);
  };

  const handleCreate = async (values: AppointmentFormValues) => {
    setSubmitting(true);
    try {
      const { data } = await appointmentAdminService.create(values);
      if (data.status_code === 201) {
        setModalOpen(false);
        showToast('Appointment scheduled successfully', 'success');
        await loadData();
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePanchakarma = async (values: ScheduleProgramFormValues) => {
    setPanchakarmaSubmitting(true);
    try {
      const { data } = await panchakarmaAdminService.create(values);
      if (data.status_code === 201) {
        setScheduleOpen(false);
        showToast('Panchakarma program created — therapist can attend', 'success');
        await loadData();
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setPanchakarmaSubmitting(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-sage-deep sm:text-[1.75rem]">
            {lockedDoctor ? 'My Appointments' : 'Appointments'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {appointments.length} appointment{appointments.length === 1 ? '' : 's'}
            {lockedDoctor ? ` · ${lockedDoctor.name}` : ''}
            {stats.scheduledToday > 0 ? ` · ${stats.scheduledToday} today` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher value={view} onChange={setView} />
          {canEdit('appointments') ? (
            <Button className="gap-2 rounded-lg px-4 py-2" onClick={openNew}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              New Appointment
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(240px,300px)_1fr]">
        <AppointmentCalendar
          month={month}
          year={year}
          selectedDay={selectedDay}
          appointments={appointments}
          onSelectDay={handleSelectDay}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          compact
        />

        <aside className="flex min-h-0 min-w-0 flex-col gap-3">
          <AppointmentStatsCards stats={stats} />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
            <div className="space-y-3 border-b border-border-sage px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    {filterByDay ? 'Appointments on date' : 'All appointments'}
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {filterByDay ? selectedDateIso : `${filteredSchedule.length} shown`}
                    {' · '}Pending first
                  </p>
                </div>
                {filterByDay ? (
                  <button
                    type="button"
                    onClick={() => setFilterByDay(false)}
                    className="cursor-pointer text-[11px] font-semibold text-sage-deep hover:underline"
                  >
                    Show all
                  </button>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-ghost" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search patient, doctor, ID…"
                    className={`${formInputClass} py-1.5 pl-8 text-sm`}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className={`${formSelectClass} py-1.5 text-sm`}
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {listLoading ? (
                <p className="py-8 text-center text-sm text-ink-soft">Loading…</p>
              ) : paginatedSchedule.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-soft">
                  {search || statusFilter !== 'all'
                    ? 'No appointments match your filters'
                    : filterByDay
                      ? 'No appointments on this date'
                      : 'No appointments yet'}
                </p>
              ) : (
                paginatedSchedule.map((a) => (
                  <ScheduleListItem
                    key={a.id}
                    appointment={a}
                    canAttend={canAttendVisits && a.staffCode === staffCode}
                    canSchedulePanchakarma={canCreatePanchakarma}
                    onSchedulePanchakarma={openPanchakarmaForAppointment}
                  />
                ))
              )}
            </div>

            {filteredSchedule.length > 0 ? (
              <StaffPagination
                from={(listPage - 1) * LIST_PAGE_SIZE + 1}
                to={Math.min(listPage * LIST_PAGE_SIZE, filteredSchedule.length)}
                total={filteredSchedule.length}
                currentPage={listPage}
                totalPages={totalPages}
                onPageChange={setListPage}
                entityLabel="appointments"
              />
            ) : null}
          </div>
        </aside>
      </div>

      <NewAppointmentModal
        key={modalOpen ? 'open' : 'closed'}
        open={modalOpen}
        initial={formInitial}
        patients={patients}
        doctors={doctors}
        lockedDoctor={lockedDoctor}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      {canCreatePanchakarma ? (
        <ScheduleProgramModal
          open={scheduleOpen}
          initial={scheduleInitial}
          patients={patients}
          therapists={therapists}
          rooms={rooms}
          submitting={panchakarmaSubmitting}
          onClose={() => setScheduleOpen(false)}
          onSubmit={handleCreatePanchakarma}
        />
      ) : null}
    </div>
  );
};

export default AppointmentsPage;
