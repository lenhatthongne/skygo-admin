import { useSyncExternalStore } from 'react';
import { getToken } from './session';

/**
 * A live connection to the server for support chat. The server sends a small hint when a
 * conversation changes and the page then reads it through the normal API, so a lost hint is
 * harmless: pages still poll, slowly while this connection is up and quickly while it is down.
 * One shared connection, open while at least one page listens, reconnecting with a growing pause.
 */
export type SupportEvent = { requestId: number; kind: 'message' | 'status' };

const PING_MS = 25_000;
const MAX_PAUSE_MS = 30_000;
const listeners = new Set<(event: SupportEvent) => void>();
const stateListeners = new Set<() => void>();
let socket: WebSocket | null = null;
let connected = false;
let attempts = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;

const address = () =>
  `${(process.env.SKYGO_API_BASE_URL || 'http://localhost:8080/api')
    .replace(/^http/, 'ws')
    .replace(/\/api\/?$/, '')}/api/ws/support`;

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  for (const l of stateListeners) l();
}

function stopPing() {
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = null;
}

function close() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  stopPing();
  const current = socket;
  socket = null;
  setConnected(false);
  if (current) {
    current.onopen =
      current.onmessage =
      current.onclose =
      current.onerror =
        null;
    current.close();
  }
}

function scheduleRetry() {
  if (listeners.size === 0 || retryTimer) return;
  const pause = Math.min(MAX_PAUSE_MS, 1000 * 2 ** Math.min(attempts, 5));
  attempts += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    open();
  }, pause);
}

function open() {
  const token = getToken();
  if (socket || !token || listeners.size === 0) return;
  const ws = new WebSocket(address());
  socket = ws;
  ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
  ws.onmessage = (message) => {
    try {
      const data = JSON.parse(String(message.data)) as {
        type?: string;
        requestId?: number;
        kind?: string;
      };
      if (data.type === 'ready') {
        attempts = 0;
        setConnected(true);
        stopPing();
        pingTimer = setInterval(
          () => ws.send(JSON.stringify({ type: 'ping' })),
          PING_MS,
        );
      } else if (
        data.type === 'support' &&
        typeof data.requestId === 'number'
      ) {
        const event: SupportEvent = {
          requestId: data.requestId,
          kind: data.kind === 'status' ? 'status' : 'message',
        };
        for (const l of listeners) l(event);
      }
    } catch {
      // A malformed hint is ignored: polling covers it.
    }
  };
  const lost = () => {
    if (socket !== ws) return;
    socket = null;
    stopPing();
    setConnected(false);
    scheduleRetry();
  };
  ws.onclose = lost;
  ws.onerror = lost;
}

/** Listens for conversation changes; the connection stays open while anyone listens. */
export function subscribeSupportEvents(
  listener: (event: SupportEvent) => void,
) {
  listeners.add(listener);
  open();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) close();
  };
}

/** True while the live connection is up (pages poll slowly then, quickly otherwise). */
export function useSupportSocketConnected() {
  return useSyncExternalStore(
    (listener) => {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
    () => connected,
    () => false,
  );
}
