import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'w-full rounded-lg border bg-dark text-cream placeholder-cream-dim focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-warm-border focus:ring-amber',
        success: 'border-ok focus:ring-ok',
        warning: 'border-warning focus:ring-warning',
        error: 'border-danger focus:ring-danger',
        info: 'border-info focus:ring-info',
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, disabled, label, helperText, error, leftIcon, rightIcon, ...props }, ref) => {
    const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-cream mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cream-dim">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={id}
            className={inputVariants({
              variant: error ? 'error' : variant,
              size,
              disabled,
              className: `${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`,
            })}
            disabled={disabled}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cream-dim">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(helperText || error) && (
          <p className={`mt-2 text-sm ${error ? 'text-danger' : 'text-cream-dim'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };