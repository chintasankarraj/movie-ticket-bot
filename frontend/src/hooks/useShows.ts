/**
 * Movie Ticket Bot — useShows Hook
 * Exposes detected midnight show records parsed directly from cloud_seen_shows.json.
 */

import { useCallback } from 'react';
import { ShowsApiResponse, AsyncDataState } from '../types/api';
import { getShows } from '../services/api';
import { useApiRequest } from './useApiRequest';

export function useShows(): AsyncDataState<ShowsApiResponse> {
  const fetcher = useCallback((signal: AbortSignal) => {
    return getShows(signal);
  }, []);

  return useApiRequest<ShowsApiResponse>(fetcher, [fetcher]);
}
