import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-obsidian-surface border border-brand-purple/40 flex items-center justify-center text-purple-400 mb-6 shadow-glow-purple">
        <Film className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-full">
        404 • Scene Not Found
      </span>

      <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4 tracking-tight">
        Lost in the Multiverse
      </h1>

      <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
        The route you requested does not exist on the Doomsday Ticket Radar. Return to the command center to view active midnight screenings.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-glow-purple"
        >
          <Home className="w-4 h-4" />
          <span>Return to Command Center</span>
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-obsidian-card hover:bg-obsidian-cardHover border border-obsidian-border text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};
