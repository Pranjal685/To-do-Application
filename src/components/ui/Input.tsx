import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:border-muted-foreground/50',
      glass: 'flex h-11 w-full rounded-lg glass-effect px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    };

    return (
      <motion.input
        ref={ref}
        type={type}
        whileFocus={{ scale: 1.01 }}
        className={cn(
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;