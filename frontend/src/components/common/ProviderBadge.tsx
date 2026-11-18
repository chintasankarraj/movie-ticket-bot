import React from 'react';
import { ProviderId } from '../../types';
import { cn } from '../../utils/cn';

interface ProviderBadgeProps {
  provider: ProviderId;
  variant?: 'pill' | 'subtle' | 'compact';
  className?: string;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({
  provider,
  variant = 'pill',
  className = '',
}) => {
  const isBms = provider === 'bookmyshow';

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
          isBms
            ? 'bg-brand-bms-bg text-red-400 border border-brand-bms-border'
            : 'bg-brand-district-bg text-blue-400 border border-brand-district-border',
          className
        )}
      >
        {isBms ? 'BMS' : 'DISTRICT'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border transition-colors',
        isBms
          ? 'bg-brand-bms-bg text-red-300 border-brand-bms-border hover:bg-red-950/40'
          : 'bg-brand-district-bg text-blue-300 border-brand-district-border hover:bg-blue-950/40',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isBms ? 'bg-red-500' : 'bg-blue-500'
        )}
      />
      {isBms ? 'BookMyShow' : 'District'}
    </span>
  );
};
