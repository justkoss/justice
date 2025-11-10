'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  value: string | number;
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}

const variantStyles = {
  default: 'bg-bg-tertiary text-text-primary border-border',
  primary: 'bg-gold-primary/10 text-gold-primary border-gold-primary/30',
  success: 'bg-green-500/10 text-green-400 border-green-500/30',
  danger: 'bg-red-500/10 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

export default function FilterChip({
  label,
  value,
  onRemove,
  variant = 'default',
  className,
}: FilterChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'border text-sm font-medium',
        'transition-all duration-200',
        variantStyles[variant],
        className
      )}
    >
      <span className="text-xs opacity-75">{label}:</span>
      <span>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove ${label} filter`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
