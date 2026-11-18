/**
 * Movie Ticket Bot — Cloud Workflow Execution Duration Chart
 * Plots genuine GitHub Actions runner execution times (in seconds)
 * rather than synthetic HTTP latency.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { WorkflowRunSummary } from '../../types/api';
import { Activity, GitCommit, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface WorkflowDurationChartProps {
  runs: WorkflowRunSummary[];
  title?: string;
  subtitle?: string;
  className?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: WorkflowRunSummary & { displayLabel: string };
  }>;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const run = payload[0].payload;
    const isSuccess = run.conclusion === 'success';

    return (
      <div className="p-3.5 rounded-lg bg-obsidian-surface border border-obsidian-border shadow-2xl text-xs font-mono space-y-2 max-w-xs">
        <div className="flex items-center justify-between gap-3 border-b border-obsidian-border/80 pb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            {isSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            Run #{run.id}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
              isSuccess
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                : 'bg-rose-950/60 text-rose-300 border border-rose-700/40'
            }`}
          >
            {run.conclusion || run.status}
          </span>
        </div>

        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Duration:</span>
            <span className="font-bold text-purple-300">
              {run.durationSeconds !== null ? `${run.durationSeconds}s` : 'In Progress'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Event:</span>
            <span className="text-slate-200">{run.event}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Started:</span>
            <span className="text-slate-400">{new Date(run.startedAt).toLocaleTimeString()}</span>
          </div>
          {run.commitSha && (
            <div className="flex justify-between items-center pt-1 border-t border-obsidian-border/60 text-[11px]">
              <span className="text-slate-500 flex items-center gap-1">
                <GitCommit className="w-3 h-3" /> Commit:
              </span>
              <span className="text-purple-400 font-mono">{run.commitSha}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const WorkflowDurationChart: React.FC<WorkflowDurationChartProps> = ({
  runs,
  title = 'Cloud Workflow Execution Duration',
  subtitle = 'Actual execution runtimes (seconds) for District single-shot cloud monitoring runner.',
  className = '',
}) => {
  // If runs are empty, show honest empty state
  if (!runs || runs.length === 0) {
    return (
      <div className={`p-6 rounded-xl bg-obsidian-card border border-obsidian-border text-center ${className}`}>
        <div className="flex items-center gap-2 mb-2 justify-center text-slate-400 text-sm font-semibold">
          <Activity className="w-4 h-4 text-purple-400" />
          <span>{title}</span>
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No workflow runs recorded yet on GitHub Actions for this repository. Execution duration metrics will appear as scheduled runner jobs complete.
        </p>
      </div>
    );
  }

  // Format runs in chronological order (left to right)
  const chartData = [...runs]
    .reverse()
    .map((run) => {
      const date = new Date(run.startedAt);
      const displayLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        ...run,
        displayLabel,
        chartDuration: run.durationSeconds ?? 0,
      };
    });

  // Calculate average duration
  const validDurations = runs
    .map((r) => r.durationSeconds)
    .filter((d): d is number => typeof d === 'number');
  const avgDuration =
    validDurations.length > 0
      ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
      : null;

  return (
    <div className={`p-5 rounded-xl bg-obsidian-card border border-obsidian-border ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {avgDuration !== null && (
          <span className="text-xs font-mono text-purple-300 bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Mean Runtime: <strong>{avgDuration}s</strong>
          </span>
        )}
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" vertical={false} />
            <XAxis dataKey="displayLabel" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="s" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="chartDuration" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => {
                const isSuccess = entry.conclusion === 'success';
                const isFailed = entry.conclusion === 'failure';
                const fillColor = isSuccess ? '#10B981' : isFailed ? '#F43F5E' : '#8B5CF6';
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-obsidian-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Success
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Failed / Cancelled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> In Progress
          </span>
        </div>
        <span>{runs.length} Runs Logged</span>
      </div>
    </div>
  );
};
