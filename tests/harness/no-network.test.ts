import { describe, expect, it } from 'vitest';
import { GUARDED_APIS, NO_NETWORK_MESSAGE } from './no-network';

// The guard is installed globally by tests/setup.ts. This asserts it actually
// bites, so that every other suite's silence about the network means something.

describe('the no-network guard', () => {
  it('refuses fetch', async () => {
    expect(() => fetch('https://example.com')).toThrow(NO_NETWORK_MESSAGE);
  });

  it('refuses XMLHttpRequest', () => {
    expect(() => new XMLHttpRequest()).toThrow(NO_NETWORK_MESSAGE);
  });

  it('refuses WebSocket', () => {
    expect(() => new WebSocket('wss://example.com')).toThrow(NO_NETWORK_MESSAGE);
  });

  it('refuses EventSource', () => {
    expect(() => new EventSource('https://example.com')).toThrow(NO_NETWORK_MESSAGE);
  });

  it('refuses navigator.sendBeacon', () => {
    expect(() => navigator.sendBeacon('https://example.com')).toThrow(NO_NETWORK_MESSAGE);
  });

  it('names the API that was called', () => {
    expect(() => fetch('https://example.com')).toThrow(/fetch was called/);
  });

  it('guards every API it claims to guard', () => {
    expect(GUARDED_APIS).toEqual([
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'EventSource',
      'navigator.sendBeacon',
    ]);
  });
});
