import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { MOCK_ACTIVITY_LOGS } from '../../data/mockData';
import { ProviderBadge } from '../common/ProviderBadge';
import { StatusBadge } from '../common/StatusBadge';

export const RecentActivityList: React.FC = () => {
  const recentLogs = MOCK_ACTIVITY_LOGS.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Sample Monitoring Activity Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Illustrative activity entries demonstrating sweep results and status codes.
          </p>
        </div>
        <Link
          to="/activity"
          className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
        >
          View all logs <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-obsidian-border/60">
        {recentLogs.map((log) => (
          <div
            key={log.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-obsidian-surface/40 px-2 rounded-lg transition-colors"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="mt-0.5 sm:mt-0">{getStatusIcon(log.status)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <ProviderBadge provider={log.provider} variant="compact" />
                  <span className="text-xs font-semibold text-slate-200">
                    {log.providerName}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {log.displayTime}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{log.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono">
              <span className="text-slate-500">{log.responseTimeMs}ms</span>
              <StatusBadge
                status={log.status === 'success' ? 'success' : 'warning'}
                label={log.httpStatus === 200 ? '200 OK' : `HTTP ${log.httpStatus}`}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
