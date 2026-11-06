import { useSyncExternalStore } from 'react';
import { overviewService } from './service';
import type { Overview } from './types';

/**
 * The overview figures, shared by the Overview page and the menu badges so one request serves
 * both. It refreshes while something is listening and the browser tab is visible.
 */
const REFRESH_MS = 20_000;
let value: Overview | undefined;
let failure: unknown;
let loaded = false;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
let snapshot = { value, failure, loaded };

const publish = () => {
  snapshot = { value, failure, loaded };
  for (const l of listeners) l();
};

export async function refreshOverview() {
  try {
    value = await overviewService.get();
    failure = undefined;
  } catch (e) {
    failure = e;
  } finally {
    loaded = true;
    publish();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshOverview();
    timer = setInterval(() => {
      if (!document.hidden) void refreshOverview();
    }, REFRESH_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useOverview() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
}
