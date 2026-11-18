/**
 * Movie Ticket Bot — Reusable Async Data Hook Foundation
 * Manages loading, lifecycle cancellation, race-condition mitigation,
 * manual refresh, and explicit data-source state mapping.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AsyncDataState, ApiResponseMeta } from '../types/api';
import { resolveDataSourceState } from '../services/api';

export function useApiRequest<T extends ApiResponseMeta>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = []
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const executeFetch = useCallback(async () => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(controller.signal);

      // Verify that this is still the latest active request and component is mounted
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setData(result);
        setError(null);
        setLastFetchedAt(new Date().toISOString());
        setLoading(false);
      }
    } catch (err: unknown) {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        // Do not report cancellation as an application error
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeFetch]);

  const refresh = useCallback(async () => {
    await executeFetch();
  }, [executeFetch]);

  const dataSource = resolveDataSourceState(data, !!error);

  return {
    data,
    loading,
    error,
    dataSource,
    lastFetchedAt,
    refresh,
  };
}
