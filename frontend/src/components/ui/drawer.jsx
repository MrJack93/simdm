import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';

/**
 * Drawer component - full-width slide-out modal for mobile
 * Uses Dialog primitive under the hood with responsive styling
 */
export function Drawer({ open, onOpenChange, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function DrawerTrigger(props) {
  return <button {...props} />;
}

export function DrawerContent({ children, className = '' }) {
  return (
    <DialogContent
      className={`sm:max-w-[425px] w-full sm:rounded-lg rounded-t-2xl ${className}`}
      showCloseButton={false}
    >
      {children}
    </DialogContent>
  );
}

export function DrawerHeader(props) {
  return <DialogHeader {...props} />;
}

export function DrawerTitle(props) {
  return <DialogTitle {...props} />;
}

export function DrawerDescription(props) {
  return <DialogDescription {...props} />;
}

export function DrawerFooter({ children, className = '' }) {
  return (
    <div className={`flex gap-3 justify-end mt-6 ${className}`}>
      {children}
    </div>
  );
}

export function DrawerClose({ children, className = '' }) {
  return <button className={`btn-secondary ${className}`}>{children}</button>;
}
