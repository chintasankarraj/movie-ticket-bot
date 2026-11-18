/**
 * Movie Ticket Bot — Data Source Badge
 * Visual indicator distinguishing LIVE, STALE, OFFLINE_FALLBACK, and ERROR states.
 */

import React from 'react';
import { ClientDataSourceState } from '../../types/api';
import { AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface DataSourceBadgeProps {
  dataSource: ClientDataSourceState;
  lastFetchedAt?: string | null;
  className?: string;
  showTimestamp?: boolean;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  dataSource,
  lastFetchedAt,
  className = '',
  showTimestamp = false,
}) => {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  switch (dataSource) {
    case 'LIVE':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-600/40 shadow-sm ${className}`}
          title={lastFetchedAt ? `Live GitHub data retrieved at ${lastFetchedAt}` : 'Live telemetry from GitHub Actions'}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span>LIVE GITHUB TELEMETRY</span>
          {showTimestamp && lastFetchedAt && (
            <span className="text-[10px] text-emerald-400/80 border-l border-emerald-700/50 pl-1.5 ml-0.5">
              {formatTime(lastFetchedAt)}
            </span>
          )}
        </div>
      );

    case 'STALE':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/50 text-amber-300 border border-amber-600/40 shadow-sm ${className}`}
          title={
            lastFetchedAt
              ? `Cached telemetry from ${lastFetchedAt}. GitHub API was temporarily unreachable.`
              : 'Serving previously cached GitHub data.'
          }
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>CACHED TELEMETRY — STALE</span>
          {showTimestamp && lastFetchedAt && (
            <span className="text-[10px] text-amber-400/80 border-l border-amber-700/50 pl-1.5 ml-0.5">
              Cached: {formatTime(lastFetchedAt)}
            </span>
          )}
        </div>
      );

    case 'ERROR':
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/50 text-rose-300 border border-rose-600/40 shadow-sm ${className}`}
          title="Telemetry request failed or server error occurred."
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>TELEMETRY UNAVAILABLE</span>
        </div>
      );

    case 'OFFLINE_FALLBACK':
    default:
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-800/40 shadow-sm ${className}`}
          title="Backend proxy is in offline fallback mode. Telemetry is illustrative sample data."
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>UI PREVIEW MODE — OFFLINE</span>
        </div>
      );
  }
};
