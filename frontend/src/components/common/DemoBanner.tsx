/**
 * Movie Ticket Bot — Global Data Source Status Banner
 * Visually communicates LIVE, STALE, OFFLINE_FALLBACK, and ERROR states
 * across all dashboard views.
 */

import React from 'react';
import { ClientDataSourceState } from '../../types/api';
import { useOverview } from '../../hooks';
import {
  AlertCircle,
  AlertTriangle,
  Radio,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface DemoBannerProps {
  dataSource?: ClientDataSourceState;
  lastFetchedAt?: string | null;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  dataSource: propDataSource,
  lastFetchedAt: propLastFetchedAt,
  error: propError,
  onRetry: propOnRetry,
  className = '',
}) => {
  // Use hook if props are not explicitly provided
  const overviewState = useOverview();

  const dataSource = propDataSource ?? overviewState.dataSource;
  const lastFetchedAt = propLastFetchedAt ?? overviewState.lastFetchedAt;
  const error = propError ?? overviewState.error;
  const onRetry = propOnRetry ?? overviewState.refresh;
  const isRefreshing = overviewState.loading;

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  // 1. LIVE GITHUB TELEMETRY
  if (dataSource === 'LIVE') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-obsidian-surface border border-emerald-600/40 text-xs text-slate-300 shadow-md ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative mt-1 sm:mt-0 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-300 uppercase tracking-wider text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Live GitHub Telemetry
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-obsidian-card px-2 py-0.5 rounded border border-obsidian-border">
                chintasankarraj/movie-ticket-bot
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed pt-0.5">
              Connected directly to genuine cloud monitoring telemetry. Workflow execution records and deduplication state reflect real-time GitHub Actions status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-obsidian-border w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-obsidian-card border border-obsidian-border text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Updated:</span>
            <span className="text-emerald-400 font-semibold">{formatTimestamp(lastFetchedAt)}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRefreshing}
              className="p-1.5 rounded-md bg-obsidian-card border border-obsidian-border text-slate-400 hover:text-white hover:border-emerald-600/50 transition-colors disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. CACHED TELEMETRY — STALE
  if (dataSource === 'STALE') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-obsidian-surface border border-amber-600/50 text-xs text-slate-300 shadow-md ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold text-amber-300 uppercase tracking-wider text-[10px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Cached Telemetry — Stale
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Upstream Transient Failure
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed pt-0.5">
              GitHub API could not provide fresh data. Serving last-known good cached telemetry from{' '}
              <strong className="text-amber-300 font-mono">{formatTimestamp(lastFetchedAt)}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-obsidian-border w-full sm:w-auto">
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Retry Fetch</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. TELEMETRY UNAVAILABLE / ERROR
  if (dataSource === 'ERROR') {
    return (
      <div
        role="alert"
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-obsidian-surface border border-rose-600/50 text-xs text-slate-300 shadow-md ${className}`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-bold text-rose-300 uppercase tracking-wider text-[10px] bg-rose-950/60 px-2 py-0.5 rounded border border-rose-700/50">
                <AlertCircle className="w-3 h-3 text-rose-400" /> Telemetry Unavailable
              </span>
            </div>

            <p className="text-rose-200/90 text-xs leading-relaxed pt-0.5">
              {error?.message || 'Failed to retrieve telemetry from backend API. Please check serverless connectivity.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-obsidian-border w-full sm:w-auto">
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-mono hover:bg-rose-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. UI PREVIEW MODE — OFFLINE (Default fallback)
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-obsidian-surface border border-brand-purple/40 text-xs text-slate-300 shadow-md ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <span className="flex h-2.5 w-2.5 relative mt-1 sm:mt-0 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-purple" />
        </span>

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-purple-300 uppercase tracking-wider text-[10px] bg-brand-purple/20 px-2 py-0.5 rounded border border-brand-purple/40">
              <Sparkles className="w-3 h-3 text-purple-400" /> UI Preview Mode — Offline
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              <AlertCircle className="w-3 h-3 text-amber-400" /> No GITHUB_PAT Configured
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed pt-0.5">
            This dashboard displays <strong className="text-slate-200">illustrative sample data</strong> for visual and interaction testing. The serverless backend proxy is currently in offline fallback mode.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-obsidian-border w-full sm:w-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-obsidian-card border border-obsidian-border text-[11px] font-mono text-slate-400">
          <Radio className="w-3.5 h-3.5 text-slate-500" />
          <span>Status:</span>
          <span className="text-purple-400 font-semibold">Offline Fallback</span>
        </div>
      </div>
    </div>
  );
};
