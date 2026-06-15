import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../ui/dialog';

/**
 * Reusable ConfirmDialog component following shadcn/ui best practices.
 * Provides semantic role="alertdialog" with auto Escape key handling and focus trap.
 *
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {function} onConfirm - Callback when user confirms
 * @param {boolean} isDestructive - If true, confirm button uses danger variant
 * @param {string} confirmText - Confirm button text (default: "Confirma")
 * @param {string} cancelText - Cancel button text (default: "Anulare")
 * @param {ReactNode} children - Trigger element (usually a button)
 */
export function ConfirmDialog({
  title,
  description,
  onConfirm,
  isDestructive = false,
  confirmText = 'Confirmă',
  cancelText = 'Anulare',
  children,
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent role="alertdialog" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <button className="btn-secondary">{cancelText}</button>
          </DialogClose>
          <DialogClose asChild>
            <button
              onClick={onConfirm}
              className={isDestructive ? 'btn-danger' : 'btn-primary'}
            >
              {confirmText}
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
