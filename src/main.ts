// Milestone 0. The shell is a scaffold: no kernel, no modules, no design system.
// Those land in the remaining Milestone 0 steps; see docs/08-roadmap.md.

const app = document.querySelector<HTMLElement>('#app');

if (app) {
  const heading = document.createElement('h1');
  heading.textContent = 'Adnotia';

  const note = document.createElement('p');
  note.textContent = 'Nothing here yet. The shell is still being built.';

  app.replaceChildren(heading, note);
}
