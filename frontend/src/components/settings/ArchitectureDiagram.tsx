import React from 'react';
import { Laptop, Cloud, Volume2, ShieldCheck, Cpu } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          Dual Monitoring Architecture Blueprint
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Movie Ticket Bot deploys two isolated, zero-cost monitoring runners powered by a shared parsing engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Environment */}
        <div className="p-5 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Local Workstation Runner</h3>
                <span className="text-[11px] font-mono text-purple-400">monitor.py (90s Loop)</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              High Frequency
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Scrapes BookMyShow & District</strong> via browser emulation & mobile endpoints.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span>Deduplicates locally via gitignored <code className="text-purple-300">seen_shows.json</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span className="flex items-center gap-1">
                Immediate audio alarm: <Volume2 className="w-3.5 h-3.5 text-amber-400 inline" /> Windows Beep alert on discovery.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span>Commits deduplication record only after confirmed Telegram delivery.</span>
            </li>
          </ul>
        </div>

        {/* Cloud Environment */}
        <div className="p-5 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloud GitHub Actions</h3>
                <span className="text-[11px] font-mono text-blue-400">monitor_cloud.py (Hourly Cron)</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/25">
              Zero-Cost 24/7
            </span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>Single-shot District runner</strong> scheduled at minute 37 past each hour.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Persists cloud state across ephemeral VMs via git-tracked <code className="text-blue-300">cloud_seen_shows.json</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Skips headless BookMyShow to conserve GitHub free-tier minutes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Automated GitHub commit & push retry loop on confirmed Telegram dispatch.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Shared Foundation */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-obsidian-surface via-obsidian-card to-obsidian-surface border border-obsidian-border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white">Pure Core Logic: showtime_parser.py</div>
            <div className="text-slate-400">
              Deterministic parsing verified offline by 72 tests. The React frontend is a decoupled preview.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-purple-300 font-semibold text-xs shrink-0 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-800/40">
          <span>72 / 72 Verified Offline Tests</span>
        </div>
      </div>
    </div>
  );
};
