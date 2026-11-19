# Research for Adnotia phone app mock-ups

Read on 19 November 2026. Sources opened and notes taken; inferences marked.

## 1. Best current phone app interfaces (last two years)

- Apple Design Awards 2026 winners (https://developer.apple.com/design/awards/ and https://www.apple.com/newsroom/2026/06/apple-reveals-winners-of-the-2026-apple-design-awards/, read 19 Nov 2026): grug (delight through playful, hand-drawn character and short daily content), Guitar Wiz (inclusivity via spoken guidance), Moonlitt, Tide Guide (clear data), Primary. Awards favour apps with one clear idea executed cleanly, calm or joyful tone, and platform-native polish.
- 2025 App Store Awards (https://daringfireball.net/2025/12/2025_app_store_award_winners, read 19 Nov 2026; Apple announcements): Tiimo named iPhone App of the Year for colour-coded, emoji-accented visual blocks that made to-dos feel calmer. Structured cited in Design Awards contexts for sharp, scannable timelines that treat downtime as part of the day.
- Other cited: CapWords (photo-to-sticker language learning, delight through direct object interaction), Speechify (text-to-speech for accessibility), Things 3 (long-standing for focused simplicity, task-as-object, When vs Deadline separation).

**What was read:** Award pages describe visual timelines, object-focused interactions, and restraint. Designers and reviewers (Gruber on Tiimo) note emoji and colour blocks as the recognisable signature, while also criticising rating prompts and subscription friction.

**Inferred principle:** A recognisable identity lives in how the main object (task/time) is drawn, not in decoration. Calm + scannable beats dense feature lists.

## 2. Planners and focus tools rated by people with ADHD

- Tiimo (reviews on tryfoco.com, adhdproductivity.org, selfpause.com, productivity-apps.com, all read 19 Nov 2026): Strengths — visual timeline of coloured blocks makes time perceptible; gentle transitions; now/next visibility; routines. Complaints — paywall and rating prompts early, AI misreads dates, calendar sync one-way, upkeep of building the day is itself hard, some find emoji childish or distracting.
- Structured (adhdproductivity.org, coolcuration.com, YouTube review summaries, read 19 Nov 2026): Vertical timeline of timed blocks with now marker; icons for scannability; free tier usable; energy points. Strengths for time blindness. Limitations — mainly day view, less project depth.
- Things (culturedcode support and design critiques, read 19 Nov 2026): Separates start date (“When”) from deadline; tasks expand into cards; Magic Plus for low-friction capture; hierarchy of Area > Project > To-do. Restraint in colour. Completion feels satisfying without punishment.
- Others referenced in Adnotia report (already read): Finch (pet care as reward), Llama Life (focus sessions), Routinery (routine playlists), Amazing Marvin (flexible data model with estimate vs actual, subtasks embedded).

**What was read:** User and review pages consistently praise making time visible and reducing cognitive load of “what’s next”. Complaints centre on setup friction, subscription pressure, and anything that feels like a backlog or failure.

**Inferred:** Low-friction capture and a clear “now” are more important than feature richness. Avoid anything that surfaces unfinished work as a problem.

## 3. Family and child routine apps

- Joon (family-checklist.com review, read 19 Nov 2026): Parent app assigns “quests” with rewards; child uses separate pet game on shared or own device. Parent approves completions. Explicit note that parent must stay involved.
- Goally (getgoally.com parent app page and FAQs, read 19 Nov 2026): Parent controls routines, rewards, and available apps from their phone; child uses dedicated tablet or kid mode. Visual schedules, first/then, timers. Hand-over is the device itself under parent settings.
- Brili (mentioned in routine app round-ups): Timed playlist-style routines with visual clock, usable by adult or child.

**What was read:** Parent view is configuration and overview; child view is simplified, sequential, often gamified or visual. Hand-over means either shared phone with mode switch or dedicated child surface. No evidence of seamless single-app mode switch in the opened pages; inference is that a clear “hand to child” action that simplifies the UI is useful.

## 4. Platform guidance and cognitive accessibility

- Apple HIG Typography (developer.apple.com/design/human-interface-guidelines/typography, read 19 Nov 2026): Default body 17 pt on iOS, minimum 11 pt, prefer Regular/Medium/Semibold over thin weights. Dynamic Type support. Colour and weight for hierarchy, not alone.
- HIG general (touch targets, writing): 44×44 pt minimum touch targets; clear verb labels; sentence or title case consistently.
- Material Design 3 (m3.material.io navigation and colour, read 19 Nov 2026): Navigation bar shorter in expressive update; active state via pill or colour; dynamic colour from wallpaper; high contrast roles. Motion should be purposeful.
- W3C “Making Content Usable for People with Cognitive and Learning Disabilities” (w3.org/WAI/cognitive/ and related notes, attempted 19 Nov 2026; prior full read in Adnotia report): Short paths, externalised memory, reminders only at user request, clear language, limit simultaneous choices, user control over complexity. No claim that specific colours or typefaces help ADHD.

**What was read:** Explicit numbers (44 pt, 17 pt, 4.5:1) and principles of control, brevity, and no unsolicited interruption. Report already states no good evidence for colour/type/dark mode specifically helping ADHD; do not claim otherwise.

## 5. Current interface trends and what will date

- Trends observed in 2025–2026 write-ups (webpo, LogRocket, Haddington, daily.dev summaries, read 19 Nov 2026): glassmorphism / liquid glass, bento grids, AI-driven personalisation, dark-first, gesture navigation, neo-brutalism, dynamic colour.
- Judgement: Glassmorphism and heavy blur reduce contrast and legibility for cognitive accessibility — avoid as primary surface. Excessive AI chat as the only capture path adds friction. Dark mode as identity is fashion; offer it but do not centre the design on it. Bento can work if hierarchy remains obvious. Persistent “now” markers and large type scales are more durable than decorative trends.

## Principles taken (≈10)

1. Make time and the current task visible without requiring reading every item.
2. Capture in as few steps as possible; one obvious place to add.
3. Separate “when I will do it” (today/anytime/timed) from any deadline.
4. Limit simultaneous choices to ≤5 on any screen.
5. Tasks as clear, tappable objects with consistent shape language.
6. No backlog, overdue, missed counts, or breakable streaks.
7. Parent configures; child sees sequential, simplified routine; hand-over is explicit.
8. Touch targets ≥44 px, text ≥17 pt body, contrast ≥4.5:1, never colour alone.
9. Reminders and timers only when the person starts or sets them.
10. Identity through the drawing of the task and the “now” state, not through colour psychology or emoji.

## Things avoided and why

- Red “overdue” or shame language (report and user statements; W3C on penalty feedback).
- Streaks that can break or counters of failure (untested on ADHD outcomes; some find them harmful).
- Emoji as primary icons (Tiimo reviews note distraction/childishness for some; use geometric or simple marks).
- Stock photos, lorem, generic system-font bordered cards on off-white (explicit owner rejection of current design).
- Claiming any colour or typeface “helps ADHD” (report: no good evidence).
- Glassmorphism or low-contrast fashion trends that fight legibility.
- AI as the only capture path (friction for some ADHD users in reviews).

All design choices below trace to the above. No copying of another app’s screens, names, or artwork.