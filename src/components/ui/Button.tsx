import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
    premium: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg',
    glass: 'glass-effect text-foreground hover:bg-white/10 dark:hover:bg-white/5 shadow-sm',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    outline: 'border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground',
    secondary: 'bg-muted text-foreground hover:bg-muted/80 shadow-sm',
    ghost: 'hover:bg-muted hover:text-foreground',
    link: 'underline-offset-4 hover:underline text-primary hover:text-primary/80',
  };

  const sizes = {
    default: 'h-11 py-2.5 px-6',
    sm: 'h-9 px-4 rounded-lg text-xs',
    lg: 'h-13 px-10 rounded-xl text-base',
    icon: 'h-11 w-11 rounded-xl',
  };

  const buttonContent = (
    <span className="relative z-10 flex items-center gap-2">
      {children}
    </span>
  );

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
}