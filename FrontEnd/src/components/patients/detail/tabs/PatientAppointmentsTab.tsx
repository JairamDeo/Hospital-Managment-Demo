import { Link } from 'react-router-dom';
import { appointmentFollowUpPath } from '@/constants/routes';
import type { PatientAppointment } from '@/types/patientDetail.types';

const APPT_STATUS: Record<PatientAppointment['status'], string> = {
  Upcoming: 'bg-blue-50 text-blue-700',
  Completed: 'bg-success-bg text-success',
  Cancelled: 'bg-danger-bg text-danger',
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
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${APPT_STATUS[a.status]}`}
                  >
                    {a.status}
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
                        to={appointmentFollowUpPath(code)}
                        className="inline-flex cursor-pointer rounded-lg bg-sage-deep px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-deep/90"
                      >
                        Attend
                      </Link>
                    ) : a.status === 'Completed' ? (
                      <Link
                        to={appointmentFollowUpPath(code)}
                        className="inline-flex cursor-pointer rounded-lg border border-border-sage bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-sage-mist"
                      >
                        {a.hasFollowUp ? 'View follow-up' : 'Add follow-up'}
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
