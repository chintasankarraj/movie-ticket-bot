/**
 * Movie Ticket Bot — Workflow Runs Table
 * Renders genuine GitHub Actions execution records for the cloud monitoring runner.
 */

import React, { useState } from 'react';
import { WorkflowRunSummary } from '../../types/api';
import {
  Search,
  ExternalLink,
  GitCommit,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';

interface WorkflowRunsTableProps {
  runs: WorkflowRunSummary[];
  loading?: boolean;
}

export const WorkflowRunsTable: React.FC<WorkflowRunsTableProps> = ({
  runs,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conclusionFilter, setConclusionFilter] = useState<'all' | 'success' | 'failure' | 'in_progress'>('all');

  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      run.id.toString().includes(searchTerm) ||
      run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.commitSha.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConclusion =
      conclusionFilter === 'all' ||
      (conclusionFilter === 'in_progress'
        ? run.status === 'in_progress' || !run.conclusion
        : run.conclusion === conclusionFilter);

    return matchesSearch && matchesConclusion;
  });

  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            GitHub Actions Runner Executions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified execution logs for the District single-shot ticket monitor workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Run ID, event, SHA..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple/50 w-52 font-mono"
            />
          </div>

          {/* Conclusion Filter */}
          <select
            value={conclusionFilter}
            onChange={(e) => setConclusionFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-slate-300 focus:outline-none font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-obsidian-border/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian-surface text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-obsidian-border">
            <tr>
              <th className="py-3 px-4">Run ID</th>
              <th className="py-3 px-4">Trigger Event</th>
              <th className="py-3 px-4">Status / Conclusion</th>
              <th className="py-3 px-4">Started (UTC)</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Commit</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-border/60 font-mono">
            {loading && runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-purple-400" />
                    Fetching workflow executions from GitHub...
                  </span>
                </td>
              </tr>
            ) : filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No workflow execution records found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredRuns.map((run) => {
                const isSuccess = run.conclusion === 'success';
                const isFailed = run.conclusion === 'failure';

                return (
                  <tr
                    key={run.id}
                    className="hover:bg-obsidian-surface/40 transition-colors"
                  >
                    {/* Run ID */}
                    <td className="py-3 px-4 font-bold text-white">
                      #{run.id}
                    </td>

                    {/* Trigger Event */}
                    <td className="py-3 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-obsidian-surface text-purple-300 border border-brand-purple/20">
                        {run.event}
                      </span>
                    </td>

                    {/* Status / Conclusion */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {isSuccess ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isFailed ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        <span
                          className={`font-semibold capitalize ${
                            isSuccess
                              ? 'text-emerald-400'
                              : isFailed
                              ? 'text-rose-400'
                              : 'text-purple-300'
                          }`}
                        >
                          {run.conclusion || run.status}
                        </span>
                      </div>
                    </td>

                    {/* Started */}
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(run.startedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-slate-200">
                      {run.durationSeconds !== null ? `${run.durationSeconds}s` : 'In Progress'}
                    </td>

                    {/* Commit SHA */}
                    <td className="py-3 px-4">
                      {run.commitSha ? (
                        <span className="flex items-center gap-1 text-slate-400 hover:text-purple-300">
                          <GitCommit className="w-3 h-3 text-slate-500" />
                          <span>{run.commitSha}</span>
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>

                    {/* Link */}
                    <td className="py-3 px-4 text-right">
                      {run.htmlUrl ? (
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 hover:underline"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-2">
        <span>Showing {filteredRuns.length} of {runs.length} workflow execution runs.</span>
        <span>Hourly Cloud Runner Target: ticket_monitor.yml</span>
      </div>
    </div>
  );
};
