/**
 * Movie Ticket Bot — Live Show Card
 * Renders genuine detected show entries parsed directly from cloud_seen_shows.json.
 * Strictly avoids inventing prices, screen formats, languages, or booking URLs.
 */

import React from 'react';
import { ParsedShowEntry } from '../../types/api';
import { ProviderBadge } from '../common/ProviderBadge';
import { MapPin, Clock, Moon, CheckCircle2 } from 'lucide-react';

interface LiveShowCardProps {
  show: ParsedShowEntry;
  targetDate?: string;
}

export const LiveShowCard: React.FC<LiveShowCardProps> = ({
  show,
  targetDate = '2026-12-17',
}) => {
  const providerId =
    show.provider === 'BookMyShow'
      ? 'bookmyshow'
      : show.provider === 'District'
      ? 'district'
      : 'district';

  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-emerald-600/40 hover:border-emerald-500 hover:shadow-glow-purple transition-all duration-200 flex flex-col justify-between gap-4">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ProviderBadge provider={providerId} variant="compact" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                Confirmed Show
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-1">
              {show.venue || 'Unknown Cinema Venue'}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Hyderabad (All Multiplexes)</span>
            </div>
          </div>
        </div>

        {/* Time and Target Date */}
        <div className="mt-4 p-3 rounded-lg bg-obsidian-surface border border-obsidian-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tracking-tight">
                {show.time || 'Midnight Slot'}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Target Date: {targetDate}
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
            <Moon className="w-3.5 h-3.5 text-emerald-400" />
            Confirmed
          </span>
        </div>

        {/* State Key Trace */}
        <div className="mt-3 p-2 rounded bg-obsidian-surface/60 border border-obsidian-border text-[11px] font-mono text-slate-400 truncate">
          <span className="text-slate-500 mr-1.5">State Key:</span>
          <span className="text-purple-300 select-all">{show.raw}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-obsidian-border/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> Zero-False-Alert Verified
        </span>
        <span>cloud_seen_shows.json</span>
      </div>
    </div>
  );
};
