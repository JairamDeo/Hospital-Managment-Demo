import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentStatsCards } from '@/components/appointments/AppointmentStatsCards';
import { ScheduleListItem } from '@/components/appointments/ScheduleListItem';
import { ViewSwitcher, type CalendarView } from '@/components/appointments/ViewSwitcher';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { emptyAppointmentForm, hmsToAppointment } from '@/utils/appointmentHelpers';
import type {
  Appointment,
  AppointmentDoctor,
  AppointmentFormValues,
  AppointmentStats,
} from '@/types/appointment.types';

const defaultStats = (): AppointmentStats => ({
  scheduledToday: 0,
  completed: 0,
  panchakarma: 0,
  cancelled: 0,
});

export const AppointmentsPage = () => {
  const { patients } = useAdminPatientsList();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<AppointmentDoctor[]>([]);
  const [stats, setStats] = useState<AppointmentStats>(defaultStats());
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<CalendarView>('month');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [modalOpen, setModalOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(emptyAppointmentForm());
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

  const [filterByDay, setFilterByDay] = useState(false);

  const selectedDateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        return dateCmp !== 0 ? dateCmp : a.time.localeCompare(b.time);
      }),
    [appointments]
  );

  const visibleSchedule = useMemo(() => {
    const list = filterByDay
      ? sortedAppointments.filter((a) => a.date === selectedDateIso)
      : sortedAppointments;
    return [...list].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      return dateCmp !== 0 ? dateCmp : a.time.localeCompare(b.time);
    });
  }, [sortedAppointments, filterByDay, selectedDateIso]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setFilterByDay(true);
  };

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const [apptRes, statsRes, doctorsRes] = await Promise.all([
        appointmentAdminService.list(),
        appointmentAdminService.getStats(),
        appointmentAdminService.listDoctors(),
      ]);
      setAppointments((apptRes.data.res?.appointments ?? []).map(hmsToAppointment));
      setStats(statsRes.data.res?.stats ?? defaultStats());
      setDoctors(doctorsRes.data.res?.doctors ?? []);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

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

  const handleCreate = async (values: AppointmentFormValues) => {
    setSubmitting(true);
    try {
      const { data } = await appointmentAdminService.create(values);
      if (data.status_code === 201) {
        setModalOpen(false);
        showToast(`Appointment scheduled successfully`, 'success');
        await loadData();
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
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

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 xl:grid-cols-[1fr_320px]">
        <AppointmentCalendar
          month={month}
          year={year}
          selectedDay={selectedDay}
          appointments={appointments}
          onSelectDay={handleSelectDay}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <aside className="flex h-full min-h-0 flex-col gap-3">
          <AppointmentStatsCards stats={stats} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-sage bg-white shadow-sm">
            <div className="border-b border-border-sage px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    {filterByDay ? 'Schedule for date' : 'All appointments'}
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {filterByDay
                      ? selectedDateIso
                      : `${visibleSchedule.length} total`}
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
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {listLoading ? (
                <p className="py-8 text-center text-sm text-ink-soft">Loading…</p>
              ) : visibleSchedule.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-soft">
                  {filterByDay ? 'No appointments on this date' : 'No appointments yet'}
                </p>
              ) : (
                visibleSchedule.map((a) => <ScheduleListItem key={a.id} appointment={a} />)
              )}
            </div>
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
    </div>
  );
};

export default AppointmentsPage;
