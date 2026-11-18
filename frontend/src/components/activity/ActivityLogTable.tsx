import React, { useState } from 'react';
import { MonitoringCheck, ProviderId } from '../../types';
import { ProviderBadge } from '../common/ProviderBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Database } from 'lucide-react';

interface ActivityLogTableProps {
  logs: MonitoringCheck[];
}

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | ProviderId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.displayTime.includes(searchTerm);

    const matchesProvider = providerFilter === 'all' || log.provider === providerFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            Sample Sweeper Audit Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Searchable log of representative automated requests and status responses.
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
              placeholder="Search audit log..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple/50 w-48"
            />
          </div>

          {/* Provider dropdown */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value as 'all' | ProviderId)}
            className="px-2.5 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Feeds</option>
            <option value="bookmyshow">BookMyShow</option>
            <option value="district">District</option>
          </select>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'warning')}
            className="px-2.5 py-1.5 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success (200)</option>
            <option value="warning">Warnings / Retries</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-obsidian-border/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian-surface text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-obsidian-border">
            <tr>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">HTTP Status</th>
              <th className="py-3 px-4">Shows Found</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4">Log Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-border/60">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No matching log entries found for current filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-obsidian-surface/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {log.displayTime}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <ProviderBadge provider={log.provider} variant="compact" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge
                      status={log.status === 'success' ? 'success' : 'warning'}
                      label={`HTTP ${log.httpStatus}`}
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {log.showsFoundCount} shows
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {log.responseTimeMs} ms
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-md truncate">
                    {log.message}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
        <span>Showing {filteredLogs.length} of {logs.length} audit records</span>
        <span>Demo Logging Engine</span>
      </div>
    </div>
  );
};
