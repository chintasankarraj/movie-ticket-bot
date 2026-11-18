import React from 'react';
import { TARGET_MOVIE, MOCK_METRICS } from '../../data/mockData';
import { Sliders, Film, Calendar, MapPin, Clock, Server, ShieldCheck } from 'lucide-react';

export const ConfigCard: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            Active Sweeper Configuration Summary
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Parameters enforced by the Python monitoring engines (`monitor.py` & `monitor_cloud.py`).
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40">
          Read-Only Engine Specs
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Target Movie */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Film className="w-4 h-4 text-purple-400" /> Target Movie
          </div>
          <div className="text-sm font-bold text-white">{TARGET_MOVIE.title}</div>
          <div className="text-[11px] text-slate-500 font-mono">{TARGET_MOVIE.universe}</div>
        </div>

        {/* Target Date */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-purple-400" /> Premiere Date
          </div>
          <div className="text-sm font-bold text-white">{TARGET_MOVIE.releaseDate}</div>
          <div className="text-[11px] text-slate-500 font-mono">ISO: {TARGET_MOVIE.targetDateIso}</div>
        </div>

        {/* Target City */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-purple-400" /> Target Region
          </div>
          <div className="text-sm font-bold text-white">{TARGET_MOVIE.targetCity} (All Multiplexes)</div>
          <div className="text-[11px] text-slate-500 font-mono">State: Telangana, India</div>
        </div>

        {/* Midnight Window */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-400" /> Midnight Window
          </div>
          <div className="text-sm font-bold text-amber-300 font-mono">
            {TARGET_MOVIE.targetWindow.start} – {TARGET_MOVIE.targetWindow.end}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">24H Range: 00:00 to 04:59</div>
        </div>

        {/* Local Polling */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Server className="w-4 h-4 text-purple-400" /> Local Sweeper Cadence
          </div>
          <div className="text-sm font-bold text-white font-mono">
            Every {MOCK_METRICS.localPollIntervalSec} seconds
          </div>
          <div className="text-[11px] text-slate-500">BookMyShow (DOM) + District (API)</div>
        </div>

        {/* Cloud Polling */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Server className="w-4 h-4 text-purple-400" /> Cloud GitHub Actions
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {MOCK_METRICS.cloudCronSchedule}
          </div>
          <div className="text-[11px] text-slate-500">District (Single-shot runner)</div>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-obsidian-surface/80 border border-obsidian-border flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          Deduplication files managed by Python CLI: <code className="text-purple-300">seen_shows.json</code> (Local) &{' '}
          <code className="text-purple-300">cloud_seen_shows.json</code> (Cloud Git-tracked)
        </span>
        <span className="font-mono text-[11px] text-slate-500">Strict separation active</span>
      </div>
    </div>
  );
};
