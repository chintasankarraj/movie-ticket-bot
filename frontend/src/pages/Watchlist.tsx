/**
 * Movie Ticket Bot — Watchlist Page
 * Connects to useShows() to render genuine detected shows from cloud_seen_shows.json.
 * Strictly presents honest empty states when zero shows are detected,
 * never populating fabricated cards in live mode.
 */

import React, { useState, useMemo } from 'react';
import { MovieSummaryCard } from '../components/watchlist/MovieSummaryCard';
import { ShowtimeFilters } from '../components/watchlist/ShowtimeFilters';
import { ShowtimeCard } from '../components/watchlist/ShowtimeCard';
import { LiveShowCard } from '../components/watchlist/LiveShowCard';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useShows } from '../hooks';
import { ILLUSTRATIVE_SHOWTIMES } from '../data/mockData';
import { ProviderId } from '../types';
import {
  Film,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

export const Watchlist: React.FC = () => {
  const {
    data: showsData,
    loading,
    error,
    dataSource,
    lastFetchedAt,
    refresh,
  } = useShows();

  const [activeView, setActiveView] = useState<'verified' | 'preview'>('verified');

  // Filter state for preview cards
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'all' | ProviderId>('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [midnightOnly, setMidnightOnly] = useState(true);

  const realShows = showsData?.shows || [];
  const stateSha = showsData?.stateFileSha ? showsData.stateFileSha.substring(0, 7) : null;

  // Filtered sample showtimes for preview mode
  const filteredPreviewShows = useMemo(() => {
    return ILLUSTRATIVE_SHOWTIMES.filter((item) => {
      if (midnightOnly && !item.isMidnight) return false;
      if (selectedProvider !== 'all' && item.provider !== selectedProvider) return false;
      if (selectedFormat !== 'all' && item.format !== selectedFormat) return false;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        if (
          !item.cinemaName.toLowerCase().includes(q) &&
          !item.location.toLowerCase().includes(q) &&
          !item.screenName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [searchTerm, selectedProvider, selectedFormat, midnightOnly]);

  const availableFormats = useMemo(() => {
    return Array.from(new Set(ILLUSTRATIVE_SHOWTIMES.map((s) => s.format)));
  }, []);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedProvider('all');
    setSelectedFormat('all');
    setMidnightOnly(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-purple-400" />
            Confirmed Showtimes & Radar Watchlist
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirmed show records retrieved directly from cloud deduplication state (cloud_seen_shows.json).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Data Source Badge */}
          <DataSourceBadge
            dataSource={dataSource}
            lastFetchedAt={lastFetchedAt}
            showTimestamp={true}
          />

          {/* Refresh Button */}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-obsidian-card hover:bg-obsidian-surface text-slate-300 border border-obsidian-border transition-colors disabled:opacity-50"
            title="Refresh show records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Target Movie Summary Card */}
      <MovieSummaryCard />

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Failed to query showtime state: {error.message}</span>
          </div>
          <button
            onClick={() => refresh()}
            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[11px] border border-rose-500/40 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Mode View Switcher (Verified State vs Sample Preview Dataset) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-obsidian-card border border-obsidian-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeView === 'verified'
                ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Cloud State ({realShows.length} Shows Detected)</span>
          </button>

          <button
            onClick={() => setActiveView('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeView === 'preview'
                ? 'bg-brand-purple/20 text-purple-300 border border-brand-purple/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Illustrative UI Preview Dataset (3 Samples)</span>
          </button>
        </div>

        <span className="text-xs font-mono text-slate-400">
          {stateSha ? `State SHA: ${stateSha}` : 'cloud_seen_shows.json'}
        </span>
      </div>

      {/* VIEW 1: VERIFIED CLOUD STATE */}
      {activeView === 'verified' && (
        <div className="space-y-4">
          {loading && !showsData ? (
            <div className="p-8 rounded-xl bg-obsidian-card border border-obsidian-border text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono">Reading cloud_seen_shows.json...</p>
            </div>
          ) : realShows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realShows.map((show, idx) => (
                <LiveShowCard key={idx} show={show} targetDate="2026-12-17" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Zero Midnight Shows Confirmed in Cloud State"
              description={`The cloud monitoring runner has inspected District in Hyderabad for Avengers: Doomsday (Dec 17, 2026). No midnight premiere shows (12:00 AM – 04:59 AM) have been detected or recorded in cloud_seen_shows.json yet. Deduplication state confirms 0 false alerts.`}
            />
          )}
        </div>
      )}

      {/* VIEW 2: ILLUSTRATIVE SAMPLE PREVIEW DATASET */}
      {activeView === 'preview' && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-obsidian-surface border border-brand-purple/30 text-xs text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Sample Dataset Preview:</strong> The showtime cards below are illustrative mock records to test format chips, filters, and mobile cards. They do not represent real ticket releases.
            </span>
          </div>

          <ShowtimeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
            midnightOnly={midnightOnly}
            onMidnightToggle={setMidnightOnly}
            onReset={handleResetFilters}
            formats={availableFormats}
            totalResults={filteredPreviewShows.length}
          />

          {filteredPreviewShows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPreviewShows.map((showtime) => (
                <ShowtimeCard key={showtime.id} showtime={showtime} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Shows Match Filter Criteria"
              description="Try broadening your search query, selecting 'All Providers', or toggling 'Midnight Shows Only' off."
              actionLabel="Reset All Filters"
              onAction={handleResetFilters}
            />
          )}
        </div>
      )}
    </div>
  );
};
