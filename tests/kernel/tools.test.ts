import { beforeEach, describe, expect, it } from 'vitest';
import {
  createStore,
  memoryStorageAdapter,
  renderTab,
  type KernelStore,
  type ModuleManifest,
  type OffTabPage,
  type ToolContext,
} from '../../src/kernel/index';

// The Tools tab, and the contract a tool is mounted under.

function libraryEntry() {
  return {
    tier: 'A' as const,
    whatItIs: 'x',
    whatTheEvidenceSays: 'y',
    whatItWontDo: 'z',
    citations: [{ title: 't', authors: 'a', year: 2020, venue: 'v', doi_or_url: 'u' }],
    reviewed: '2026-09',
    nextReview: '2027-09',
  };
}

/** A tool that appends to a list in its own slice each time its button is used. */
function appender(): { manifest: ModuleManifest; seen: ToolContext[] } {
  const seen: ToolContext[] = [];
  const manifest: ModuleManifest = {
    id: 'demo',
    name: 'Demo',
    version: 1,
    tier: 'A',
    audience: 'adult',
    area: 'focus',
    summary: 's',
    contributes: {
      library: libraryEntry(),
      tools: [
        {
          title: 'Appender',
          icon: 'x',
          mount: (container, kernel) => {
            const context = kernel as ToolContext;
            seen.push(context);
            const button = document.createElement('button');
            button.textContent = 'add';
            button.addEventListener('click', () => {
              const slice = (context.slice ?? { version: 1, items: [] }) as {
                version: number;
                items: string[];
              };
              context.save({ ...slice, items: [...slice.items, 'one'] });
            });
            container.append(button);
          },
        },
      ],
    },
  };
  return { manifest, seen };
}

describe('the Tools tab', () => {
  let store: KernelStore;
  let opened: OffTabPage[];

  beforeEach(async () => {
    store = createStore({ adapter: memoryStorageAdapter() });
    await store.load();
    opened = [];
  });

  function render(manifest: ModuleManifest): HTMLElement {
    return renderTab('tools', {
      space: 'adult',
      enabled: [manifest],
      known: [manifest],
      store,
      onOpenPage: (page) => opened.push(page),
    });
  }

  /** Render a page the tab handed us, the way the shell would. */
  function open(page: OffTabPage): HTMLElement {
    const host = document.createElement('div');
    page.render(host);
    return host;
  }

  /** Click the row with this label, wherever it is. */
  function follow(view: HTMLElement, label: string): OffTabPage {
    const row = [...view.querySelectorAll('button')].find((button) =>
      (button.textContent ?? '').startsWith(label),
    );
    expect(row, label).toBeDefined();
    row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const page = opened.at(-1);
    expect(page, label).toBeDefined();
    return page as OffTabPage;
  }

  it('is an index of areas, not a pile of mounted tools', () => {
    // The whole point of the change: nine tools used to mount here expanded, in
    // registration order, with no way to see what was there without scrolling
    // past all of it.
    const { manifest } = appender();
    const view = render(manifest);
    expect(view.querySelectorAll('.area-card').length).toBeGreaterThan(1);
    expect(view.textContent).toContain('Focus and starting');
    // The tool itself is not on the tab at all.
    expect(view.textContent).not.toContain('Appender');
  });

  it('reaches a tool in two taps', () => {
    const { manifest } = appender();
    const area = open(follow(render(manifest), 'Focus and starting'));
    const tool = open(follow(area, 'Appender'));
    expect(tool.querySelector('button')?.textContent).toBe('add');
  });

  it('shows an area with nothing in it, without pretending it opens', () => {
    // Somebody choosing what to turn on needs to see that the room exists.
    const { manifest } = appender();
    const view = render(manifest);
    const empty = [...view.querySelectorAll('.area-card')].filter((element) =>
      element.classList.contains('empty'),
    );
    expect(empty.length).toBeGreaterThan(0);
    for (const element of empty) expect(element.getAttribute('aria-disabled')).toBe('true');
  });

  it('says so plainly when nothing is turned on', () => {
    const bare: ModuleManifest = {
      id: 'bare',
      name: 'Bare',
      version: 1,
      tier: 'A',
      audience: 'adult',
      area: 'focus',
      summary: 's',
      contributes: { library: libraryEntry() },
    };
    const view = render(bare);
    expect(view.textContent).toContain('Turning something on in Settings');
  });

  it('shows a tool its own first save before its second', () => {
    // The slice is read live, not captured at mount. A tool that saves twice
    // without being redrawn was silently discarding the first write. The tool
    // now mounts on its own page, so this follows it there.
    const { manifest } = appender();
    const area = open(follow(render(manifest), 'Focus and starting'));
    const tool = open(follow(area, 'Appender'));
    const add = tool.querySelector('button') as HTMLButtonElement;

    add.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    add.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(store.get<{ items: string[] }>('demo')?.items).toEqual(['one', 'one']);
  });

  it('hands a tool nothing but its own slice', () => {
    const { manifest, seen } = appender();
    store.set('somebody-else', { version: 1, secret: true });
    const area = open(follow(render(manifest), 'Focus and starting'));
    open(follow(area, 'Appender'));

    const context = seen[0]!;
    expect(Object.keys(context).sort()).toEqual(['reads', 'refresh', 'save', 'slice', 'today']);
    // Nothing is readable that the module did not declare a dependency on.
    expect(context.reads).toEqual({});
    expect(context.slice).toBeUndefined();
    context.save({ version: 1, items: [] });
    expect(store.get<{ secret?: boolean }>('somebody-else')?.secret).toBe(true);
  });
});
