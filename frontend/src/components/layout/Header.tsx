import React from 'react';
import { Menu, RefreshCw, Calendar, MapPin, Clock } from 'lucide-react';
import { TARGET_MOVIE } from '../../data/mockData';

interface HeaderProps {
  onMenuToggle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="h-16 px-4 md:px-8 border-b border-obsidian-border bg-obsidian-surface/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile Toggle & Target Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border text-slate-400 hover:text-white md:hidden focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-obsidian-card border border-obsidian-border text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium">{TARGET_MOVIE.targetCity}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-obsidian-card border border-obsidian-border text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-[11px]">{TARGET_MOVIE.targetDateIso}</span>
          </div>
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Window: 12:00 AM – 04:59 AM
          </span>
        </div>
      </div>

      {/* Right: Engine Link Status & Refresh */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-card border border-purple-500/25 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-slate-400">Engine Link:</span>
          <span className="text-purple-300 font-medium">Integration Pending</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-card hover:bg-obsidian-cardHover border border-obsidian-border hover:border-obsidian-borderHover text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
          title="Refresh UI sample dataset"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>
    </header>
  );
};
