import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentStatsCards } from '@/components/appointments/AppointmentStatsCards';
import { ScheduleListItem } from '@/components/appointments/ScheduleListItem';
import { ViewSwitcher, type CalendarView } from '@/components/appointments/ViewSwitcher';
import { useToast } from '@/hooks/useToast';
import { useAdminPatientsList } from '@/hooks/useAdminPatientsList';
import {
  APPOINTMENT_STATS,
  MOCK_APPOINTMENTS,
  emptyAppointmentForm,
  type Appointment,
  type AppointmentFormValues,
} from './data/mockAppointments';

const SELECTED_DATE = '2023-10-26';

export const AppointmentsPage = () => {
  const { patients } = useAdminPatientsList();
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [view, setView] = useState<CalendarView>('month');
  const [month, setMonth] = useState(9);
  const [year, setYear] = useState(2023);
  const [selectedDay, setSelectedDay] = useState(26);
  const [modalOpen, setModalOpen] = useState(false);
  const [formInitial, setFormInitial] = useState(emptyAppointmentForm());
  const { showToast } = useToast();

  const todaySchedule = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.date === SELECTED_DATE)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments]
  );

  const openNew = () => {
    setFormInitial({
      ...emptyAppointmentForm(),
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
    });
    setModalOpen(true);
  };

  const handleCreate = (values: AppointmentFormValues) => {
    const patient = patients.find((p) => p.id === values.patientId);
    if (!patient) return;

    const newAppt: Appointment = {
      id: `APT-${String(appointments.length + 1).padStart(3, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      initials: patient.initials,
      avatarClass: patient.avatarClass,
      type: values.type,
      date: values.date,
      time: values.time,
      status: 'Soon',
      notes: values.notes,
    };

    setAppointments((prev) => [...prev, newAppt]);
    setModalOpen(false);
    showToast(`Appointment scheduled for ${patient.name}`, 'success');
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
            Appointments
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {APPOINTMENT_STATS.scheduledToday} scheduled today ·{' '}
            {APPOINTMENT_STATS.completed} completed
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher value={view} onChange={setView} />
          <Button className="gap-2 rounded-lg px-4 py-2" onClick={openNew}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 xl:grid-cols-[1fr_320px]">
        <AppointmentCalendar
          month={month}
          year={year}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <aside className="flex h-full min-h-0 flex-col gap-3">
          <AppointmentStatsCards />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-sage bg-white">
            <div className="shrink-0 border-b border-border-sage px-4 py-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Today&apos;s Schedule
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                Oct 26, 2023 · {todaySchedule.length} appointments
              </p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {todaySchedule.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-soft">No appointments today</p>
              ) : (
                todaySchedule.map((a) => <ScheduleListItem key={a.id} appointment={a} />)
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
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default AppointmentsPage;
