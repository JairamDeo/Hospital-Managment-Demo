import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmActionModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'primary',
  onConfirm,
  onClose,
}: Props) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          className={variant === 'danger' ? 'bg-danger hover:bg-danger/90' : undefined}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </Button>
      </>
    }
  >
    <p className="text-sm text-ink-soft">{message}</p>
  </Modal>
);
