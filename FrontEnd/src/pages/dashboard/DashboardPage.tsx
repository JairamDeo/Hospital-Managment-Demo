import { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, CalendarCheck, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { appointmentAdminService } from '@/services/appointment/appointmentAdmin.service';
import { formatDisplayName, getInitials } from '@/utils/helpers';
import { hmsToAppointment, formatTimeLabel } from '@/utils/appointmentHelpers';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentRow } from '@/components/dashboard/AppointmentRow';
import { LabDashboardPanel } from '@/components/dashboard/LabDashboardPanel';
import { ROUTES } from '@/constants/routes';
import type { Appointment } from '@/types/appointment.types';

const ClinicDashboardPanel = () => {
  const { user } = useAuth();
  const { staffRole, isAdmin } = usePermissions();
  const [patientTotal, setPatientTotal] = useState(0);
  const [newThisWeek, setNewThisWeek] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    patientAdminService
      .getStats()
      .then(({ data }) => {
        setPatientTotal(data.res?.stats?.total ?? 0);
        setNewThisWeek(data.res?.stats?.newThisWeek ?? 0);
      })
      .catch(() => {
        setPatientTotal(0);
        setNewThisWeek(0);
      });
  }, []);

  useEffect(() => {
    appointmentAdminService
      .getStats()
      .then(({ data }) => {
        setTodayVisits(data.res?.stats?.scheduledToday ?? 0);
      })
      .catch(() => setTodayVisits(0));

    appointmentAdminService
      .list()
      .then(({ data }) => {
        const rows = (data.res?.appointments ?? []).map(hmsToAppointment);
        const today = new Date().toISOString().slice(0, 10);
        const todayRows = rows.filter((a) => a.date === today && a.status !== 'Cancelled');
        setTodayAppointments(todayRows.slice(0, 4));
      })
      .catch(() => {
        setTodayAppointments([]);
      });
  }, []);

  const name = formatDisplayName(user?.firstName, user?.lastName, user?.name);
  const initials = getInitials(user?.firstName, user?.lastName);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const titlePrefix =
    isAdmin || staffRole === 'Doctor' ? 'Dr. ' : staffRole === 'Therapist' ? '' : '';

  const dashboardRows = useMemo(
    () =>
      todayAppointments.map((a) => ({
        appointmentId: a.id,
        time: formatTimeLabel(a.time),
        name: a.patientName,
        type: a.type,
        status: (a.status === 'In' ? 'Checked In' : 'Upcoming') as 'Upcoming' | 'Checked In',
        initials: a.initials,
        avatarClass: a.avatarClass,
      })),
    [todayAppointments]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-8 flex shrink-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-pale text-base font-bold text-sage-deep ring-2 ring-sage-light/40">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{greeting},</p>
          <h2 className="mt-2 truncate font-serif text-2xl font-semibold leading-tight text-ink">
            {titlePrefix}
            {name}
          </h2>
          <p className="mt-1.5 text-xs text-ink-soft">Here&apos;s your clinic overview for today</p>
        </div>
      </div>

      <p className="mb-3 shrink-0 text-[10px] font-bold uppercase tracking-widest text-ink-ghost">
        Patient Statistics
      </p>

      <div className="mb-4 grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={patientTotal.toLocaleString('en-IN')}
          subLabel="Registered"
          icon={Users}
          className="bg-sage-deep"
        />
        <StatCard
          label="New This Week"
          value={String(newThisWeek)}
          subLabel="Last 7 days"
          icon={UserPlus}
          className="bg-[#2a6b54]"
        />
        <StatCard
          label="Today's Visits"
          value={String(todayVisits)}
          subLabel="Scheduled"
          icon={CalendarCheck}
          className="bg-sage-mid"
        />
        <StatCard
          label="Today's Queue"
          value={String(todayAppointments.length)}
          subLabel="Listed below"
          icon={Activity}
          className="bg-sage-light"
        />
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-sage bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-4 py-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            Today&apos;s Appointments
          </h3>
          <Link
            to={ROUTES.ADMIN_APPOINTMENTS}
            className="cursor-pointer rounded-full border border-border-sage px-3 py-1 text-[10px] font-semibold text-ink-soft hover:bg-sage-mist"
          >
            List view
          </Link>
        </div>
        <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
          {dashboardRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No appointments scheduled for today</p>
          ) : (
            dashboardRows.map((a) => <AppointmentRow key={a.appointmentId} {...a} />)
          )}
        </div>
      </section>
    </div>
  );
};

export const DashboardPage = () => {
  const { staffRole } = usePermissions();

  if (staffRole === 'Lab') {
    return <LabDashboardPanel />;
  }

  return <ClinicDashboardPanel />;
};

export default DashboardPage;
