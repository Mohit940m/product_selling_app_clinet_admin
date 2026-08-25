import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}

/**
 * Replaces every `window.confirm` in the app. Focuses the cancel action by
 * default, not the destructive one (useDialogBehavior focuses the first
 * focusable element — Cancel is rendered first for that reason).
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal open={open} onClose={onClose} title={title} panelClassName="max-w-sm">
      {description && <p className="mb-6 text-sm text-muted">{description}</p>}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
