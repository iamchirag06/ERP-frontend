import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  danger?: boolean;
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  loading,
  danger,
}: Props) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-sm text-slate-600">{message}</p>
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant={danger ? 'danger' : 'primary'}
        loading={loading}
        onClick={onConfirm}
      >
        Confirm
      </Button>
    </div>
  </Modal>
);