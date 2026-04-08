import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: 'bg-dark text-cream ring-warm-border',
        primary: 'bg-amber/10 text-amber ring-amber/20',
        success: 'bg-ok/10 text-ok ring-ok/20',
        warning: 'bg-warning/10 text-warning ring-warning/20',
        error: 'bg-danger/10 text-danger ring-danger/20',
        info: 'bg-info/10 text-info ring-info/20',
        teal: 'bg-teal/10 text-teal ring-teal/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={badgeVariants({ variant, size, className })}
        {...props}
      >
        {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-1.5">{rightIcon}</span>}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };