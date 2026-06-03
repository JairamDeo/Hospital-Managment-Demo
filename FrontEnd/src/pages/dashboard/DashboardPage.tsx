import { useEffect, useState } from 'react';
import { Users, UserPlus, CalendarCheck, Activity, Sprout, FlaskConical, Droplets, Flower2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { patientAdminService } from '@/services/patient/patientAdmin.service';
import { formatDisplayName, getInitials } from '@/utils/helpers';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentRow } from '@/components/dashboard/AppointmentRow';
import { PharmacyItem } from '@/components/dashboard/PharmacyItem';
import { ROUTES } from '@/constants/routes';
import { MOCK_APPOINTMENTS } from '@/pages/appointments/data/mockAppointments';

const formatDisplayTime = (time: string) => {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const dashboardAppointments = MOCK_APPOINTMENTS.slice(0, 4).map((a) => ({
  appointmentId: a.id,
  time: formatDisplayTime(a.time),
  name: a.patientName,
  type: a.type,
  status: (a.status === 'In' ? 'Checked In' : 'Upcoming') as 'Upcoming' | 'Checked In',
  initials: a.initials,
  avatarClass: a.avatarClass,
}));

const inventory = [
  { name: 'Ashwagandha Powder', unitsRemaining: 215, maxUnits: 500, status: 'Low' as const, icon: Sprout },
  { name: 'Triphala Churna', unitsRemaining: 380, maxUnits: 500, status: 'OK' as const, icon: Flower2 },
  { name: 'Brahmi Oil', unitsRemaining: 45, maxUnits: 300, status: 'Critical' as const, icon: Droplets },
  { name: 'Chyawanprash', unitsRemaining: 275, maxUnits: 400, status: 'OK' as const, icon: FlaskConical },
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const [patientTotal, setPatientTotal] = useState(0);
  const [newThisWeek, setNewThisWeek] = useState(0);

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

  const name = formatDisplayName(user?.firstName, user?.lastName, user?.name);
  const initials = getInitials(user?.firstName, user?.lastName);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-8 flex shrink-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-pale text-base font-bold text-sage-deep ring-2 ring-sage-light/40">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{greeting},</p>
          <h2 className="mt-2 truncate font-serif text-2xl font-semibold leading-tight text-ink">
            Dr. {name}
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
        <StatCard label="Today's Visits" value="22" subLabel="Scheduled" icon={CalendarCheck} className="bg-sage-mid" />
        <StatCard label="Active Treatments" value="98" subLabel="Ongoing" icon={Activity} className="bg-sage-light" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white lg:col-span-2">
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
            {dashboardAppointments.map((a) => (
              <AppointmentRow key={a.appointmentId} {...a} />
            ))}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white">
          <div className="shrink-0 border-b border-border-sage px-4 py-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Pharmacy Inventory
            </h3>
          </div>
          <div className="flex-1 divide-y divide-border-sage overflow-y-auto">
            {inventory.map((item) => (
              <PharmacyItem key={item.name} {...item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
