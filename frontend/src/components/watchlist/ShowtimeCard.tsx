import React from 'react';
import { CinemaShowtime } from '../../types';
import { ProviderBadge } from '../common/ProviderBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MapPin, Clock, Moon, Sparkles, Lock, ExternalLink } from 'lucide-react';

interface ShowtimeCardProps {
  showtime: CinemaShowtime;
}

export const ShowtimeCard: React.FC<ShowtimeCardProps> = ({ showtime }) => {
  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-borderHover transition-all duration-200 flex flex-col justify-between gap-4">
      {/* Top Header: Cinema, Location, Badges */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ProviderBadge provider={showtime.provider} variant="compact" />
              {showtime.isIllustrative && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  Illustrative Sample
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-1">
              {showtime.cinemaName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{showtime.location}</span>
            </div>
          </div>

          <StatusBadge status={showtime.status} size="sm" />
        </div>

        {/* Screen & Format */}
        <div className="mt-3 p-2.5 rounded-lg bg-obsidian-surface/60 border border-obsidian-border text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-slate-300 truncate">
            {showtime.screenName}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-obsidian-card text-purple-300 border border-brand-purple/20">
              {showtime.format}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-obsidian-card border border-obsidian-border">
              {showtime.language}
            </span>
          </div>
        </div>

        {/* Showtime display */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-obsidian-surface border border-obsidian-border text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tracking-tight">
                {showtime.showTime}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {showtime.showDate}
              </div>
            </div>
          </div>

          {showtime.isMidnight && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              Midnight Slot
            </span>
          )}
        </div>
      </div>

      {/* Booking CTA Button (Clearly marked disabled placeholder) */}
      <div className="pt-3 border-t border-obsidian-border/80">
        <button
          disabled
          aria-disabled="true"
          className="w-full py-2 px-3 rounded-lg bg-obsidian-surface/60 border border-obsidian-border text-xs font-medium text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed select-none"
          title="Illustrative card for filter evaluation. Not connected to live booking portals."
        >
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Booking Disabled (Demo Card)</span>
          <ExternalLink className="w-3 h-3 text-slate-600 ml-1" />
        </button>
      </div>
    </div>
  );
};
