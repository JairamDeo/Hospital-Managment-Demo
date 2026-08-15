import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { StaffMember } from '@/pages/staff/data/mockStaff';

interface Props {
  open: boolean;
  member: StaffMember | null;
  onClose: () => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-ghost">{label}</p>
    <p className="mt-1 text-sm font-medium text-ink">{value}</p>
  </div>
);

export const StaffViewModal = ({ open, member, onClose }: Props) => {
  if (!member) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Staff Profile"
      subtitle={`#${member.id}`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-sage-mist/50 p-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${member.avatarClass}`}
        >
          {member.initials}
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink">{member.name}</h3>
          <p className="text-sm text-ink-soft">{member.title}</p>
          <p className="mt-1 text-xs text-ink-ghost">{member.role} · {member.status}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Staff ID" value={`#${member.id}`} />
        <Field label="Today's Shift" value={member.shift} />
        <Field label={member.statPrimary.label} value={String(member.statPrimary.value)} />
        <Field label="Today" value={String(member.today)} />
        <Field label="Rating" value={`${member.rating}★`} />
        <Field label="Tags" value={member.tags.join(', ')} />
      </div>
    </Modal>
  );
};
