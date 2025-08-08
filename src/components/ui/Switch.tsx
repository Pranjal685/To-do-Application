import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onCheckedChange, className, label, ...props }: SwitchProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer select-none', className)}>
      <span className="relative inline-flex h-6 w-11 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-muted-foreground/20 peer-checked:bg-primary/60 transition-colors" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow peer-checked:translate-x-5 transition-transform" />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
}

