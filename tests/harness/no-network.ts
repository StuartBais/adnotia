// The no-network guard.
//
// Adnotia makes no network requests, ever. The CSP in index.html enforces that in
// a browser; this enforces it under test. Every networking primitive is replaced
// with one that throws, so a test that reaches for the network fails loudly
// instead of quietly succeeding against a stub.
//
// See docs/03-scope.md "Data and privacy commitments" and
// docs/05-architecture.md "Testing strategy".

export const NO_NETWORK_MESSAGE = 'Adnotia makes no network requests';

/** The APIs the guard replaces. Kept exported so tests can assert the full set. */
export const GUARDED_APIS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'navigator.sendBeacon',
] as const;

export type GuardedApi = (typeof GUARDED_APIS)[number];

function refuse(api: GuardedApi): never {
  throw new Error(
    `${NO_NETWORK_MESSAGE}. ${api} was called. If a feature needs the network, ` +
      'it does not belong in this project. See docs/03-scope.md.',
  );
}

function define(target: object, name: string, value: unknown): void {
  Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    enumerable: false,
    value,
  });
}

/**
 * Replace every networking primitive on `scope` with a throwing version.
 * Safe to call more than once.
 */
export function installNoNetworkGuard(scope: typeof globalThis = globalThis): void {
  define(scope, 'fetch', function fetch(): never {
    refuse('fetch');
  });

  define(
    scope,
    'XMLHttpRequest',
    class XMLHttpRequest {
      constructor() {
        refuse('XMLHttpRequest');
      }
    },
  );

  define(
    scope,
    'WebSocket',
    class WebSocket {
      constructor() {
        refuse('WebSocket');
      }
    },
  );

  define(
    scope,
    'EventSource',
    class EventSource {
      constructor() {
        refuse('EventSource');
      }
    },
  );

  // navigator is absent in a non-DOM environment; the rest of the guard still applies.
  const nav: unknown = (scope as { navigator?: unknown }).navigator;
  if (nav && typeof nav === 'object') {
    define(nav, 'sendBeacon', function sendBeacon(): never {
      refuse('navigator.sendBeacon');
    });
  }
}
