/**
 * Movie Ticket Bot — useOverview Hook
 * Exposes real-time monitoring telemetry, target movie info, and runner status.
 */

import { useCallback } from 'react';
import { OverviewApiResponse, AsyncDataState } from '../types/api';
import { getOverview } from '../services/api';
import { useApiRequest } from './useApiRequest';

export function useOverview(): AsyncDataState<OverviewApiResponse> {
  const fetcher = useCallback((signal: AbortSignal) => {
    return getOverview(signal);
  }, []);

  return useApiRequest<OverviewApiResponse>(fetcher, [fetcher]);
}
