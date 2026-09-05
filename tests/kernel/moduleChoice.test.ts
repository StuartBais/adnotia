import { describe, expect, it, vi } from 'vitest';
import { firstRun, moduleChoice } from '../../src/kernel/shell/firstRun';
import medication from '../../src/modules/medication/manifest';

function button(root: HTMLElement, label: string): HTMLButtonElement {
  return [...root.querySelectorAll('button')].find((node) => node.textContent === label)!;
}

describe('module eligibility', () => {
  it('requires an affirmative answer every time medication is enabled', () => {
    const onChange = vi.fn();
    const root = moduleChoice({
      manifest: medication,
      space: 'adult',
      enabled: false,
      onChange,
    });
    button(root, 'Turn this on').click();
    expect(onChange).not.toHaveBeenCalled();
    expect(root.textContent).toContain(medication.eligibility!.question);
    button(root, 'No').click();
    expect(onChange).toHaveBeenLastCalledWith(false);
    button(root, 'Turn this on').click();
    button(root, 'Yes').click();
    expect(onChange).toHaveBeenLastCalledWith(true);
    button(root, 'On').click();
    expect(onChange).toHaveBeenLastCalledWith(false);
    button(root, 'Turn this on').click();
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('cannot complete onboarding with medication enabled without eligibility', () => {
    const onDone = vi.fn();
    const root = firstRun({ available: () => [medication], onDone });
    button(root, 'This is for me').click();
    button(root, 'Turn this on').click();
    button(root, 'Done').click();
    expect(onDone).toHaveBeenCalledWith({ space: 'adult', enabled: [] });
  });
});
