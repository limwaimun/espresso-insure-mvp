import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

const alertVariants = cva(
  'rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-dark border-warm-border',
        success: 'bg-ok/10 border-ok text-ok',
        warning: 'bg-warning/10 border-warning text-warning',
        error: 'bg-danger/10 border-danger text-danger',
        info: 'bg-info/10 border-info text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, description, dismissible, onDismiss, icon, children, ...props }, ref) => {
    const defaultIcons = {
      success: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      error: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      info: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };

    const alertIcon = icon || (variant && variant !== 'default' ? defaultIcons[variant] : null);

    return (
      <div
        ref={ref}
        role="alert"
        className={alertVariants({ variant, className })}
        {...props}
      >
        <div className="flex">
          {alertIcon && (
            <div className="flex-shrink-0 mr-3">
              {alertIcon}
            </div>
          )}
          
          <div className="flex-1">
            {title && (
              <h3 className="font-semibold">
                {title}
              </h3>
            )}
            
            {description && (
              <div className="mt-1">
                <p>{description}</p>
              </div>
            )}
            
            {children && !description && (
              <div className="mt-1">
                {children}
              </div>
            )}
          </div>
          
          {dismissible && (
            <button
              type="button"
              className="ml-4 flex-shrink-0 text-current hover:opacity-70 transition-opacity"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert, alertVariants };