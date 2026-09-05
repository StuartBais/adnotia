// About Adnotia.
//
// What it is, what it is not, and the promises the architecture keeps rather
// than the ones a policy could quietly drop. Everything here is checkable: the
// source is public, and the claims below are the ones a reader can go and verify.
//
// docs/03-scope.md "Data and privacy commitments" is the authority for the
// wording; this is that list in plainer words, with the one caveat that document
// requires be stated plainly — that data belongs to the address the app is
// served from.

import { card, el } from '../ui/index';
import type { OffTabPage } from './router';

export const SOURCE_URL = 'https://github.com/StuartBais/adnotia';
export const LICENCE = 'AGPL-3.0';

export const ABOUT_STRINGS = {
  title: 'About Adnotia',
  what:
    'Free, open-source tools for adults with ADHD, built on treatments with published ' +
    'evidence and honest about how strong that evidence is. It records what you tell it ' +
    'about your own days and makes that easier to use — by you, and where you choose, by ' +
    'the people who treat you.',
  notTitle: 'What it is not',
  not: [
    'It does not diagnose. It never tells anyone they have or do not have ADHD.',
    'It does not prescribe. It never says to start, stop, raise, lower, skip or time a medication.',
    'It is not a medical device. What it produces is a record of what you reported, not a measurement.',
    'It is not a crisis service. It links to help; it is not help.',
    'It is not a substitute for a clinician, a therapist or a coach.',
  ],
  privacyTitle: 'What happens to what you write',
  privacy: [
    'There is no server and no account. Nothing you enter leaves this device, including ' +
      'anonymised or aggregated versions of it, because there is nothing in the app that ' +
      'could send it.',
    'There is no analytics of any kind, and no third-party request of any kind.',
    'A passcode, if you set one, encrypts everything on this device with a key worked out ' +
      'from the code you chose. It cannot be recovered.',
    'Backups are yours to make, encrypted with a passphrase you choose, and restorable onto ' +
      'any copy of the app.',
    'Clearing your browser data deletes all of it. That is why the app asks about backups, ' +
      'no more than once a fortnight.',
  ],
  originTitle: 'Your data belongs to the address, not to the app',
  origin:
    'A browser keeps what a site stores against the address it was served from. Adnotia has ' +
    'an address of its own that hosts nothing else, so your entries live there. Open the ' +
    'app from a different address, or open the one-file version from your own disk, and it ' +
    'starts empty — the entries are not gone, they are at the other address. Moving between ' +
    'them means downloading a backup and restoring it.',
  sourceTitle: 'Checking any of this',
  source:
    'The source is public, so none of the promises above has to be taken on trust. The ' +
    'licence is AGPL-3.0, which means anyone distributing a changed version has to publish ' +
    'their changes too: a closed fork with tracking in it is not permitted.',
  sourceAction: 'Read the source',
  singleFileTitle: 'The one-file version',
  singleFile:
    'Adnotia is also built as a single HTML file with everything inside it. It runs from ' +
    'any address you put it at, and it is the easiest way to satisfy yourself that nothing ' +
    'is being fetched from anywhere. Encryption needs a secure address, so opening it ' +
    'straight from disk works except for the passcode, and the app says so when it does.',
  singleFileAction: 'Releases and downloads',
  leaves: 'Opening either of these leaves Adnotia and uses the internet.',
} as const;

function bullets(items: readonly string[]): HTMLElement {
  const list = el('ul', { class: 'plain' });
  for (const item of items) list.append(el('li', { text: item }));
  return list;
}

function outward(href: string, text: string): HTMLElement {
  return el('a', {
    class: 'btn',
    href,
    // No referrer: where a person reads about ADHD is their business.
    rel: 'noreferrer noopener',
    target: '_blank',
    text,
  });
}

export function aboutPage(): OffTabPage {
  return {
    id: 'about',
    title: ABOUT_STRINGS.title,
    render(container) {
      container.replaceChildren(
        card({ sub: ABOUT_STRINGS.what }),
        card({ title: ABOUT_STRINGS.notTitle, children: [bullets(ABOUT_STRINGS.not)] }),
        card({ title: ABOUT_STRINGS.privacyTitle, children: [bullets(ABOUT_STRINGS.privacy)] }),
        card({
          title: ABOUT_STRINGS.originTitle,
          children: [el('p', { text: ABOUT_STRINGS.origin })],
        }),
        card({
          title: ABOUT_STRINGS.sourceTitle,
          children: [
            el('p', { text: ABOUT_STRINGS.source }),
            el('p', { class: 'hint', text: ABOUT_STRINGS.leaves }),
            el('div', { class: 'btnrow' }, [
              outward(SOURCE_URL, ABOUT_STRINGS.sourceAction),
              outward(`${SOURCE_URL}/releases`, ABOUT_STRINGS.singleFileAction),
            ]),
          ],
        }),
        card({
          title: ABOUT_STRINGS.singleFileTitle,
          children: [el('p', { text: ABOUT_STRINGS.singleFile })],
        }),
      );
    },
  };
}
