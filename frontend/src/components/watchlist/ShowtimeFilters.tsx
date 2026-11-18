import React from 'react';
import { Search, Moon, Filter, RotateCcw } from 'lucide-react';
import { ProviderId } from '../../types';

interface ShowtimeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedProvider: 'all' | ProviderId;
  onProviderChange: (provider: 'all' | ProviderId) => void;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  midnightOnly: boolean;
  onMidnightToggle: (value: boolean) => void;
  onReset: () => void;
  formats: string[];
  totalResults: number;
}

export const ShowtimeFilters: React.FC<ShowtimeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedProvider,
  onProviderChange,
  selectedFormat,
  onFormatChange,
  midnightOnly,
  onMidnightToggle,
  onReset,
  formats,
  totalResults,
}) => {
  return (
    <div className="p-4 rounded-xl bg-obsidian-card border border-obsidian-border space-y-4">
      {/* Top row: Search and Midnight toggle */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cinema or location (e.g. Prasads, AMB, Gachibowli, Banjara)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-obsidian-surface border border-obsidian-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-colors"
          />
        </div>

        {/* Midnight Only Toggle Button */}
        <button
          onClick={() => onMidnightToggle(!midnightOnly)}
          className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
            midnightOnly
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
              : 'bg-obsidian-surface border-obsidian-border text-slate-400 hover:text-slate-200'
          }`}
        >
          <Moon className={`w-3.5 h-3.5 ${midnightOnly ? 'text-amber-400 fill-amber-400/20' : ''}`} />
          <span>Midnight Shows Only (12 AM – 5 AM)</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              midnightOnly ? 'bg-amber-500/20 text-amber-300' : 'bg-obsidian-card text-slate-500'
            }`}
          >
            {midnightOnly ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Bottom row: Provider pills, Format dropdown, and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-obsidian-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3" /> Provider:
          </span>
          <button
            onClick={() => onProviderChange('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-brand-purple/50 ${
              selectedProvider === 'all'
                ? 'bg-brand-purple text-white'
                : 'bg-obsidian-surface text-slate-400 hover:text-slate-200 border border-obsidian-border'
            }`}
          >
            All Providers
          </button>
          <button
            onClick={() => onProviderChange('bookmyshow')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-brand-purple/50 ${
              selectedProvider === 'bookmyshow'
                ? 'bg-red-600 text-white'
                : 'bg-obsidian-surface text-slate-400 hover:text-slate-200 border border-obsidian-border'
            }`}
          >
            BookMyShow
          </button>
          <button
            onClick={() => onProviderChange('district')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-brand-purple/50 ${
              selectedProvider === 'district'
                ? 'bg-blue-600 text-white'
                : 'bg-obsidian-surface text-slate-400 hover:text-slate-200 border border-obsidian-border'
            }`}
          >
            District
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Format selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="format-select" className="text-xs text-slate-500 font-medium">
              Format:
            </label>
            <select
              id="format-select"
              value={selectedFormat}
              onChange={(e) => onFormatChange(e.target.value)}
              className="px-2.5 py-1 rounded-md bg-obsidian-surface border border-obsidian-border text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-purple/50"
            >
              <option value="all">All Formats</option>
              {formats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-1.5 rounded-md bg-obsidian-surface border border-obsidian-border text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-brand-purple/50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-mono text-purple-400 font-medium">
            {totalResults} {totalResults === 1 ? 'sample show' : 'sample shows'}
          </span>
        </div>
      </div>
    </div>
  );
};
