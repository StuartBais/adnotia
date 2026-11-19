# Adnotia phone mock-ups

Three directions for the rebuilt phone app. Each is self-contained HTML. Open `index.html` or any direction file by double-click.

Research is in `RESEARCH.md`. All directions follow the hard constraints: ≤5 main choices per screen, no shaming language or counters, contrast ≥4.5:1, touch targets ≥44 px, real interactive elements, no emoji icons, no stock photos, medication not shown.

## Direction A — Ribbon

**Idea:** A continuous vertical time ribbon where each task is a segment; the running task fills with progress so time is felt, not read.

**Built on:** Visual timeline principle from Tiimo and Structured (time made perceptible without reading every item); low-friction capture; “now” prominence from Apple Design Award citations of calm, scannable day views; HIG/M3 touch and type rules; W3C short paths and user control.

**Typefaces:** Outfit (geometric sans, chosen for clean modern readability at large sizes without being a system default). Why: high x-height, excellent legibility at 17–48 pt, supports the ribbon’s soft rounded language.

**Colours (approx contrast):**
- Background #0f1419 / text #f5f5f5 ≈ 15:1
- Accent #7dd3c0 on dark ≈ 8:1
- Secondary #888 on dark ≈ 4.6:1

**Worries if built:** Soft dark theme may feel low-energy to some; progress fill must stay non-judgemental; need to ensure Dynamic Type scales the large timer without breaking layout.

## Direction B — Ledger

**Idea:** High-contrast ruled lines and large serif type turn every task into a clear ledger entry; the running item is a bold left bar.

**Built on:** Things’ task-as-object and restraint; large type for scannability (HIG 17 pt default, larger for hierarchy); externalised memory via clear lines; no colour dependence (black/white structure); paper-like permanence without guilt.

**Typefaces:** Fraunces (variable serif, for titles and task names — distinctive optical size, high contrast strokes for large type) + Source Sans 3 (body and UI). Why: serif gives identity and hierarchy without being decorative; Source Sans is highly legible and neutral for supporting text.

**Colours:**
- Background #faf8f5 / text #1a1a1a ≈ 16:1
- Muted #666 ≈ 5.7:1
- Borders #e0dcd4

**Worries if built:** Serif may feel formal to some ADHD users who prefer softer interfaces; large type can reduce density of “anytime” items; need testing that the ruled aesthetic doesn’t read as a backlog list.

## Direction C — Beacon

**Idea:** The running task is a large central beacon with a circular timer; everything else is a quiet satellite row.

**Built on:** One-thing / focus view principle (report and user statements about “one task at a time”); circular progress as time made visible without a full timeline; satellite list keeps the rest available but secondary; geometric type for modern identity.

**Typefaces:** Space Grotesk (display and buttons — geometric, slightly technical, strong at large sizes) + Inter (body). Why: Space Grotesk gives a distinct beacon personality; Inter is neutral and highly readable for secondary items.

**Colours:**
- Background #18181b / text #eee ≈ 14:1
- Muted #a1a1aa ≈ 5.2:1
- Cards #27272a

**Worries if built:** Circular timer may be less precise for some than a linear one; central emphasis could make switching tasks feel heavier; dark theme again, and the geometric style might date if “techy” becomes fashion.

All directions keep the four-tab navigation (Today, Tasks, Routines, Library) and a Me entry for settings, Medication, and Family. Sample content is identical so the directions can be compared directly.