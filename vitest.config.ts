import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so tests never load the PWA or single-file
// plugins. See docs/05-architecture.md "Testing strategy".
export default defineConfig({
  test: {
    environment: 'jsdom',
    // Installs the no-network guard before every test file. A test that reaches
    // for the network fails; see docs/03-scope.md "Data and privacy commitments".
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    restoreMocks: true,
  },
});
