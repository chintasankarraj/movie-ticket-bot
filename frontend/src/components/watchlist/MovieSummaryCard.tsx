import React from 'react';
import { Calendar, MapPin, Clock, Tag } from 'lucide-react';
import { TARGET_MOVIE } from '../../data/mockData';

export const MovieSummaryCard: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-brand-purple/20 text-purple-300 border border-brand-purple/30">
            {TARGET_MOVIE.universe}
          </span>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40">
            Target Specification
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {TARGET_MOVIE.title}
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Directed by {TARGET_MOVIE.director}. Target movie configured for midnight screening alerts.
          This view presents illustrative cinema cards to preview filtering across providers, formats, and showtimes.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Date: {TARGET_MOVIE.releaseDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span>City: {TARGET_MOVIE.targetCity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">Midnight Filter: 12 AM – 04:59 AM</span>
          </div>
        </div>
      </div>

      <div className="lg:border-l lg:border-obsidian-border lg:pl-6 flex flex-col justify-center space-y-2 text-xs">
        <span className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
          Monitored Formats
        </span>
        <div className="flex flex-wrap gap-1.5 max-w-xs">
          {TARGET_MOVIE.supportedFormats.map((fmt) => (
            <span
              key={fmt}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-obsidian-surface text-slate-300 border border-obsidian-border"
            >
              <Tag className="w-2.5 h-2.5 text-purple-400" />
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
