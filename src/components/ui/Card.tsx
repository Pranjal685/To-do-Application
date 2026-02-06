import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'premium' | 'elevated';
  hover?: boolean;
}

export function Card({ className, variant = 'default', hover = true, ...props }: CardProps) {
  const variants = {
    default: 'rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm',
    glass: 'glass-card !bg-white/15 dark:!bg-black/60',
    premium: 'glass-card !bg-white/15 dark:!bg-black/60 border-champagne-gold/30 glow-gold-hover',
    elevated: 'rounded-xl border border-border/50 bg-card text-card-foreground shadow-premium hover:shadow-2xl',
  };

  const cardClasses = cn(
    variants[variant],
    hover && variant !== 'glass' && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
    className
  );

  if (variant === 'glass' || variant === 'premium') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cardClasses}
        {...props}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : undefined}
      className={cardClasses}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-5 md:p-6', className)} {...props} />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('p-5 md:p-6 pt-0', className)} {...props} />;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div className={cn('flex items-center p-5 md:p-6 pt-0', className)} {...props} />
  );
}

export default Card;