"use client";

import { useEffect, useState } from "react";
import { fetchWorkers, type Worker } from "@/lib/api";

// Last good list, so moving between pages shows it straight away.
let cached: Worker[] | null = null;

/**
 * The worker list for assignment dropdowns. Loads on mount and keeps retrying
 * (2s, 4s, ... up to 30s) until it succeeds, so a request that fails while the
 * backend wakes up doesn't leave the dropdowns empty until a reload.
 */
export function useWorkers(): Worker[] {
  const [workers, setWorkers] = useState<Worker[]>(cached ?? []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = 2000;

    const load = async () => {
      try {
        const list = await fetchWorkers();
        cached = list;
        if (!cancelled) setWorkers(list);
      } catch (err) {
        console.error("Error fetching workers, retrying:", err);
        if (!cancelled) {
          timer = setTimeout(load, delay);
          delay = Math.min(delay * 2, 30_000);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return workers;
}
