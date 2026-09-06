// The report view: the controls, and the sheet they produce.
//
// Everything above the sheet is `noprint`; the sheet is what leaves the device,
// on paper or as text. The person sets the range and their own overall word,
// keeps a list of questions, and marks when the appointment has happened.
//
// The report is rebuilt from the document on every change rather than patched,
// because a report that is half old is worse than one that takes a moment.

import { formatShortDate, today, type IsoDate } from '../dates/index';
import type { ModuleManifest } from '../registry/types';
import type { KernelStore } from '../store/store';
import type { Question } from '../store/document';
import { card, chips, el, mirror } from '../ui/index';
import { buildReport } from './engine';
import { MIRROR_SUB, MIRROR_TITLE } from './mirror';
import { EXPORT_STRINGS, OVERALL, QUESTION_STRINGS, RANGE_OPTIONS } from './strings';
import type { RangeChoice } from './types';

export interface ReportViewOptions {
  store: KernelStore;
  /** Enabled modules, in the person's chosen order. */
  modules: readonly ModuleManifest[];
  report?: string;
  now?: () => Date;
  /** How the text export leaves the app. Injected so a test can watch it. */
  copyText?: (text: string) => Promise<void>;
  /** How the sheet gets printed. Injected for the same reason. */
  print?: () => void;
  /** Asked before an irreversible step. Injected for the same reason. */
  confirm?: (message: string) => boolean;
}

export interface ReportView {
  element: HTMLElement;
  /** The current plain-text export, for tests and for the copy button. */
  text(): string;
  choice(): RangeChoice;
  setChoice(choice: RangeChoice): void;
  refresh(): void;
}

function parseChoice(value: string): RangeChoice {
  if (value === 'since' || value === 'all') return value;
  const days = Number(value);
  return Number.isFinite(days) && days > 0 ? days : 30;
}

/**
 * The clipboard, with the same fallback the monolith used: some browsers refuse
 * `writeText` outside a user gesture they recognise, and a person who cannot
 * copy still has Print.
 */
async function writeToClipboard(text: string): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard?.writeText !== undefined) {
    await clipboard.writeText(text);
    return;
  }
  const area = el('textarea', { style: 'position:fixed;opacity:0' });
  area.value = text;
  globalThis.document.body.append(area);
  area.select();
  const copied = globalThis.document.execCommand('copy');
  area.remove();
  if (!copied) throw new Error('copy refused');
}

