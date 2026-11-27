# Project Patterns: Adnotia

Bounded implementation patterns for this project. Ada and Cody use this before adding similar code.

## Current patterns

- Components: follow the existing component/file naming style in the repo.
- Routes: add new routes next to related App Router files.
- Styling: reuse the project design tokens and existing utility conventions before adding new styles.
- Data access: keep provider-specific helpers in `lib/` and call them from routes/components instead of duplicating client setup.

---