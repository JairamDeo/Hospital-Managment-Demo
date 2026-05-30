import type { TreatmentRoom } from '@/pages/panchakarma/data/mockPanchakarma';

interface Props {
  rooms: TreatmentRoom[];
  className?: string;
}

const statusStyles = {
  Occupied: 'text-warning',
  Available: 'text-success',
  Cleaning: 'text-ink-ghost',
};

export const TreatmentRoomsPanel = ({ rooms, className = '' }: Props) => (
  <div
    className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-sage bg-white ${className}`}
  >
    <div className="shrink-0 border-b border-border-sage px-4 py-2.5">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
        Treatment Rooms
      </h3>
    </div>
    <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-border-sage/80 overflow-y-auto">
      {rooms.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
          <div>
            <p className="text-[13px] font-semibold text-ink">{r.name}</p>
            <p className="text-[11px] text-ink-soft">{r.therapy}</p>
          </div>
          <span className={`text-xs font-semibold ${statusStyles[r.status]}`}>{r.status}</span>
        </div>
      ))}
    </div>
  </div>
);
