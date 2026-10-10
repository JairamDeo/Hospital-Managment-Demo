import type { ReactNode } from 'react';
import { Eye, SquarePen } from 'lucide-react';
import type { Patient } from '@/types/patient.types';
import { PatientStatusBadge } from './PatientStatusBadge';

interface Props {
  patients: Patient[];
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
}

const ActionTip = ({ label, children }: { label: string; children: ReactNode }) => (
  <span className="group/tip relative inline-flex">
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-all duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
    >
      {label}
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
    </span>
  </span>
);

export const PatientTable = ({ patients, onView, onEdit }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {['Patient', 'Patient ID', 'Age', 'Last Visit', 'Status', 'Actions'].map((col) => (
            <th
              key={col}
              className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {patients.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-soft">
              No patients found
            </td>
          </tr>
        ) : (
          patients.map((p) => (
            <tr
              key={p.id}
              className="border-b border-border-sage/80 transition-colors last:border-b-0 hover:bg-sage-mist/40"
            >
              <td className="px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${p.avatarClass}`}
                  >
                    {p.initials}
                  </div>
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex max-w-full items-center truncate rounded-md border border-border-sage/80 bg-cream/70 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-sage-deep">
                  {p.id}
                </span>
              </td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{p.age} yrs</td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{p.lastVisit}</td>
              <td className="px-4 py-3.5">
                <PatientStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
                  <ActionTip label="View patient">
                    <button
                      type="button"
                      onClick={() => onView(p)}
                      className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                      aria-label="View patient"
                    >
                      <Eye className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </ActionTip>
                  <ActionTip label="Edit patient">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                      aria-label="Edit patient"
                    >
                      <SquarePen className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </ActionTip>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
