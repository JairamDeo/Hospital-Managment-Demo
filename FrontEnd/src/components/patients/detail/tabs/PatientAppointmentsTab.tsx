import { Link } from 'react-router-dom';
import { appointmentFollowUpPath, panchakarmaTreatmentPath } from '@/constants/routes';
import type { PatientAppointment } from '@/types/patientDetail.types';

const isPanchakarmaAppointment = (type: string) =>
  type.toLowerCase().includes('panchakarma');

const attendPathFor = (a: PatientAppointment) => {
  const code = a.appointmentCode ?? a.id;
  return isPanchakarmaAppointment(a.type)
    ? panchakarmaTreatmentPath(code)
    : appointmentFollowUpPath(code);
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
  if (appointments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-soft">No appointments recorded yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-sage">
      <table className="w-full min-w-[720px] border-collapse">
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
            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Follow-up
            </th>
            {canManageVisits ? (
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
                Action
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => {
            const code = a.appointmentCode ?? a.id;
            return (
              <tr
                key={a.id}
                className="border-b border-border-sage/70 last:border-b-0 hover:bg-sage-mist/30"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-ink">{a.date}</p>
                  <p className="text-xs text-ink-ghost">{a.time}</p>
                </td>
                <td className="px-4 py-3 text-sm text-ink-soft">{a.type}</td>
                <td className="px-4 py-3 text-sm font-medium text-ink">{a.doctor}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${APPT_STATUS_STYLE[a.status]}`}
                  >
                    {APPT_STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-ink-soft">
                  {a.followUpDate ? (
                    <span className="font-medium text-sage-deep">
                      {a.followUpDate}
                      {a.followUpTime ? ` · ${a.followUpTime}` : null}
                    </span>
                  ) : (
                    <span className="text-ink-ghost">—</span>
                  )}
                </td>
                {canManageVisits ? (
                  <td className="px-4 py-3">
                    {a.status === 'Upcoming' ? (
                      <Link
                        to={attendPathFor(a)}
                        className="inline-flex cursor-pointer rounded-lg bg-sage-deep px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-deep/90"
                      >
                        Attend
                      </Link>
                    ) : a.status === 'Completed' && !isPanchakarmaAppointment(a.type) ? (
                      <Link
                        to={appointmentFollowUpPath(code)}
                        className="inline-flex cursor-pointer rounded-lg border border-border-sage bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-sage-mist"
                      >
                        {a.hasFollowUp ? 'Follow-up & Rx' : 'Follow-up & Rx'}
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
