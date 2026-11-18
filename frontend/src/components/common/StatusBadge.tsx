import React from 'react';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: 'active' | 'success' | 'warning' | 'error' | 'idle' | 'available' | 'filling_fast' | 'almost_full' | 'sold_out' | 'delivered' | 'retrying' | 'purple';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  pulse = false,
}) => {
  const getStyles = () => {
    switch (status) {
      case 'active':
      case 'success':
      case 'delivered':
      case 'available':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          dot: 'bg-emerald-400',
          defaultLabel: status === 'available' ? 'Available' : 'Healthy',
        };
      case 'warning':
      case 'filling_fast':
      case 'retrying':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
          dot: 'bg-amber-400',
          defaultLabel: status === 'filling_fast' ? 'Filling Fast' : 'Retrying',
        };
      case 'error':
      case 'sold_out':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
          dot: 'bg-rose-400',
          defaultLabel: status === 'sold_out' ? 'Sold Out' : 'Failed',
        };
      case 'almost_full':
        return {
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
          dot: 'bg-orange-400',
          defaultLabel: 'Almost Full',
        };
      case 'purple':
        return {
          bg: 'bg-brand-purple/15 text-purple-300 border-brand-purple/30',
          dot: 'bg-purple-400',
          defaultLabel: 'UI Preview',
        };
      case 'idle':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
          dot: 'bg-slate-400',
          defaultLabel: 'Idle / Standby',
        };
    }
  };

  const config = getStyles();
  const text = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.bg
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', config.dot)} />
      </span>
      {text}
    </span>
  );
};
