/**
 * Movie Ticket Bot — Activity Page
 * Connects to useWorkflows(25) to display genuine GitHub Actions workflow
 * execution telemetry, run durations, trigger events, and commit SHAs.
 */

import React, { useState } from 'react';
import { WorkflowDurationChart } from '../components/common/WorkflowDurationChart';
import { WorkflowRunsTable } from '../components/activity/WorkflowRunsTable';
import { ActivityTimeline } from '../components/activity/ActivityTimeline';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { useWorkflows } from '../hooks';
import { MOCK_ACTIVITY_LOGS } from '../data/mockData';
import {
  Activity as ActivityIcon,
  RefreshCw,
  Layers,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';

export const Activity: React.FC = () => {
  const {
    data: workflowsData,
    loading,
    error,
    dataSource,
    lastFetchedAt,
    refresh,
  } = useWorkflows(25);

  const [activeTab, setActiveTab] = useState<'runs' | 'sample_timeline'>('runs');

  const runs = workflowsData?.runs || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ActivityIcon className="w-6 h-6 text-purple-400" />
            Monitoring Telemetry & Execution Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified execution records, runtimes, and health history for the cloud monitoring runner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Data Source Badge */}
          <DataSourceBadge
            dataSource={dataSource}
            lastFetchedAt={lastFetchedAt}
            showTimestamp={true}
          />

          {/* Refresh Button */}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-obsidian-card hover:bg-obsidian-surface text-slate-300 border border-obsidian-border transition-colors disabled:opacity-50"
            title="Refresh execution records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Failed to retrieve workflow execution records: {error.message}</span>
          </div>
          <button
            onClick={() => refresh()}
            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[11px] border border-rose-500/40 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Cloud Workflow Execution Duration Chart */}
      <WorkflowDurationChart
        runs={runs}
        title="Cloud Workflow Execution Duration (GitHub Actions)"
        subtitle="Actual duration in seconds for District single-shot monitoring workflow."
      />

      {/* View Switcher Tabs (Runs Table vs Illustrative Sample Logs) */}
      <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === 'runs'
                ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>GitHub Actions Executions ({runs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sample_timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === 'sample_timeline'
                ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Illustrative Sample Timeline (Preview)</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
          {activeTab === 'runs' ? 'Verified Upstream Data' : 'Sample Telemetry Only'}
        </span>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'runs' ? (
        <WorkflowRunsTable runs={runs} loading={loading} />
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40">
              UI PREVIEW ONLY
            </span>
            <span>
              The following timeline displays simulated sweep check events for visual comparison. Real monitoring executes in GitHub Actions.
            </span>
          </div>
          <ActivityTimeline logs={MOCK_ACTIVITY_LOGS} />
        </div>
      )}
    </div>
  );
};
