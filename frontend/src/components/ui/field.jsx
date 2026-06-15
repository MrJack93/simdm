import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Field = forwardRef(({ className, orientation = 'vertical', ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field"
    className={cn(
      'flex gap-2',
      orientation === 'vertical' && 'flex-col',
      orientation === 'horizontal' && 'flex-row items-center',
      className,
    )}
    {...props}
  />
));
Field.displayName = 'Field';

const FieldLabel = forwardRef(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="field-label"
    className={cn(
      'text-sm font-semibold leading-none',
      'text-[var(--color-text-secondary)]',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    {...props}
  >
    {props.children}
    {required && <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>}
  </label>
));
FieldLabel.displayName = 'FieldLabel';

const FieldDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="field-description"
    className={cn(
      'text-xs',
      'text-[var(--color-text-secondary)]',
      className,
    )}
    {...props}
  />
));
FieldDescription.displayName = 'FieldDescription';

const FieldError = forwardRef(({ className, children, ...props }, ref) => {
  if (!children) return null;
  return (
    <p
      ref={ref}
      data-slot="field-error"
      role="alert"
      className={cn(
        'text-xs font-medium',
        'text-[var(--color-error)]',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
});
FieldError.displayName = 'FieldError';

const FieldGroup = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-group"
    className={cn('flex flex-col gap-4', className)}
    {...props}
  />
));
FieldGroup.displayName = 'FieldGroup';

const FieldSeparator = forwardRef(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    data-slot="field-separator"
    className={cn('my-2 border-[var(--color-border)]', className)}
    {...props}
  />
));
FieldSeparator.displayName = 'FieldSeparator';

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSeparator,
};