export function mountReport(options: ReportViewOptions): ReportView {
  const { store, modules } = options;
  const now = options.now ?? (() => new Date());
  const copyText = options.copyText ?? writeToClipboard;
  const doPrint = options.print ?? (() => globalThis.print());
  const ask = options.confirm ?? ((message: string) => globalThis.confirm(message));

  let choice: RangeChoice = 30;

  const root = el('div', { class: 'report' });
  const controls = el('div', { class: 'noprint' });
  // Above the controls, as the monolith had it: the person reads what their own
  // record looks like before they decide what to do with it.
  const reflection = el('div', {});
  const sheet = el('div', { class: 'sheet' });
  root.append(reflection, controls, sheet);

  let currentText = '';

  function lastAppointment(): IsoDate | undefined {
    return store.document().kernel.lastAppointment;
  }

  // ---------- the sheet ----------

  function paintSheet(): void {
    const report = buildReport({
      document: store.document(),
      // Family-space slices hang off a child; the engine cannot guess which.
      ...(store.profile() === undefined ? {} : { profileId: store.profile() as string }),
      modules,
      choice,
      now: now(),
      ...(options.report === undefined ? {} : { report: options.report }),
    });
    sheet.innerHTML = report.html;
    currentText = report.text;

    // Screen only. print.css hides `.mirror`, and a test asserts it.
    reflection.replaceChildren();
    if (report.mirror.length > 0) {
      reflection.append(mirror(MIRROR_TITLE, MIRROR_SUB, report.mirror));
    }
  }

  // ---------- export controls ----------

  const rangeSelect = el('select', { id: 'report-range' }) as HTMLSelectElement;
  for (const option of RANGE_OPTIONS) {
    const node = el('option', { value: option.v, text: option.l }) as HTMLOptionElement;
    rangeSelect.append(node);
  }
  rangeSelect.value = '30';
  rangeSelect.addEventListener('change', () => {
    choice = parseChoice(rangeSelect.value);
    paintSheet();
  });

  const copyMessage = el('p', { class: 'bmsg', role: 'status' });

  const printButton = el('button', {
    type: 'button',
    class: 'btn primary',
    text: EXPORT_STRINGS.print,
  });
  printButton.addEventListener('click', () => {
    doPrint();
  });

  const copyButton = el('button', { type: 'button', class: 'btn', text: EXPORT_STRINGS.copy });
  copyButton.addEventListener('click', () => {
    copyText(currentText).then(
      () => {
        copyMessage.textContent = EXPORT_STRINGS.copied;
      },
      () => {
        copyMessage.textContent = EXPORT_STRINGS.copyFailed;
      },
    );
  });

  const overall = chips({
    label: EXPORT_STRINGS.overallLabel,
    options: [...OVERALL],
    value: store.document().kernel.overall ?? '',
    optional: true,
    hint: EXPORT_STRINGS.overallHint,
    onChange: (value) => {
      store.updateKernel((kernel) => ({ ...kernel, overall: value }));
      paintSheet();
    },
  });

  const exportSub = el('p', { class: 'sub', text: EXPORT_STRINGS.sub });
  const exportCard = card({
    title: EXPORT_STRINGS.heading,
    children: [
      exportSub,
      el('div', { class: 'field' }, [
        el('label', { for: 'report-range', text: EXPORT_STRINGS.rangeLabel }),
        rangeSelect,
      ]),
      overall.element,
      el('div', { class: 'btnrow' }, [printButton, copyButton]),
      copyMessage,
    ],
  });

  // ---------- questions ----------

  const questionList = el('ul', { class: 'qlist' });
  const questionInput = el('input', {
    type: 'text',
    placeholder: QUESTION_STRINGS.placeholder,
    'aria-label': QUESTION_STRINGS.inputLabel,
  }) as HTMLInputElement;

  function addQuestion(): void {
    const text = questionInput.value.trim();
    if (text === '') return;
    const question: Question = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      added: today(now()),
    };
    store.updateKernel((kernel) => ({ ...kernel, questions: [...kernel.questions, question] }));
    questionInput.value = '';
    paintQuestions();
    paintSheet();
  }

  const addButton = el('button', { type: 'button', class: 'btn', text: QUESTION_STRINGS.add });
  addButton.addEventListener('click', addQuestion);
  questionInput.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key !== 'Enter') return;
    event.preventDefault();
    addQuestion();
  });

  function paintQuestions(): void {
    questionList.replaceChildren();
    for (const question of store.document().kernel.questions) {
      const remove = el('button', {
        type: 'button',
        class: 'xbtn',
        text: '×',
        'aria-label': QUESTION_STRINGS.remove,
      });
      remove.addEventListener('click', () => {
        store.updateKernel((kernel) => ({
          ...kernel,
          questions: kernel.questions.filter((other) => other.id !== question.id),
        }));
        paintQuestions();
        paintSheet();
      });
      questionList.append(
        el('li', { class: 'qitem' }, [el('span', { text: question.text }), remove]),
      );
    }
  }

  const questionSub = el('p', { class: 'sub', text: QUESTION_STRINGS.sub });

  const appointmentButton = el('button', {
    type: 'button',
    class: 'btn small',
    text: QUESTION_STRINGS.appointmentDone,
  });
  appointmentButton.addEventListener('click', () => {
    if (!ask(QUESTION_STRINGS.confirm)) return;
    store.updateKernel((kernel) => ({
      ...kernel,
      lastAppointment: today(now()),
      // The questions belonged to the appointment that has now happened. Keeping
      // them would make the next report open with someone else's conversation.
      questions: [],
    }));
    choice = 'since';
    rangeSelect.value = 'since';
    paintQuestions();
    paintAppointment();
    paintSheet();
  });

  const questionCard = card({
    title: QUESTION_STRINGS.heading,
    children: [
      questionSub,
      el('div', { class: 'qadd' }, [questionInput, addButton]),
      questionList,
      appointmentButton,
    ],
  });

  /** What the controls say once there is an appointment to date from. */
  function paintAppointment(): void {
    const appointment = lastAppointment();
    const since = rangeSelect.querySelector('option[value="since"]') as HTMLOptionElement | null;

    if (appointment === undefined || appointment === '') {
      questionSub.textContent = QUESTION_STRINGS.sub;
      exportSub.textContent = EXPORT_STRINGS.sub;
      if (since !== null) {
        since.disabled = true;
        since.textContent = 'since your last appointment';
      }
      return;
    }

    const when = formatShortDate(appointment);
    questionSub.textContent = `Since your appointment on ${when}. Add them as they occur to you.`;
    exportSub.textContent = `Your last appointment was ${when}.`;
    if (since !== null) {
      since.disabled = false;
      since.textContent = `since ${when}`;
    }
  }

  controls.append(exportCard, questionCard);
  paintAppointment();
  paintQuestions();
  paintSheet();

  return {
    element: root,
    text: () => currentText,
    choice: () => choice,
    setChoice(next) {
      choice = next;
      rangeSelect.value = String(next);
      paintSheet();
    },
    refresh() {
      paintAppointment();
      paintQuestions();
      paintSheet();
    },
  };
}
