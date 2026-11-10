"use client";

import { useEffect, useRef, useState } from "react";

interface PollingState<T> {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

/**
 * Fetch on mount and then every `intervalMs`. Keeps the last good data when a
 * refresh fails, and never runs two requests at once.
 */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number): PollingState<T> {
  const [state, setState] = useState<PollingState<T>>({
    data: undefined,
    error: null,
    isLoading: true,
    lastUpdated: null
  });
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const run = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await fetcherRef.current();
        if (!cancelled) setState({ data, error: null, isLoading: false, lastUpdated: new Date() });
      } catch (err) {
        console.error("Polling request failed:", err);
        if (!cancelled) {
          setState((s) => ({ ...s, isLoading: false, error: "Gagal memuat data" }));
        }
      } finally {
        inFlight = false;
      }
    };

    run();
    const id = setInterval(run, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}
