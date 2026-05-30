import { Users, UserPlus, CalendarCheck, Activity, Sprout, FlaskConical, Droplets, Flower2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDisplayName, getInitials } from '@/utils/helpers';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentRow } from '@/components/dashboard/AppointmentRow';
import { PharmacyItem } from '@/components/dashboard/PharmacyItem';

const appointments = [
  { time: '10:30 AM', name: 'Rahul Singh', type: 'General Consult', status: 'Upcoming' as const, initials: 'RS', avatarClass: 'bg-blue-100 text-blue-700' },
  { time: '11:00 AM', name: 'Priya Mehta', type: 'Panchakarma Follow-up', status: 'Checked In' as const, initials: 'PM', avatarClass: 'bg-pink-100 text-pink-700' },
  { time: '11:45 AM', name: 'Amit Verma', type: 'Lab Review', status: 'Upcoming' as const, initials: 'AV', avatarClass: 'bg-amber-100 text-amber-800' },
  { time: '12:30 PM', name: 'Sunita Rao', type: 'Diet Consultation', status: 'Checked In' as const, initials: 'SR', avatarClass: 'bg-violet-100 text-violet-700' },
];

const inventory = [
  { name: 'Ashwagandha Powder', unitsRemaining: 215, maxUnits: 500, status: 'Low' as const, icon: Sprout },
  { name: 'Triphala Churna', unitsRemaining: 380, maxUnits: 500, status: 'OK' as const, icon: Flower2 },
  { name: 'Brahmi Oil', unitsRemaining: 45, maxUnits: 300, status: 'Critical' as const, icon: Droplets },
  { name: 'Chyawanprash', unitsRemaining: 275, maxUnits: 400, status: 'OK' as const, icon: FlaskConical },
];

export const DashboardPage = () => {
  const { user } = useAuth();
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
        <StatCard label="Total Patients" value="1,452" subLabel="+5%" icon={Users} showTrend className="bg-sage-deep" />
        <StatCard label="New Registrations" value="48" subLabel="Today" icon={UserPlus} className="bg-[#2a6b54]" />
        <StatCard label="Today's Visits" value="22" subLabel="Scheduled" icon={CalendarCheck} className="bg-sage-mid" />
        <StatCard label="Active Treatments" value="98" subLabel="Ongoing" icon={Activity} className="bg-sage-light" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white lg:col-span-2">
          <div className="flex shrink-0 items-center justify-between border-b border-border-sage px-4 py-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Today&apos;s Appointments
            </h3>
            <button
              type="button"
              className="cursor-pointer rounded-full border border-border-sage px-3 py-1 text-[10px] font-semibold text-ink-soft hover:bg-sage-mist"
            >
              List view
            </button>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {appointments.map((a) => (
              <AppointmentRow key={a.time + a.name} {...a} />
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
