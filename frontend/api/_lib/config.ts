/**
 * Movie Ticket Bot — Serverless API Configuration
 * Fixed, hardcoded repository boundaries and security constants
 */

import { MovieTargetConfig } from './types';

export const GITHUB_CONFIG = {
  OWNER: 'chintasankarraj',
  REPO: 'movie-ticket-bot',
  API_BASE: 'https://api.github.com',
  API_VERSION: '2022-11-28',
  USER_AGENT: 'MovieTicketBot-ServerlessProxy/1.0',
  TIMEOUT_MS: 8000,
} as const;

export const CACHE_CONFIG = {
  DEFAULT_TTL_MS: 60 * 1000,           // 60 seconds fresh
  MAX_STALE_MS: 300 * 1000,            // 5 minutes stale grace period
} as const;

export const MOVIE_TARGET: MovieTargetConfig = {
  title: 'Avengers: Doomsday',
  universe: 'Marvel Cinematic Universe • Phase 6',
  city: 'Hyderabad',
  targetDate: '2026-12-17',
  targetWindow: {
    start: '12:00 AM',
    end: '04:59 AM',
    start24: '00:00',
    end24: '04:59',
  },
};

export const CLOUD_MONITOR_SPEC = {
  PROVIDER: 'District' as const,
  SCHEDULE_CRON: '37 * * * *',
  DISTRICT_URL: 'https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735',
  STATE_FILE_PATH: 'cloud_seen_shows.json',
};

export const LOCAL_MONITOR_SPEC = {
  providers: ['BookMyShow', 'District'] as ['BookMyShow', 'District'],
  intervalSeconds: 90,
  status: 'unlinked_offline' as const,
  notice: 'Local workstation monitor runs independently as a CLI process. Telemetry is not linked to cloud API.',
};
