// Milestone 0. The shell is a scaffold: no kernel wiring and no modules yet.
// Those land in the remaining Milestone 0 steps; see docs/08-roadmap.md.

import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';

const app = document.querySelector<HTMLElement>('#app');

if (app) {
  app.className = 'wrap';

  const masthead = document.createElement('header');
  masthead.className = 'mast';
  const heading = document.createElement('h1');
  heading.textContent = 'Adnotia';
  masthead.append(heading);

  const card = document.createElement('section');
  card.className = 'card';
  const title = document.createElement('h2');
  title.textContent = 'Not finished yet';
  const note = document.createElement('p');
  note.className = 'sub';
  note.textContent = 'The shell is still being built. There is nothing to record here so far.';
  card.append(title, note);

  app.replaceChildren(masthead, card);
}
