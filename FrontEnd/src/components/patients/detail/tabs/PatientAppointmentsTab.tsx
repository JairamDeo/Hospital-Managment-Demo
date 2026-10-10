import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { panchakarmaTreatmentPath, appointmentDetailPath } from '@/constants/routes';
import type { PatientAppointment } from '@/types/patientDetail.types';

const isPanchakarmaAppointment = (type: string) =>
  type.toLowerCase().includes('panchakarma');

const appointmentCodeOf = (a: PatientAppointment) =>
  String(a.appointmentCode || a.id || '').trim();

/** Attend → clinical overview first, then Continue to prescription */
const attendPathFor = (a: PatientAppointment) => {
  const code = appointmentCodeOf(a);
  return isPanchakarmaAppointment(a.type)
    ? panchakarmaTreatmentPath(code)
    : appointmentDetailPath(code);
};

const APPT_STATUS_STYLE: Record<PatientAppointment['status'], string> = {
  Upcoming: 'bg-warning-bg text-warning',
  Completed: 'bg-success-bg text-success',
  Cancelled: 'bg-danger-bg text-danger',
};

const APPT_STATUS_LABEL: Record<PatientAppointment['status'], string> = {
  Upcoming: 'Pending',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

interface Props {
  appointments: PatientAppointment[];
  canManageVisits?: boolean;
}

export const PatientAppointmentsTab = ({ appointments, canManageVisits = false }: Props) => {
  const visible = appointments.filter((a) => a.type !== 'Follow-up');

  if (visible.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-soft">No appointments recorded yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-sage">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-border-sage bg-cream/60">
            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Date & Time
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Type
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Doctor
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Status
            </th>
            {canManageVisits ? (
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Action
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {visible.map((a) => {
            const code = appointmentCodeOf(a);
            const canAttend = a.status === 'Upcoming' && Boolean(code);
            return (
              <tr
                key={code || a.id}
                className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-ink">{a.date}</p>
                  <p className="text-xs text-ink-ghost">{a.time}</p>
                </td>
                <td className="px-4 py-3 text-sm text-ink-soft">
                  {a.type === 'General Consult' ? 'Diet Consult' : a.type}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-ink">{a.doctor}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${APPT_STATUS_STYLE[a.status]}`}
                  >
                    {APPT_STATUS_LABEL[a.status]}
                  </span>
                </td>
                {canManageVisits ? (
                  <td className="px-4 py-3">
                    {canAttend ? (
                      <Link
                        to={attendPathFor(a)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sage-deep px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-deep/90"
                        title="Open prescription / complete visit"
                      >
                        <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Attend
                      </Link>
                    ) : (
                      <span className="text-xs text-ink-ghost">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
