import React from 'react';
import { Radar, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Zero Midnight Shows in Demo Dataset',
  description = 'The illustrative sample dataset records 0 confirmed midnight shows (12:00 AM – 4:59 AM) for Avengers: Doomsday in Hyderabad. Real-world monitoring runs independently in Python background engines.',
  icon: Icon = Radar,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl bg-obsidian-card/60 border border-obsidian-border border-dashed overflow-hidden',
        className
      )}
    >
      {/* Subtle ambient radar effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-64 h-64 rounded-full border border-purple-500/20" />
        <div className="w-48 h-48 rounded-full border border-purple-500/30" />
        <div className="w-32 h-32 rounded-full border border-purple-500/40" />
      </div>

      <div className="relative z-10 w-14 h-14 mb-4 rounded-2xl bg-obsidian-surface border border-brand-purple/30 flex items-center justify-center text-purple-400 shadow-glow-purple">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="relative z-10 text-lg font-semibold text-white tracking-tight">
        {title}
      </h3>

      <p className="relative z-10 max-w-md mt-2 text-sm text-slate-400 leading-relaxed">
        {description}
      </p>

      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/40 border border-purple-700/40 text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          Illustrative Zero-State • Radar Concept
        </span>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-brand-purple text-white hover:bg-brand-purple-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
