import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
  confirmText = 'Confirma',
  cancelText = 'Anulare',
  children,
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <div className="flex justify-end gap-3">
          <AlertDialogCancel className="btn-secondary">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isDestructive ? 'btn-danger' : 'btn-primary'}
          >
            {confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
