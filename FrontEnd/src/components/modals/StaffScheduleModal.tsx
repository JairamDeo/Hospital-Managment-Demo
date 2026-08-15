import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { StaffMember, StaffStats } from '@/types/staff.types';
import { defaultStaffStats } from '@/utils/staffHelpers';

interface Props {
  open: boolean;
  staff: StaffMember[];
  stats?: StaffStats;
  onClose: () => void;
}

const ScheduleRow = ({ member }: { member: StaffMember }) => {
  const isOnDuty = member.status === 'On Duty';
  const shiftParts = member.shift.split('–').map((s) => s.trim());

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-border-sage px-3 py-2.5 ${
        isOnDuty ? 'border-l-[3px] border-l-sage-deep bg-sage-mist/30' : 'bg-cream/40 opacity-80'
      }`}
    >
      <div className="w-16 shrink-0 text-center">
        <p className="text-[11px] font-bold leading-tight text-ink">
          {shiftParts[0] ?? member.shift}
        </p>
        {shiftParts[1] ? (
          <p className="text-[9px] font-semibold text-ink-ghost">to {shiftParts[1]}</p>
        ) : null}
      </div>

      <div className="h-8 w-px shrink-0 bg-border-sage" aria-hidden />

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${member.avatarClass}`}
      >
        {member.initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{member.name}</p>
        <p className="truncate text-[11px] text-ink-soft">
          {member.role} · {member.title}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          isOnDuty ? 'bg-success-bg text-success' : 'bg-cream text-ink-ghost'
        }`}
      >
        {member.status}
      </span>
    </div>
  );
};

export const StaffScheduleModal = ({ open, staff, stats, onClose }: Props) => {
  const summary = stats ?? defaultStaffStats();
  const onDuty = staff.filter((s) => s.status === 'On Duty');
  const offDuty = staff.filter((s) => s.status === 'Off Duty');
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Today's Staff Schedule"
      subtitle={`${today} · ${summary.onDuty} on duty`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <section>
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
            On Duty ({onDuty.length})
          </h4>
          <div className="scrollbar-thin max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {onDuty.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-soft">No staff on duty</p>
            ) : (
              onDuty.map((m) => <ScheduleRow key={m.id} member={m} />)
            )}
          </div>
        </section>

        {offDuty.length > 0 ? (
          <section>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-ghost">
              Off Duty ({offDuty.length})
            </h4>
            <div className="scrollbar-thin max-h-[160px] space-y-2 overflow-y-auto pr-1">
              {offDuty.map((m) => (
                <ScheduleRow key={m.id} member={m} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
};
