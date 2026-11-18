import React from 'react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeVariant?: 'purple' | 'emerald' | 'amber' | 'slate';
  accentBorder?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'purple',
  accentBorder = false,
  className = '',
}) => {
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'slate':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
      case 'purple':
      default:
        return 'bg-brand-purple/10 text-purple-400 border-brand-purple/25';
    }
  };

  return (
    <div
      className={cn(
        'group relative p-5 rounded-xl bg-obsidian-card border border-obsidian-border transition-all duration-200 hover:border-obsidian-borderHover hover:shadow-lg',
        accentBorder && 'border-brand-purple/40 shadow-glow-purple',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-obsidian-surface border border-obsidian-border text-slate-400 group-hover:text-purple-400 group-hover:border-brand-purple/30 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </span>
        {badgeText && (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-semibold border',
              getBadgeClass()
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 font-sans leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
