import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountApplication } from '../../src/kernel/shell/application';
import { createPasscodeCodec } from '../../src/kernel/crypto/codec';
import { envelopeOf, unseal } from '../../src/kernel/crypto/envelope';
import { createDocument, DOCUMENT_KEY } from '../../src/kernel/store/document';
import { memoryStorageAdapter } from '../../src/kernel/store/adapters';
import { V0_KEY } from '../../src/kernel/store/migrations/index';

const click = (element: Element | null | undefined): void => {
  (element as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const byText = (root: ParentNode, text: string): Element | undefined =>
  [...root.querySelectorAll('button, h1, h2, p')].find((node) => node.textContent?.trim() === text);

/** jsdom reports 'visible' and will not be told otherwise; shadow the getter. */
function hide(): void {
  Object.defineProperty(globalThis.document, 'visibilityState', {
    value: 'hidden',
    configurable: true,
  });
  globalThis.document.dispatchEvent(new Event('visibilitychange'));
}

function submit(root: HTMLElement, code: string): void {
  (root.querySelector('input[aria-label="Passcode"]') as HTMLInputElement).value = code;
  root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
}

describe('encrypted application startup', () => {
  it('keeps the shell hidden until the right passcode is entered', async () => {
    const document = createDocument();
    document.kernel.settings = {
      firstRunComplete: true,
      passcodeEnabled: true,
    };
    const codec = await createPasscodeCodec('123456', { iterations: 1000 });
    const raw = await codec.encode(document);
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: raw });
    const root = globalThis.document.createElement('div');
    const application = await mountApplication({ container: root, adapter });
    try {
      expect(root.querySelector('[role="tab"]')).toBeNull();
      submit(root, '000000');
      await vi.waitFor(() => expect(root.textContent).toContain('Nothing has changed.'));
      expect(await adapter.read(DOCUMENT_KEY)).toBe(raw);
      submit(root, '123456');
      await vi.waitFor(() => expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4));
    } finally {
      application.destroy();
    }
  });

  it('imports encrypted legacy data under encryption and leaves its original key intact', async () => {
    const codec = await createPasscodeCodec('123456', { iterations: 1000 });
    const raw = await codec.encode({
      entries: { '2026-09-01': { dose: '30', med: 'Synthetic' } },
    } as never);
    const adapter = memoryStorageAdapter({ [V0_KEY]: raw });
    const root = document.createElement('div');
    const application = await mountApplication({ container: root, adapter });
    try {
      submit(root, '123456');
      await vi.waitFor(() => expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4));
      expect(await adapter.read(V0_KEY)).toBe(raw);
      const imported = envelopeOf((await adapter.read(DOCUMENT_KEY))!);
      expect(imported).not.toBeNull();
      const document = JSON.parse(await unseal('123456', imported!));
      expect(document.modules.medication.days['2026-09-01'].dose).toBe('30');
      expect(document.kernel.settings.passcodeEnabled).toBe(true);
    } finally {
      application.destroy();
    }
  });

  it('leaves unrecognisable data untouched and shows a recoverable error', async () => {
    const adapter = memoryStorageAdapter({ [DOCUMENT_KEY]: 'invalid-data' });
    const root = document.createElement('div');
    const application = await mountApplication({ container: root, adapter });
    expect(root.textContent).toContain('Your data could not be opened');
    expect(await adapter.read(DOCUMENT_KEY)).toBe('invalid-data');
    application.destroy();
  });
});

describe('persisting before the page goes away', () => {
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(globalThis.document, 'visibilityState');
  });

  /**
   * Finish first run, which writes through the 500 ms debounce and nothing else.
   * Fake timers are never advanced in these tests, so anything that reaches the
   * adapter got there because something flushed, not because the debounce fired.
   */
  async function editedButNotYetSaved(): Promise<{
    adapter: ReturnType<typeof memoryStorageAdapter>;
    application: { destroy(): void };
  }> {
    const adapter = memoryStorageAdapter();
    const root = globalThis.document.createElement('div');
    const application = await mountApplication({ container: root, adapter });
    vi.useFakeTimers();
    click(byText(root, 'This is for me'));
    click(byText(root, 'Continue'));
    // The passcode step only appears when there is security to offer, which is
    // why the shell's own first-run tests get away with two clicks and this
    // needs three.
    click(byText(root, 'Not now'));
    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(4);
    expect(await adapter.read(DOCUMENT_KEY)).toBeNull();
    return { adapter, application };
  }

  async function settled(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
  }

  it('writes a pending edit when the page is hidden, without waiting for the debounce', async () => {
    const { adapter, application } = await editedButNotYetSaved();
    try {
      hide();
      await settled();

      const stored = await adapter.read(DOCUMENT_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).kernel.settings.firstRunComplete).toBe(true);
    } finally {
      application.destroy();
    }
  });

  it('writes a pending edit on pagehide, which is what a closing tab sends', async () => {
    const { adapter, application } = await editedButNotYetSaved();
    try {
      globalThis.dispatchEvent(new Event('pagehide'));
      await settled();

      expect(await adapter.read(DOCUMENT_KEY)).not.toBeNull();
    } finally {
      application.destroy();
    }
  });

  it('does nothing when the page merely becomes visible again', async () => {
    const { adapter, application } = await editedButNotYetSaved();
    try {
      // The event fires on the way back too. Only 'hidden' is the trigger.
      globalThis.document.dispatchEvent(new Event('visibilitychange'));
      await settled();

      expect(await adapter.read(DOCUMENT_KEY)).toBeNull();
    } finally {
      application.destroy();
    }
  });

  it('stops listening once the application is destroyed', async () => {
    const { adapter, application } = await editedButNotYetSaved();
    application.destroy();

    hide();
    globalThis.dispatchEvent(new Event('pagehide'));
    await settled();

    // Nothing wrote, and nothing threw at a store that is no longer there.
    expect(await adapter.read(DOCUMENT_KEY)).toBeNull();
  });
});
