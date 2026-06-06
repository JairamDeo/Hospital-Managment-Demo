import { ClipboardCheck, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { patientDetailPath, programAttendPath } from '@/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';
import { isTherapistAssignedToProgram, programNeedsAttend } from '@/utils/panchakarmaHelpers';
import type { ActiveProgram } from '@/types/panchakarma.types';
import { TherapyBadge } from './TherapyBadge';
import { ProgramStatusBadge } from './ProgramStatusBadge';
import { AnimatedProgressBar } from './AnimatedProgressBar';

interface Props {
  programs: ActiveProgram[];
}

export const ActiveProgramsTable = ({ programs }: Props) => {
  const { staffRole, staffCode, canView } = usePermissions();
  const isTherapist = staffRole === 'Therapist' && Boolean(staffCode);
  const canAttendPrograms = isTherapist && canView('panchakarma');

  const canShowAttend = (program: ActiveProgram) =>
    canAttendPrograms &&
    isTherapistAssignedToProgram(program, staffCode) &&
    (program.needsAttend ?? programNeedsAttend(program));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-border-sage bg-cream/50">
            {['Patient', 'Therapy', 'Day', 'Room', 'Progress', 'Status', 'Actions'].map((col) => (
              <th
                key={col}
                className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {programs.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-soft">
                No active programs
              </td>
            </tr>
          ) : (
            programs.map((p) => {
              const attend = canShowAttend(p);
              return (
                <tr
                  key={p.id}
                  className="border-b border-border-sage/80 transition-colors last:border-b-0 hover:bg-sage-mist/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${p.avatarClass}`}
                      >
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight text-ink">{p.patientName}</p>
                        <p className="text-[11px] text-ink-ghost">#{p.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TherapyBadge therapy={p.therapy} />
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-soft">
                    Day {p.currentDay}/{p.totalDays}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-soft">{p.room}</td>
                  <td className="px-4 py-3">
                    <AnimatedProgressBar progress={p.progress} />
                  </td>
                  <td className="px-4 py-3">
                    <ProgramStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {attend ? (
                        <Link
                          to={programAttendPath(p.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-sage-deep px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sage-deep/90"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          Attend
                        </Link>
                      ) : null}
                      <Link
                        to={patientDetailPath(p.patientId)}
                        className="inline-flex cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                        aria-label={`View ${p.patientName}`}
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
