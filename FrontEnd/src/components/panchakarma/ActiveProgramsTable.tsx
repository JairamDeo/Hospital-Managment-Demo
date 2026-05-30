import type { ActiveProgram } from '@/pages/panchakarma/data/mockPanchakarma';
import { TherapyBadge } from './TherapyBadge';
import { ProgramStatusBadge } from './ProgramStatusBadge';
import { AnimatedProgressBar } from './AnimatedProgressBar';

interface Props {
  programs: ActiveProgram[];
}

export const ActiveProgramsTable = ({ programs }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {['Patient', 'Therapy', 'Day', 'Room', 'Progress', 'Status'].map((col) => (
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
            <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft">
              No active programs
            </td>
          </tr>
        ) : (
          programs.map((p) => (
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
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
