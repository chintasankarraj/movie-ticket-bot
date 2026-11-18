/**
 * Movie Ticket Bot — useWorkflows Hook
 * Exposes verified GitHub Actions execution runs for the cloud runner.
 */

import { useCallback } from 'react';
import { WorkflowsApiResponse, AsyncDataState } from '../types/api';
import { getWorkflows } from '../services/api';
import { useApiRequest } from './useApiRequest';

export function useWorkflows(limit: number = 10): AsyncDataState<WorkflowsApiResponse> {
  const fetcher = useCallback(
    (signal: AbortSignal) => {
      return getWorkflows(limit, signal);
    },
    [limit]
  );

  return useApiRequest<WorkflowsApiResponse>(fetcher, [fetcher]);
}
