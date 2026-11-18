import React from 'react';
import { MonitoringCheck } from '../../types';
import { ProviderBadge } from '../common/ProviderBadge';
import { StatusBadge } from '../common/StatusBadge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ActivityTimelineProps {
  logs: MonitoringCheck[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Sample Execution Timeline
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-obsidian-border">
        {logs.slice(0, 6).map((log) => (
          <div key={log.id} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-obsidian-surface border border-obsidian-border flex items-center justify-center">
              {getStatusIcon(log.status)}
            </div>

            <div className="p-3 rounded-lg bg-obsidian-surface/60 border border-obsidian-border hover:border-obsidian-borderHover transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ProviderBadge provider={log.provider} variant="compact" />
                  <span className="text-xs font-semibold text-slate-200">
                    {log.providerName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>{log.displayTime}</span>
                  <StatusBadge
                    status={log.status === 'success' ? 'success' : 'warning'}
                    label={log.httpStatus === 200 ? '200 OK' : `HTTP ${log.httpStatus}`}
                    size="sm"
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-300 font-sans">{log.message}</p>

              <div className="mt-2.5 flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-2 border-t border-obsidian-border/50">
                <span>Latency: {log.responseTimeMs}ms</span>
                <span>Shows detected: {log.showsFoundCount}</span>
                <span>Target: Dec 17, 2026</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
