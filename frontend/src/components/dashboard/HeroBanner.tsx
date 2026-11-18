import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Calendar, MapPin, Clock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { TARGET_MOVIE } from '../../data/mockData';
import { MovieTargetConfig } from '../../types/api';

interface HeroBannerProps {
  movieTarget?: MovieTargetConfig | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movieTarget }) => {
  const targetTitle = movieTarget?.title || TARGET_MOVIE.title;
  const targetUniverse = movieTarget?.universe || TARGET_MOVIE.universe;
  const targetCity = movieTarget?.city || TARGET_MOVIE.targetCity;
  const targetDate = movieTarget?.targetDate || TARGET_MOVIE.releaseDate;
  const targetStart = movieTarget?.targetWindow?.start || TARGET_MOVIE.targetWindow.start;
  const targetEnd = movieTarget?.targetWindow?.end || TARGET_MOVIE.targetWindow.end;
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-obsidian-surface via-obsidian-card to-purple-950/20 border border-brand-purple/30 p-6 md:p-8 overflow-hidden shadow-glow-purple">
      {/* Decorative ambient background accents */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 bottom-0 opacity-10 hidden xl:block pointer-events-none">
        <Film className="w-64 h-64 text-brand-purple" />
      </div>

      <div className="relative z-10 max-w-3xl">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-purple/20 text-purple-300 border border-brand-purple/40">
            <Sparkles className="w-3.5 h-3.5" />
            {targetUniverse}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Target Spec: Configured
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-obsidian-surface text-slate-400 border border-obsidian-border">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Engine Spec: Deduplicated Alerting
          </span>
        </div>

        {/* Title & Director */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          {targetTitle}
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-400 font-sans leading-relaxed">
          {TARGET_MOVIE.synopsis}
        </p>

        {/* Key Parameters Row */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-surface/70 border border-obsidian-border">
            <div className="p-2 rounded-lg bg-brand-purple/10 text-purple-400 border border-brand-purple/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Target Date
              </div>
              <div className="text-sm font-semibold text-slate-200 font-mono">
                {targetDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-surface/70 border border-obsidian-border">
            <div className="p-2 rounded-lg bg-brand-purple/10 text-purple-400 border border-brand-purple/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Target City
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {targetCity} (All Multiplexes)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-obsidian-surface/70 border border-obsidian-border">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Midnight Window
              </div>
              <div className="text-sm font-semibold text-amber-300 font-mono">
                {targetStart} – {targetEnd}
              </div>
            </div>
          </div>
        </div>

        {/* Formats and Action */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-obsidian-border/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Formats Monitored:</span>
            {TARGET_MOVIE.supportedFormats.map((format) => (
              <span
                key={format}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-obsidian-surface text-slate-300 border border-obsidian-border"
              >
                {format}
              </span>
            ))}
          </div>

          <Link
            to="/watchlist"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-glow-purple"
          >
            <span>View Showtime Radar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
