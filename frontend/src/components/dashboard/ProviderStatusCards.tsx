/**
 * Movie Ticket Bot — Provider Status Cards
 * Displays genuine status of Cloud Runner (District) and explicitly
 * unlinked status of Local Runner (BMS + District).
 */

import React from 'react';
import { OverviewApiResponse, ClientDataSourceState } from '../../types/api';
import { ProviderBadge } from '../common/ProviderBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, Globe, GitCommit, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';

interface ProviderStatusCardsProps {
  overview?: OverviewApiResponse | null;
  dataSource?: ClientDataSourceState;
}

export const ProviderStatusCards: React.FC<ProviderStatusCardsProps> = ({
  overview,
  dataSource = 'OFFLINE_FALLBACK',
}) => {
  const cloud = overview?.cloudMonitor;
  const local = overview?.localMonitor;

  const isLive = dataSource === 'LIVE';
  const isStale = dataSource === 'STALE';

  // Cloud status badge
  let cloudStatusLabel = 'Offline Fallback';
  let cloudStatusType: 'success' | 'warning' | 'idle' | 'active' = 'idle';

  if (isLive) {
    if (cloud?.lastRun?.status === 'in_progress') {
      cloudStatusLabel = 'Runner Executing';
      cloudStatusType = 'active';
    } else if (cloud?.lastRun?.conclusion === 'success') {
      cloudStatusLabel = 'Runner Healthy (Success)';
      cloudStatusType = 'success';
    } else if (cloud?.lastRun?.conclusion === 'failure') {
      cloudStatusLabel = 'Last Run Failed';
      cloudStatusType = 'warning';
    } else {
      cloudStatusLabel = 'Runner Active';
      cloudStatusType = 'success';
    }
  } else if (isStale) {
    cloudStatusLabel = 'Cached (Stale)';
    cloudStatusType = 'warning';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. CLOUD RUNNER (District) */}
      <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-brand-district-border hover:shadow-glow-district transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <ProviderBadge provider="district" />
            <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
              Cloud Runner (GitHub Actions)
            </span>
          </div>
          <StatusBadge
            status={cloudStatusType}
            label={cloudStatusLabel}
            size="sm"
            pulse={isLive && cloud?.lastRun?.status === 'in_progress'}
          />
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          Automated single-shot District scraper executing in GitHub Actions. Sweeps Hyderabad midnight shows and deduplicates against persistent repository state.
        </p>

        {/* Cloud Telemetry Specifications */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-obsidian-border pt-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Schedule:</span>
            <span className="font-mono text-slate-200">
              {cloud?.scheduleCron ? `Cron (${cloud.scheduleCron})` : 'Hourly (:37)'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>Scope:</span>
            <span className="text-slate-200">District • Hyderabad</span>
          </div>
        </div>

        {/* Last Run Diagnostics */}
        <div className="mt-3 p-2.5 rounded-lg bg-obsidian-surface/60 border border-obsidian-border text-xs space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>Latest Run:</span>
            <span className="text-slate-200">
              {cloud?.lastRun
                ? `#${cloud.lastRun.id} (${cloud.lastRun.durationSeconds ?? '--'}s)`
                : 'No recent runs'}
            </span>
          </div>
          {cloud?.lastRun?.commitSha && (
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <GitCommit className="w-3 h-3" /> Commit:
              </span>
              <span className="text-purple-400">{cloud.lastRun.commitSha}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400">
            <span>State File SHA:</span>
            <span className="text-slate-300">
              {cloud?.stateFileSha ? cloud.stateFileSha.substring(0, 7) : 'Pending first alert'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-obsidian-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-purple-400" /> Confirmed Shows: {cloud?.detectedShowsCount ?? 0}
          </span>
          <span>Single-Shot Mode</span>
        </div>
      </div>

      {/* 2. LOCAL RUNNER (BookMyShow + District) */}
      <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-borderHover transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <ProviderBadge provider="bookmyshow" />
            <span className="text-xs font-mono text-slate-400 bg-obsidian-surface px-2 py-0.5 rounded border border-obsidian-border">
              Local Runner (Workstation CLI)
            </span>
          </div>
          <StatusBadge
            status="idle"
            label="Unlinked / Offline"
            size="sm"
            pulse={false}
          />
        </div>

        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          {local?.notice ||
            'Local workstation monitor runs independently as a CLI process (monitor.py). Telemetry is not linked to cloud API.'}
        </p>

        {/* Local Specifications */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-obsidian-border pt-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Interval:</span>
            <span className="font-mono text-slate-200">
              {local?.intervalSeconds ? `${local.intervalSeconds}s loop` : '90s loop'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>Providers:</span>
            <span className="text-slate-200">BookMyShow + District</span>
          </div>
        </div>

        {/* Local Runner Status Note */}
        <div className="mt-3 p-2.5 rounded-lg bg-obsidian-surface/60 border border-obsidian-border text-xs text-slate-400 flex items-start gap-2">
          <Terminal className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Local telemetry is confined to <code className="text-purple-300">seen_shows.json</code> on your workstation and does not publish to GitHub.
          </p>
        </div>

        <div className="mt-4 pt-2.5 border-t border-obsidian-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <AlertCircle className="w-3 h-3 text-slate-500" /> Workstation Only
          </span>
          <span>Decoupled Architecture</span>
        </div>
      </div>
    </div>
  );
};
