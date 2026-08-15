import { Eye, SquarePen } from 'lucide-react';
import type { Patient } from '@/types/patient.types';
import { PrakritiBadge } from './PrakritiBadge';
import { PatientStatusBadge } from './PatientStatusBadge';

interface Props {
  patients: Patient[];
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
}

export const PatientTable = ({ patients, onView, onEdit }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[800px] border-collapse">
      <thead>
        <tr className="border-b border-border-sage bg-cream/50">
          {['Patient', 'Prakriti', 'Age', 'Last Visit', 'Treatment', 'Status', 'Actions'].map(
            (col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-ink-ghost"
              >
                {col}
              </th>
            )
          )}
        </tr>
      </thead>
      <tbody>
        {patients.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-soft">
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
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${p.avatarClass}`}
                  >
                    {p.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-ink-ghost">#{p.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <PrakritiBadge prakriti={p.prakriti} />
              </td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{p.age} yrs</td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{p.lastVisit}</td>
              <td className="px-4 py-3.5 text-sm text-ink-soft">{p.treatment}</td>
              <td className="px-4 py-3.5">
                <PatientStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onView(p)}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                    aria-label={`View ${p.name}`}
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="cursor-pointer rounded-lg p-2 text-ink-ghost hover:bg-sage-mist hover:text-ink-soft"
                    aria-label={`Edit ${p.name}`}
                  >
                    <SquarePen className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
