# Tools, techniques and app features that adults with ADHD praise and criticise (as of November 2026), with a secondary section on autistic and AuDHD adults

## Verification pass, 14 November 2026

**What this file is.** Lived-experience and review material: reader surveys, forum comments, and published studies of what people say. It is **not trial evidence** and nothing here is a claim that any tool works. "Praised" means people say it helps them.

**What changed in this pass.** The first version was written from search-result extracts with no page opened. In this pass the sources below were opened and read. Each finding now carries one of three marks:

- **[page read]** — I opened the page on 14 Nov 2026 and the figure, paraphrase or quotation is as the page gives it. Quotation marks are used only for text copied from the page.
- **[abstract read]** — only the publisher's abstract (via Crossref / OpenAlex) was readable; the body was not.
- **[unverified lead]** — still from a search extract or secondary summary; not opened, with the reason.

**How pages were read.** ADDitude, Hacker News (through its public Algolia API), arXiv, PMC, Frontiers, Kent Academic Repository, Crossref, OpenAlex and Europe PMC answered. Text was extracted from the raw HTML or PDF, not summarised by a model.

### Confirmed
- **61% of ADDitude readers use hardcopy tools** — on the page, and repeated on a second ADDitude page. No sample size, survey date or question wording is given beyond "a recent ADDitude survey" (article first published 23 Dec 2022).
- **ADDitude "August 2020 survey" app list** including Habitica, TimeTree, Done, AnyList and Any.do — confirmed, but at a different URL from the one the notes gave (see Corrected).
- **Eagle et al. 2024**: a survey of 220 people on body doubling, ACM TACCESS — confirmed from the abstract only.
- **Kent interface-change study**: autistic n=11, control n=10, seven cumulative changes — confirmed from the full accepted manuscript, with more detail than the notes had.
- **Stress Autism Mate study**: 10 autistic participants, at least four weeks' use, reflexive thematic analysis, emotionally neutral and predictable design valued — confirmed from the full text.
- **CSCW 2026 interview study** (22 interviews + 20 follow-up participants) — confirmed from the full text; the gap about which design concepts participants preferred is now filled.
- **Seery et al. "A one-stop shop"** (14 interviewees) — confirmed and read in full; but it does not say what the notes used it for (see Corrected).
- **All seven Hacker News threads** exist with the dates now read from the API; most of the individual statements were found, several in a different thread from the one cited.

### Corrected
1. **Eagle et al. author list.** The notes gave "Eagle, Baltaxe-Admony, Taber and Ringland". Crossref lists three authors: Tessa Eagle, Leya Breanna Baltaxe-Admony, Kathryn E. Ringland. Published online 4 Oct 2024, TACCESS vol. 17 issue 3.
2. **Habitica / August 2020 survey URL.** `/adhd-productivity-apps/` redirects (301) to the "15 Apps, Tools, and Gadgets" reader article, which does not mention Habitica. The August 2020 list is "23 Productivity Apps for ADHD Brains" at `/productivity-apps-for-adhd-brains/`. The app descriptions there are the editors' words, not readers', and no counts are given.
3. **"Show one task at a time to avoid decision fatigue"** is in the July 2023 thread "TODO apps are meant for robots", not in the March 2025 "what would you want in a ToDo app" thread. **"A list of three items checked every half hour"** was not found in either: the nearest are one commenter who writes the top 3–4 things in a paper notebook each morning and checks at day's end, and one who keeps the important list to no more than three items.
4. **LeechBlock and StayFocusd** are named in the Jan 2023 thread, not the 2019 one.
5. **Todoist.** "Complete game changer" and "worked better for my brain" are the same commenter, in the Jan 2026 thread (not 2023); a second commenter there agrees. "The app named most often by HN commenters with ADHD" is **not supported**: a keyword tally of the five ADHD-specific threads finds Todoist in 3 of 588 comments.
6. **"Tomato timer" with music in headphones** is one commenter in the Jan 2023 thread, not the 2026 or 2017 threads.
7. **Kent study date.** "Preprint 2024" was not confirmed. The repository record gives deposit 10 Aug 2025, conference 7–10 Oct 2025 (IEEE VL/HCC, Raleigh), publication 25 Dec 2025. Authors: Sawyer and Palaniappan. The study **excluded people with ADHD**, so it says nothing direct about AuDHD.
8. **"One-stop shop" (Seery et al.).** The participant's phrase is about trustworthy *information* in one place in a psychoeducation app. It is not about tasks, planning or timers and does not support the "one place" want.
9. **Hacker News dates.** Now read rather than inferred: 7 Jul 2017, 23 May 2019, 23 Jan 2023, 16 Jul 2023, 19 Mar 2025, 11 Aug 2025, 13 Jan 2026.

### Contradicted or not found where the notes said
- **"A survey completed by 1,342 ADDitude readers favouring paper planners."** The page the notes cited was read in full and does not contain that number; its `/amp` address returns 404; the number is absent from every ADDitude page downloaded in this pass and ADDitude's own site search for it returns nothing relevant. What the page does say is that 61% of readers prefer paper and that readers were asked for their favourite paper planners "in 2023". Treat 1,342 as **unconfirmed and possibly a search-extract artefact**; do not cite it.
- **"Super Productivity recommended on HN for its Pomodoro timer"** — the string does not occur in any of the seven threads.
- **"Paper is clearly favoured" as a general reading** needs tempering: the same ADDitude article prints readers who are "dedicated to digital" and readers who use both, and one who calls themselves "Paper Hater".

### New in this pass (not in the first version)
- An ADDitude survey of **1,859 adults with ADHD** (article 5 Dec 2024): only **3.53%** rated a time-management or productivity app or service "extremely helpful".
- A peer-reviewed analysis of **3,383 Reddit posts** from r/ADHD and r/adhdwomen (Front. Psychiatry, 7 Aug 2026): digital tools appear in under one in ten posts that mention any coping strategy.
- A reflexive thematic analysis of **277 r/ADHD workplace threads** (Front. Psychol., 15 Jun 2026).
- A counter-signal on gamification: in Seery et al., some adults with ADHD **asked for** rewards, badges, streaks and reminders.
- Direct statements on overdue lists, setup burden, tools "becoming invisible", low-friction capture and estimate-versus-actual time.

### Still unverified, and why
- **Reddit.** One ordinary fetch of one r/ADHD thread was attempted and refused by the fetch tool; nothing further was tried. Every Reddit item reached through a mirror remains a lead. The two published Reddit analyses above are the substitute.
- **Eagle et al. full text** (the 75% figure, the task counts 86/64/52/35, the effectiveness breakdown). `dl.acm.org` answers automated requests with a bot challenge (HTTP 403), and no repository copy exists (OpenAlex: no repository full text; nothing on arXiv). The paper is open access for a person with a browser; someone should read it.
- **Finch's help page** (HTTP 403), **Product Hunt** (403), **HuffPost UK** (406): all refused automated requests. Left as leads.
- **App-store pages, review aggregators, vendor and competitor blogs, Substack and Medium essays, The Mighty, AANE, Neurodivergent Insights, ADDA, Discord forum, Ministry of Testing** — not attempted in this pass (time went to primary and peer-reviewed sources). Three first-person essays (masukomi, chudi.dev, Glyph) and The Conversation piece were downloaded but **not read**, so they stay as leads.
- Two PMC articles (an interview study on remote measurement technology in ADHD, PMC10365629; a computational study of music and ADHD, PMC12316199) returned a challenge page and were not retried.
- PubMed's own search began returning a browser check after a few queries; Europe PMC's API was used instead.
- No published thematic analysis of ADHD app-store reviews was found in Europe PMC or arXiv.

---

## Which techniques come up again and again as genuinely helpful?

### Takeaway
On the material now actually read, the best-supported lived-experience signals are: writing things down on paper or a visible surface (two ADDitude surveys' reader quotes, a Reddit analysis, Hacker News); timers and alarms used as "pre-timers" and for routines; borrowing structure from another person (body doubling, a friend, a spouse); and giving every object a home. Apps as a category rate low: 3.53% of 1,859 surveyed adults called one "extremely helpful", and digital tools appear in under a tenth of Reddit posts that mention a coping strategy.

### Cited Findings

**How much apps matter at all (context for everything below)**
- **[page read]** ADDitude "recently surveyed 1,859 adults with ADHD"; the share finding each support "extremely helpful" for getting things done: family member, spouse or friend 5.6%; personal organiser 4.73%; time-management or productivity app or service 3.53%; ADHD coach 2.70%. The article also reports that medication helps 37.54% with these problems. Most common problems: procrastinating 56.59%; resisting distractions 42.28%; tackling onerous to-do items 35.96%; sticking with projects 35.85%; estimating how long a task will take 31.35%; prioritising 26.15%. Published 5 Dec 2024, updated 7 May 2025; survey date and method not stated — [ADDitude, "42 Time-Management Apps and Hacks That Work for ADHD Brains"](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[page read]** Seo et al. analysed 3,383 Reddit posts (r/adhdwomen 1,414; r/ADHD 1,969; collected 21 July 2025; classified with GPT-4.1-mini). Among posts naming at least one coping strategy (480 and 751 posts): medication 70.4% / 74.7%; executive-function support (time management, planning, organisation, coaching) 34.2% / 29.3%; lifestyle (exercise, sleep, diet) 18.8% / 20.4%; social support 17.9% / 16.4%; psychotherapy 14.4% / 9.3%; environmental structuring (minimalism, routines, distraction control) 11.5% / 9.9%; **digital tools and technology (ADHD apps, productivity tools, AI) 9.0% / 8.4%**; mindfulness 7.3% / 9.7%. The discussion gives bullet journals, wall planners and running to-do lists as examples. The authors say the coping-strategy coding was not human-validated and should be read as approximate. Published 7 Aug 2026 — [Seo et al., Frontiers in Psychiatry](https://pmc.ncbi.nlm.nih.gov/articles/PMC13495778/)
- **[page read]** A keyword tally I ran over five ADHD-specific Hacker News threads (588 comments, 2017–2026) points the same way. Comments matching each term: medication 133; sleep 51; meditation 33; habit or routine 30; exercise 26; paper, notebook, sticky note or whiteboard 25; music or noise 16; site or app blockers about 10 after removing false matches; reminders or alarms 14; Pomodoro 7; task breakdown 7; text file 6; Todoist 3; body doubling or co-working 3. This is a crude substring count on a technical, mostly male forum, not a coded analysis — threads: [2017](https://news.ycombinator.com/item?id=14718880), [2019](https://news.ycombinator.com/item?id=19989627), [2023](https://news.ycombinator.com/item?id=34486848), [2025](https://news.ycombinator.com/item?id=43416755), [2026](https://news.ycombinator.com/item?id=46610156)

**Paper, sticky notes, whiteboards and plain text**
- **[page read]** "In a recent ADDitude survey, 61% of readers said they use hardcopy planners, sticky notes, and handwritten lists. The remainder prefer phone alerts and apps". The article opens with the question "Which do you rely on more to keep yourself organized: paper or digital planners?" No sample size or survey date. Published 23 Dec 2022, modified 9 May 2025 — [ADDitude, "Paper or Digital?"](https://www.additudemag.com/best-planners-adhd-brains-paper-digital/)
- **[page read]** A second page restates it as readers "61% of whom said they prefer paper over digital tools" and says "In 2023, we asked ADDitude readers to share their favorite paper planners". It does **not** contain the figure 1,342. Published 17 Dec 2022, updated 8 Feb 2026 — [ADDitude, "15 Best Journals & Planners"](https://www.additudemag.com/best-journals-planners-adhd-time-management/)
- **[page read]** Why readers say paper works, in their words (same "Paper or Digital?" article): visibility — "A paper calendar or an open notebook is always there in front of my eyes. A digital calendar basically ceases to exist for my brain once closed" (Daniela, Italy); alarms get dismissed unread — "I just hurry to turn it off. With paper, I have it where I can see it all the time" (Lisa, Illinois); the device is a trap — "Digital requires me to turn on a device, and down the rabbit hole I go"; the act of writing helps them stay present and remember.
- **[page read]** Why other readers prefer digital (same article): paper "is liable to get lost"; the phone is always close; shared family calendars; spoken entry to an assistant; "The noise of the reminder draws my attention". A third group uses both: paper for daily tasks, phone for appointments and recurring events.
- **[page read]** Reader quotes from the 1,859-adult survey article: a whiteboard for small lists; a minimal bullet journal ("100%"); "It must be on paper, and I must carry unfinished tasks from one page to the next" — this reader says moving to an online tool contributed to losing a job; sticky notes colour-coded by how long a task takes — [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[page read]** Perfectionism cuts both ways with paper: one reader barely used expensive journals for fear of "ruining" them and does best with "the cheapest possible note pad"; another prefers an undated planner because it removes the stress of "wasting" a skipped week — [ADDitude planners page](https://www.additudemag.com/best-journals-planners-adhd-time-management/)
- **[page read]** Hacker News, thread of 11 Aug 2025 (1,402 points, 799 comments, about a linked essay on ending up with a `.txt` file): a commenter with ADHD says a physical bullet journal "works because of the friction of paper and pen" and mostly solves the accumulating-backlog problem; a diagnosed commenter says the only things that work are "post it notes and calendar alarms" — [HN 44864134](https://news.ycombinator.com/item?id=44864134)
- **[page read]** HN, 23 Jan 2023: one commenter says most of their procrastination comes from not knowing what to do next, so "something like GTD or just a todo.txt-file has been amazing" — [HN 34486848](https://news.ycombinator.com/item?id=34486848). HN, 23 May 2019: a Post-it in front of them naming the current task; a modified bullet journal — [HN 19989627](https://news.ycombinator.com/item?id=19989627)
- **[page read]** CSCW 2026 interviews: "The bullet journal is the only paper tool I can stick to. It gives me peace of mind" (P15); list-writing described as a pleasure in itself regardless of follow-through (P1) — [Chen, Meng, Nie, arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[unverified lead]** r/ADHD comment (14 Aug 2024) calling paid ADHD apps "a bit of a scam" — [via mirror](https://libreddit.0x0c.link/r/ADHD/comments/1ervz6i/what_adhd_apps_do_you_use/li2s1x0). Reddit refused the one fetch attempted.

**Timers, alarms and "pre-timers"**
- **[page read]** ADDitude readers (Dec 2024): "I always set a 'pre-timer' to go off 5 minutes before I need to stop doing something. It helps snap me out of hyperfocus"; "I use 10 highly annoying timers to keep me on my morning routine"; a 15-minute timer per morning interval; alarms rather than calendar events for weekly tasks; a playlist as long as the task, which "helps with guesstimating time and transitioning to the next task" — [ADDitude](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[page read]** Time Timer appears in ADDitude's survey-based list of products readers found most useful in the pandemic (children's list; the text says it also suits adults). The description is editorial. Published 7 Mar 2021 — [ADDitude](https://www.additudemag.com/adhd-tools-pandemic-recommendations/)
- **[page read]** HN: Pomodoro is recommended in the 2019 and 2023 threads; one 2023 commenter lists "Deep house music in headphones" and "Tomato timer" — [HN 19989627](https://news.ycombinator.com/item?id=19989627); [HN 34486848](https://news.ycombinator.com/item?id=34486848)
- **[page read]** Limits, in users' words: "there's no amount of calendar reminders / pomodoros or external triggers that helped beyond the initial novelty" (HN, 2023); reminders help only "when I can complete the task right then and there with little resistance" — a timer for a drink in the freezer works, a reminder for a dreaded task does not (HN, 28 Mar 2025) — [HN 34486848](https://news.ycombinator.com/item?id=34486848); [HN 43416755](https://news.ycombinator.com/item?id=43416755)
- **[page read]** r/ADHD workplace threads: "I miss meetings, though… alarms and pop-up reminders help" — [Jameson et al., Front. Psychol., 15 Jun 2026](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1820248/full)
- **[unverified lead]** Llama Life store reviews; Life Skills Advocate; Substack and Habi pieces on visible timers — not opened.

**Body doubling and borrowed structure**
- **[abstract read]** Eagle, Baltaxe-Admony and Ringland surveyed 220 people; the community "roughly defines it as using the presence of others to start, stay focused on, or accomplish a task"; a body double "can be collocated or remote, recorded or live, known or a stranger"; many did not have a name for it but recognised it as something they had done for years; tasks include studying and working, dishes, cleaning and exercising; motivations include generating momentum and staying on task. ACM TACCESS 17(3), online 4 Oct 2024 — [DOI 10.1145/3689648](https://doi.org/10.1145/3689648); abstract via [Crossref](https://api.crossref.org/works/10.1145/3689648)
- **[unverified lead]** The figures 193 neurodivergent respondents, 75% actively using it, and task counts 86/64/52/35 come from [a secondary summary](https://a11y-paradise.onrender.com/reviews/69cadb89affa4d2e79b788ae); the conflicting effectiveness figures come from blogs. None is in the abstract, and the ACM page could not be opened.
- **[page read]** Two later papers that cite it describe its findings in words, not numbers: body doubling helps people start, continue or complete tasks through companionship, reduced overwhelm and mild social pressure; one warns that for someone anxious about being judged an observer can raise anxiety and lead to avoidance — [arXiv 2509.12153, 15 Sep 2025](https://arxiv.org/abs/2509.12153); [arXiv 2605.07851, 8 May 2026](https://arxiv.org/abs/2605.07851)
- **[page read]** ADDitude readers (Dec 2024): "Body doubling is magic! Twice a week, I do a four-hour Zoom call with a FB group; it's my most productive time"; "I like co-working apps like Focusmate or Groove"; "Setting deadlines for myself does not work, but a deadline set by someone else keeps me accountable" — [ADDitude](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/). A reader on decluttering: a friend coming over to chat "even if they just sit and watch" — [ADDitude, 9 Dec 2024](https://www.additudemag.com/decluttering-home-organization-adhd-apps-tips/)
- **[page read]** CSCW 2026: many participants "borrow" structure through body doubling, shared routines or a friend who phones to get them up; the support is emotional as well as practical, and fragile; a calendar shared with a roommate works where a private one does not — "If it's only me reminding myself, it just becomes invisible after a few days" (P11) — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[page read]** HN mentions are few (3 of 588 comments): FocusMate and co-working spaces; working where one's screen is visible to others — [HN 34486848](https://news.ycombinator.com/item?id=34486848)

**A home for objects**
- **[page read]** ADDitude survey of 1,885 readers: "Finding space where items should 'live' in your home" is a challenge for 42%; managing daily clutter 59%; big decluttering projects 62%. Readers' fixes: "everything having its own designated place"; a basket for anything without a home, emptied weekly; "Just 5 Things"; one drawer at a time. Supports rated out of 5: housekeeping service 3.90; spouse, family or friend 3.06. Reader-recommended low-cost tools include the Sweepy cleaning app and Dubbii body-doubling app (named only). Published 9 Dec 2024 — [ADDitude](https://www.additudemag.com/decluttering-home-organization-adhd-apps-tips/)
- **[page read]** HN, 2025: asked what a to-do app should do, the first reply is that the real problem is putting things away and taking things with you; a Dec 2024 ADDitude reader keeps things "in the place where you use them" — [HN 43416755](https://news.ycombinator.com/item?id=43416755); [ADDitude](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[unverified lead]** r/ADHD keys thread (AirTags, Tile subscription) via mirror; Wondermind; Substack launch-pad piece — not opened.

**Task breakdown**
- **[page read]** An ADDitude reader names Goblin Tools: "The Goblin app has time-management tools that break down tasks and estimate time"; ADDitude lists the mobile apps at $1.99. A survey respondent describes the underlying problem: breaking a big project into small steps and believing the end will come "feels infinitely far away, so I always give up" — [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[page read]** Wanted by a CSCW interviewee ("it helps me break it down into ten small goals", P9) and by an HN commenter listing wishes for a to-do app — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258); [HN 43416755](https://news.ycombinator.com/item?id=43416755)
- **[unverified lead]** Blog claims that Magic ToDo is what "most people with ADHD swear by", and the criticism that the breakdown is lost on closing the tab — competitor and listicle pages, not opened. The App Store listings at $29.99 and $64.99 remain unexplained; ADDitude's $1.99 figure suggests they are not the original.

**Short lists, one thing, and "what I did"**
- **[page read]** "Just show one task at a time to avoid decision fatigue" — one commenter, 17 Jul 2023 — [HN 36745858](https://news.ycombinator.com/item?id=36745858). Same thread: writing the top 3–4 things in a paper notebook each morning, with "No stats". Jan 2023: a list of important things kept to "no more than three items" — [HN 34486848](https://news.ycombinator.com/item?id=34486848). Aug 2025: a simple file with the top priority always at the top — [HN 44864134](https://news.ycombinator.com/item?id=44864134)
- **[page read]** ADDitude readers: "Plan to do a lot less each day"; an "'I-did today' list because what we intend to do is not always what we do. But what we do has value, too"; writing tomorrow's list the night before — [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/). A whiteboard list written the evening before, erased item by item — [ADDitude reader recommendations, 2018, updated 10 Feb 2022](https://www.additudemag.com/adhd-productivity-apps-tools/)
- **[page read]** Ticking the box is itself the reward for some: chore sheets split into daily, weekly and monthly; a to-do list that "literally changed my life with ADHD" — [HN 36745858](https://news.ycombinator.com/item?id=36745858)

**Estimate versus actual time** (previously "not established")
- **[page read]** "Sunsama is very useful for predicting the time it will take to do something, and then tracking how long it actually takes you" — ADDitude reader, 7 Mar 2021 — [ADDitude](https://www.additudemag.com/adhd-tools-pandemic-recommendations/). "Whatever time I think something will take, I multiply it by three, and that's almost accurate" — [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/). Estimating time is a named problem for 31.35% in the same survey. CSCW interviewees describe plans built on rare hyperfocus days, then abandoned with self-blame — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)

**Routines**
- **[page read]** ADDitude readers: clothes laid out the night before; a fixed weekly appointment to sort tasks; batching similar work — [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/). "Sticking with a routine" is a barrier to mental and emotional health for 45% of 1,898 readers — [ADDitude, 16 Dec 2024](https://www.additudemag.com/how-to-improve-mental-health-adhd-apps-tips/). A reader attaches three deep breaths to something already done daily (habit stacking in practice, one quote) — same page.

**Distraction blockers**
- **[page read]** Jan 2023 HN thread: LeechBlock, StayFocusd, Cold Turkey, SelfControl and HN's own "noprocrast" setting; one says noprocrast and LeechBlock "are the only way I stay employed"; one sets an eight-hour weekly news quota with a visible countdown. Counter-report in the same thread: "This worked for a few years, but it stopped" — [HN 34486848](https://news.ycombinator.com/item?id=34486848). Jan 2026: "App blocker - really important" — [HN 46610156](https://news.ycombinator.com/item?id=46610156)
- **[page read]** Forest appears in ADDitude's August 2020 reader list; the description (the tree dies if you leave) is the editors' — [ADDitude, 8 Sep 2020](https://www.additudemag.com/productivity-apps-for-adhd-brains/)

**Music and sound**
- **[page read]** ADDitude readers: instrumental background music; a nature-sounds playlist; audiobooks for boring housework; earbuds to block sensory overstimulation at work — [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/); [ADDitude reader recommendations](https://www.additudemag.com/adhd-productivity-apps-tools/). No source read mentions brown noise.

**Dopamine menu**
- **[page read]** ADDitude's own article confirms the origin: Eric Tivers discussed it with Jessica McCabe in the How to ADHD video "How to Give Your Brain the Stimulation It Needs"; the stated purpose is "to separate the planning from the choosing"; McCabe says it is not a to-do list, a cure, or an alternative to medication or therapy. Reader "appetisers": a bird feeder at the window, hugging the dog, a cold-water blast, singing along. Published 23 Jan 2024, updated 11 Jul 2026 — [ADDitude](https://www.additudemag.com/dopamenu-dopamine-menu-adhd-brain/). The article states the low-dopamine premise as fact; it is a hypothesis.
- **[unverified lead]** Daily Dot, The Conversation and CHADD pieces — The Conversation page was downloaded but not read.

**Other single reader reports worth keeping**
- **[page read]** Location-based reminders (Apple Reminders prompting on arrival); asking a voice assistant to add items because typing them "takes me forever"; photographing scribbled notes so they are not lost; doing the task that brings the most relief first — [ADDitude reader recommendations](https://www.additudemag.com/adhd-productivity-apps-tools/); [ADDitude, Dec 2024](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)

**Honest counter-signal**
- **[page read]** "The reality is that there is no single thing that will help. You'll have to try shit and see what works for you" (HN, Jan 2026); "a to-do app will not help" — scores and deadlines become distractions needing decisions (HN, Mar 2025); a to-do list "just catalogues" nearly finished projects until it has to be avoided (same thread); rewards and timers were ineffective for CSCW interviewees unless the task had perceived value — [HN 46610156](https://news.ycombinator.com/item?id=46610156); [HN 43416755](https://news.ycombinator.com/item?id=43416755); [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[unverified lead]** Five-minute rule, "leave the frog for last", brain dump on NHS and vendor pages, spoon theory pages — not opened in this pass.

### Inferences

**Revised ranking of praised techniques.** Ranked by how many *independent kinds of opened source* carry first-person praise (reader survey, published Reddit analysis, published interview study, forum thread). It is not a head count, it is not efficacy, and the sources skew to ADDitude's readership (older, largely US) and to Hacker News (technical).

| Rank | Technique | Basis now (all page read unless marked) | Change |
|---|---|---|---|
| 1 | Writing it down where it stays visible: paper, sticky notes, whiteboard, bullet journal, one text file | ADDitude 61% figure and two sets of reader quotes; Reddit analysis examples; HN 2019, 2023, 2025; CSCW interview | Up from 2. The only item with a survey percentage and four kinds of source |
| 2 | Borrowed structure: body doubling, a friend or spouse, a deadline set by someone else | Eagle abstract (n=220); ADDitude readers; CSCW interviews; social support at 16–18% of Reddit strategy posts; "family member, spouse, friend" tops ADDitude's "extremely helpful" list at 5.6% | Down from 1 only because the 75% figure is unverified. Still strong |
| 3 | Timers and alarms, especially a warning before the end and timers that pace a routine | ADDitude readers; HN; Reddit workplace study | Same rank, firmer basis. Note the reported limit: they fade with novelty and do not move a dreaded task |
| 4 | A home for every object | ADDitude survey of 1,885 (42% find it hard) plus reader fixes; HN | Up from 7 |
| 5 | Short list / plan less / one thing at a time / an "I did" list | HN (several threads); ADDitude readers | Same |
| 6 | Routines and doing things the night before | ADDitude readers; Reddit "environmental structuring" ~10–11%; but 45% say sticking to a routine is the barrier | New as a ranked item |
| 7 | Distraction blockers | HN 2023 and 2026, with one "stopped working" report | Down one |
| 8 | Task breakdown into small steps | One ADDitude reader naming Goblin; one interviewee and one HN commenter wanting it | Down from 4: the popularity claims were all competitor blogs and remain unverified |
| 9 | Estimate versus actual time | Two ADDitude reader quotes; named as a problem by 31% | New; was "not established" |
| 10 | Music and sound | ADDitude readers; HN | New; was "not established" |
| 11 | Dopamine menu | ADDitude article with reader examples; no account of it changing anything | Same |
| — | Five-minute start, brain dump as a named technique, energy or spoon tracking for ADHD alone, task randomisers, now/next/later, brown noise, medication reminders, shared household lists | Advice or vendor pages only, not opened; or a single app name in a list | Not established |

- Lifestyle (sleep, exercise) and medication outrank every tool in both the Reddit analysis and the HN tally. They are outside this file's scope but any honest account of "what people say helps" has to say so.
- The paper signal is specific about *why*: it stays in view without being opened, it cannot be dismissed like an alert, it does not lead into the phone, and it needs no setup. The digital side's reasons are equally specific: always carried, cannot be lost, shared, and it makes a noise.

**Can it work fully offline on a phone, with no account, no server and no cloud AI?** My own technical assessment, not sourced.

| Technique | Offline, no account, no AI? |
|---|---|
| Visible list, top three, one-task view, "I did" list | Yes. What an app cannot copy from paper is being in view while the phone is locked or in a pocket |
| Timers, pre-timer warning, routine pacing | Yes while the app is open. A warning that must fire with the app closed depends on notifications, which a no-server web app cannot do reliably and which Adnotia's roadmap excludes |
| Home-for-objects list, leaving-the-house checklist | Yes |
| Manual task breakdown, templates | Yes |
| Automatic breakdown as Goblin Tools does it | No — cloud language model |
| Estimate versus actual time | Yes |
| Routines and checklists, dopamine menu | Yes |
| Body doubling with a real person | No — inherently in person or networked. An app can only describe it |
| Shared calendars and household lists | No without sync |
| Distraction blockers | No — needs operating-system permissions |
| Location-based reminders, voice-assistant capture | No — operating-system services |
| Music or generated noise | Technically yes if synthesised on the device; Adnotia's roadmap excludes audio |

### Gaps
- **Reddit in users' own words** remains unread; the two published analyses give categories and a few quotations, not threads.
- **Eagle et al. numbers** unverified (see top section).
- **The 1,342 figure** could not be found anywhere.
- ADDitude gives no sample size, date or method for the 61% survey, and no survey on body doubling, on timers specifically, on reminders, or on medication reminders was found. Its site search is poor, so absence is weak evidence.
- No first-person source read covers task randomisers, now/next/later or brown noise.

## Which apps are most often recommended by ADHD users, and what specific feature is the reason?

### Takeaway
There is still no defensible frequency ranking. What was read supports feature-level reasons only, and the lists that exist (ADDitude's) are editor-described and partly stale. Where a reader gives a reason it is nearly always one concrete behaviour: it will not let me forget, it shows the day, it is shared with my family, it breaks the task down.

### Cited Findings
- **[page read]** ADDitude's August 2020 reader-survey list (23 apps, editors' one-line descriptions, no counts): focus — Due, Forest, focus@will, Be Focused, Badgerton; project — Trello, Notion, OneNote, Evernote; daily organisation — Google Assistant, Todoist, Microsoft To Do, Google Keep, TimeTree, Done, AnyList, Any.do, Habitica, CrusherTV; plus five finance apps. Published 8 Sep 2020; prices last checked 27 Jan 2022, so prices and availability may be out of date — [ADDitude](https://www.additudemag.com/productivity-apps-for-adhd-brains/)
- **[page read]** Reader reasons, Dec 2024: Todoist "doesn't let me forget anything"; Dynalist "for all sorts of notes and lists"; FlowSavvy after "multiple planner apps" for colour coding and ordering tasks; AnyList for its layout; Focusmate or Groove for co-working; Goblin for breakdown and time estimates — [ADDitude](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[page read]** Reader reasons, 2018 article updated Feb 2022: Trello for standing day-of-week cards and shared family boards; Cozi for colour-coded shared calendars and a shared grocery list; Apple Reminders for location prompts; Wunderlist for shared lists (researcher's note, not from the page: I believe that product has since been discontinued) — [ADDitude](https://www.additudemag.com/adhd-productivity-apps-tools/)
- **[page read]** Sunsama for estimate-versus-actual, Mar 2021 — [ADDitude](https://www.additudemag.com/adhd-tools-pandemic-recommendations/). Finch is in a Dec 2024 reader-recommended self-care list, described by editors as a virtual pet nurtured by completing self-care tasks — [ADDitude](https://www.additudemag.com/how-to-improve-mental-health-adhd-apps-tips/)
- **[page read]** Todoist on HN: three commenters across 2017 and 2026, two calling it life-changing; one adds that org-mode failed them because capture and viewing away from the laptop "had too much friction" — [HN 46610156](https://news.ycombinator.com/item?id=46610156). In the Aug 2025 thread a user keeps Todoist but ignores points, projects and labels, using it like a text file with recurring tasks — [HN 44864134](https://news.ycombinator.com/item?id=44864134)
- **[unverified lead]** Everything in the first version about Tiimo (App of the Year, prices, the October 2024 redesign reviews, the feedback-board post), Structured, Llama Life, Amazing Marvin, Goblin Tools store prices, Finch's newsletter praise, Notion's setup complaint, Inflow's 2022 study and Psych Central — app-store, aggregator, vendor and competitor pages were not opened in this pass.

### Inferences
- Shared family calendars and lists recur in ADDitude's reader quotes (Trello, Cozi, TimeTree, AnyList, Wunderlist) more than any focus feature. That is the same "other people" signal as body doubling, and it is exactly what an offline single-device app cannot do.
- The reasons readers give are small and concrete. None praises an app for being comprehensive.

### Gaps
- No ranking is possible. No store review was read directly.
- Nothing read for Routinery, TickTick, Numo, Brili, Bearable, Daylio, Structured or Amazing Marvin.

## What do ADHD users say makes them quit an app?

### Takeaway
On opened sources, the best-evidenced reasons are that the tool stops being noticed once it is no longer new, that setup and upkeep are themselves work, and that returning means facing a pile. Cost, notification load and sync were not evidenced in anything read; cost in particular rests entirely on unopened pages.

### Cited Findings
1. **It fades: novelty goes, the tool becomes invisible.**
   - **[page read]** "If it's only me reminding myself, it just becomes invisible after a few days" (P11); without reinforcement "tools faded into digital clutter" — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
   - **[page read]** Nothing "helped beyond the initial novelty"; a blocker "worked for a few years, but it stopped" — [HN 34486848](https://news.ycombinator.com/item?id=34486848). "I haven't opened my Todoist pinned tab in two weeks" after tasks kept accumulating — [HN 36745858](https://news.ycombinator.com/item?id=36745858). A "graveyard of pen and paper notebooks, todo apps, reminder thingies, post-its" — [HN 46610156](https://news.ycombinator.com/item?id=46610156)
   - **[page read]** Usage data from a public ADHD psychoeducation app: over 18,000 downloads, about 12,000 active users, about 6,400 returned after first use, 2.4 engaged sessions per user on average, engagement peaking in the first two weeks (Nov 2022–Oct 2023) — [Seery et al., Internet Interventions, 4 Feb 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847728/)
   - **[page read]** Paper is not immune: a planner works "when I remember to use it"; "If I get out of habit, I get way out of sync" — [ADDitude planners page](https://www.additudemag.com/best-journals-planners-adhd-time-management/)
2. **Setup, complexity and upkeep.**
   - **[page read]** "Many apps are too complicated to set up, and I feel more anxious using them" (P4); "I sometimes spend more time organizing the to-do app than doing the task" (P9); participants criticised tools needing too many steps, rigid structures or cluttered interfaces — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
   - **[page read]** A note system must have "exaggerated simplicity so that I don't end up turning the note solution into its own project that's abandoned or exchanged in a year" — [HN 46610156](https://news.ycombinator.com/item?id=46610156). Scores, deadlines and difficulty fields "will turn into distractions themselves" — [HN 43416755](https://news.ycombinator.com/item?id=43416755)
   - **[page read]** Seery interviewees: not knowing where to start, too many pages, getting "lost in the app"; to use it one "would have had to have been in the space of having high levels of dopamine" — [Seery et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847728/)
   - **[page read]** A planner with open, unlabelled boxes left one reader overwhelmed — "the reason bullet journaling never worked for me" — [ADDitude planners page](https://www.additudemag.com/best-journals-planners-adhd-time-management/)
3. **The backlog and what greets you on return.**
   - **[page read]** A commenter with ADHD says few products "are even acknowledging the backlog problem" — [HN 44864134](https://news.ycombinator.com/item?id=44864134). A to-do list catalogues unfinished things "until they become cognitively crushing to think about resulting in a need to escape/avoid the list" — [HN 43416755](https://news.ycombinator.com/item?id=43416755)
   - **[page read]** A follow-up participant found a "mild haze" image "more comforting than red overdue tasks"; several contrasted it with overdue lists. Plans written with enthusiasm then abandoned lead to "cycles of disappointment and self-blame" — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
   - **[unverified lead]** The "two-week death spiral" (chudi.dev) and the Product Hunt "day 40" account — one downloaded but not read, one refused.
4. **Alerts get dismissed, or are too many.**
   - **[page read]** "I constantly close the push notifications before I read them"; "I just hurry to turn it off" — [ADDitude, "Paper or Digital?"](https://www.additudemag.com/best-planners-adhd-brains-paper-digital/). The reverse also appears: some readers and interviewees rely on and ask for reminders.
   - **[page read]** Autistic users of a stress app: four prompts a day overwhelmed some, who left questionnaires uncompleted; a rigid 60-minute answer window and weekly password logins were "stress-inducing"; repeated tips led to disengagement — [Hoeberichts et al., Front. Psychiatry, 21 Aug 2025](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1637008/full)
5. **It was the wrong kind of help.**
   - **[page read]** "I don't want an ADHD todo list app. I want something that to help manage my emotions while completing tasks" — excitement, boredom and anxiety; if those were handled, "any todo list app (or just a notebook) will be fine" — [HN 43416755](https://news.ycombinator.com/item?id=43416755)
6. **Capture is too slow away from the desk** — [HN 46610156](https://news.ycombinator.com/item?id=46610156) **[page read]**
7. **[unverified lead] Cost and subscriptions; a relied-on feature changed (Tiimo, Oct 2024); app sprawl; sync.** All from mirrors, aggregators, vendor blogs or essays not opened. Nothing read mentions price as a reason for leaving. Nothing at all was found on sync.

### Inferences
**Revised ranking of quit reasons**, by independent kinds of opened source carrying a first-person statement:

| Rank | Reason | Basis | Change |
|---|---|---|---|
| 1 | Fades with novelty / becomes invisible | Interview study, three HN threads, app analytics, ADDitude readers | Same |
| 2 | Setup, complexity, upkeep | Two interview studies, two HN threads, ADDitude reader | Up from 3 |
| 3 | Backlog and the return (overdue pile, self-blame) | HN ×2, interview study incl. a direct statement on red overdue tasks | Was "missed day, guilt"; the guilt-after-a-streak version rests on unopened pages, the backlog version is now read |
| 4 | Alerts dismissed or overwhelming | ADDitude readers; autistic-adult study | Same rank, now first-person |
| 5 | Wrong kind of help (emotional, not organisational) | One long HN account; CSCW themes | New |
| 6 | Slow capture | One HN account | New |
| ? | Cost; feature removed; app sprawl; sync | Unverified leads only | Cost falls from 4 to unranked |

- Reasons 1 and 3 remain two views of one event. An app cannot stop novelty fading; it decides what a person meets on return, and the one direct statement read says a red overdue list is the wrong thing to meet.
- The fade happens to paper too. What differs is that paper left on a desk is still seen.

### Gaps
- Cost, sync and removed features need the Reddit threads and store reviews this pass could not open.
- No published thematic analysis of ADHD app-store reviews was found.
- The Widnall et al. JMIR mood-app review study cited in the first version was not re-opened.

## What do users say about streaks and gamification specifically?

### Takeaway
Still split, and the opened sources widen the split rather than close it: some adults with ADHD ask for streaks, badges and reminders to keep them coming back, others say rewards do nothing for them, and a "gentle streak" with a baseline goal was well received in one design study. No ADHD-specific study of streak harm was found; the accounts of harm in the first version all sit on pages that could not be opened.

### Cited Findings
- **[page read] Some ask for it.** Seery interviewees suggested lessons unlocked a step at a time, and "Rewards, badges or streaks for engaging with mindfulness practices or reading psychoeducation content were also noted as ways to improve engagement", alongside reminders; several said the app lacked a "dopamine hit" — [Seery et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847728/)
- **[page read] Some say rewards are inert.** A commenter with ADHD and anhedonia: rewards do not work "because I don't look forward to anything, and punishments do not work because I do not care"; another: the prospect of a reward afterwards "doesn't motivate me" if the task itself is not enjoyable — [HN 36745858](https://news.ycombinator.com/item?id=36745858). CSCW interviewees: rewards and timers ineffective unless the task had perceived value — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[page read] The tick itself is enough for some**, and one commenter credits re-forming a tooth-brushing habit to a run of ticked boxes — [HN 36745858](https://news.ycombinator.com/item?id=36745858). A whiteboard reader: wiping items off "gives me that quick little dopamine hit" — [ADDitude](https://www.additudemag.com/adhd-productivity-apps-tools/)
- **[page read] A forgiving variant tested with users.** "Flexible Planning and Gentle Streaks" with an "ideal" and a "baseline" goal: one participant said it stopped them "hating themselves for not completing everything"; some warned that too much flexibility could be demotivating. An undo button eased anxiety for one and worried others as enabling procrastination. Shared planning with a trusted person divided participants: gentle accountability for some, intrusive for others — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[page read] Habitica and Done** are in ADDitude's 2020 reader list; the editors describe Habitica as "rewards and punishments and a social network for motivation" and Done as "motivating you with streaks and chains". An HN commenter argues ADHD apps must be fun with "basically infinite" content, citing Habitica — [ADDitude](https://www.additudemag.com/productivity-apps-for-adhd-brains/); [HN 43416755](https://news.ycombinator.com/item?id=43416755)
- **[page read] No ADDitude article on streak guilt was found**; its site search for "habit tracker streak" returned nothing.
- **[unverified lead]** Finch's "Understanding Streaks" help page (refused, 403); the Product Hunt discussion (403); the 47-day gaming anecdote; Habitica penalty descriptions from a competitor; the r/finch exchange via mirror; Mobbin; Indie Hackers; the Psychology Today lab finding. How Finch's streak works therefore remains as the first version described it, **unverified**.

### Inferences
- The earlier inference stands and is better supported: what people say works is obligation to another person; what is described as inert or harmful is a number about oneself. Add a third group the first version missed: people who want the app to pull them back and name streaks as one way.
- The best-received forgiving design keeps a floor ("baseline") and an aim ("ideal"), so a poor day still counts as something. That is describable without a streak at all.
- For Adnotia this does not weaken the hard rule against streaks; it does mean the rule cannot be presented as what users uniformly want. A minority ask for exactly what the rule forbids.

### Gaps
- No ADHD-specific study of streaks. Nothing first-hand on Forest's dying tree, Duolingo or Habitica penalties.
- Finch's current behaviour unverified.

## What do users say they want that no app does well?

### Takeaway
Stated in opened sources: less setup and fewer features; fast capture anywhere; a view that does not confront them with a red backlog; support that adapts to a bad day; and help with the feeling that blocks the task. "One place for tasks that feeds planning, breakdown and timers" is **not stated by any user in anything read** and remains the researcher's synthesis; the one source cited for "one place" turned out to be about information.

### Cited Findings
- **[page read] Low-friction capture, everywhere.** "I need two things: ubiquity, so that I can add ideas, todos, etc. wherever I am; and exaggerated simplicity" — [HN 46610156](https://news.ycombinator.com/item?id=46610156). Speaking items to an assistant; photographing notes — [ADDitude](https://www.additudemag.com/adhd-productivity-apps-tools/). A commenter built a text-file app whose one extra feature puts a marked line on the lock screen, to keep it "a bit closer to awareness without overwhelming" — [HN 44864134](https://news.ycombinator.com/item?id=44864134). This fills the first version's gap on capture.
- **[page read] Less setup; the system should come to me.** "I hope the system comes to me instead of me opening it" (P14) — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[page read] Show one thing.** One HN commenter (2023) says it outright; the 2025 thread's author describes relief from sorting by importance and starting at the top — [HN 36745858](https://news.ycombinator.com/item?id=36745858); [HN 43416755](https://news.ycombinator.com/item?id=43416755). Still thin: one explicit statement.
- **[page read] A way back in / a softer view of what is undone.** Preference for a calm state image over "red overdue tasks"; a baseline goal for bad days; "pause days" that frame rest as care; a non-judgmental reflection after abandoning a task appealed to some and worried others — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258). An "I did" list as the reader-made version — [ADDitude](https://www.additudemag.com/punctuality-time-blindness-adhd-apps-tips/)
- **[page read] Help in the moment of struggle, not a library.** Experienced users of the Irish app wanted something for "when I really like I'm really struggling with something"; short mindfulness breaks were what they named — [Seery et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847728/)
- **[page read] Help with the emotion, not the list** — [HN 43416755](https://news.ycombinator.com/item?id=43416755); "How much do you think you can accomplish today?" as a daily question one interviewee wanted to be asked — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[page read] Two lists: have-to and want-to**; flexible prioritising; visible progress; breakdown; time-blocking — individual wishes in [HN 43416755](https://news.ycombinator.com/item?id=43416755)
- **[page read] User control over any nudging.** Across thirteen concepts, participants wanted to configure nudges, adjust cue strength and opt in or out; subtle ambient transition cues were "too subtle to notice"; surveillance-like sharing met resistance — [arXiv 2603.17258](https://arxiv.org/abs/2603.17258)
- **[page read] "One place" — what the sources actually say.** Seery's "one-stop shop" is about trustworthy information. Sunsama is praised by ADDitude's *editors* for pulling tasks from other platforms into one calendar; the reader's own praise is about time estimates. An Evernote-plus-notebook user wants scans in one tagged place — [Seery et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11847728/); [ADDitude](https://www.additudemag.com/adhd-tools-pandemic-recommendations/); [ADDitude planners](https://www.additudemag.com/best-journals-planners-adhd-time-management/)
- **[unverified lead]** masukomi's "adjustable foundation" essay, chudi.dev, the single-task App Store listings and the Llama Life and Tiimo review requests for spoken or timed warnings — not opened or not read.

### Inferences
- "One place for tasks that feeds planning, breakdown and timers": **still the researcher's synthesis, now with its one supposed support removed.** Present it as a design hypothesis, not a user demand. The nearest user statements are about one place to *capture* and about not maintaining several tools.
- "A way back in after a lapse" has moved from one unread essay to direct, read statements about overdue lists and baseline goals. What users describe is not a restart ritual but the absence of an accusation.
- "Show me one thing" remains plausible and cheap but rests on one explicit comment.
- Low-friction capture is now the best-evidenced unmet want, and it is the one an installable web app is weakest at: lock-screen and voice entry are operating-system features.

### Gaps
- No Reddit "what I wish existed" thread read.
- The CSCW sample was recruited by authors at Tsinghua University; the passages read do not state participants' country, and the concepts were AI-centred, so preferences were expressed about speculative AI features, not existing apps.

## Autistic and AuDHD adults: which tools are praised, and where do autistic needs conflict with common ADHD-app patterns?

### Takeaway
Two studies were read in full and both hold up: small interface changes measurably lowered usability and comfort for autistic adults, and a predictable, emotionally neutral app was valued — though the same app's rigidity (fixed prompts, a fixed answer window) drove some users away. Neither study included people with ADHD, so the AuDHD conflict itself still rests on unopened first-person essays.

### Cited Findings
- **[page read] Interface change (Sawyer and Palaniappan, University of Kent).** Autistic n=11 (two responses incomplete), control n=10; adults 18+, recruited through the university's student support service and campus posters; online questionnaire on a PC; an e-calendar appointment form changed seven times in sequence (colour scheme, font face, text wording, button height, button width, button order, layout). People with other neurodevelopmental conditions "(e.g. ADHD)" were excluded. Significant for the autistic group: colour scheme (p=0.0287), font face (p=0.0365), text wording (p=0.0209 usability, p=0.0289 comfort), button order (p=0.0272); wording also affected controls. Autistic participants reacted to a font change they could not identify ("something doesn't feel right"); one abandoned the study after a wording change ("one change of words can often throw me"); one described "pointless change". They reacted *positively* to a larger send button. Heuristics: keep the colour scheme, keep the font, keep wording unless function changes, keep element order. The authors found no earlier empirical work on autistic adults and interface change, note animation changes were not tested, and that the sample is small and probably limited to those needing least support. IEEE VL/HCC 2025, published 25 Dec 2025 — [Kent Academic Repository](https://kar.kent.ac.uk/110913/)
- **[page read] Predictable, neutral design (Stress Autism Mate).** Ten autistic participants aged 17–63, in outpatient treatment in the Netherlands, interviewed Nov 2021–Mar 2022 after at least four weeks' use. The app prompts four times a day with structured questions and shows colour-coded diagrams. Participants called it "clear and honest" and its suggestions easier to accept than those from "someone with emotion"; "It's easier when something just tells me what to do"; the rhythm "gives me discipline". Limits: prompt frequency overwhelmed some ("three times a day would also be enough"); the 60-minute window and weekly password login were stressful; repeated tips and no personalisation led to disengagement; one found it "impersonal". Two stopped because they felt they had learned the skill, two because it did not fit. Published 21 Aug 2025 — [Hoeberichts et al., Frontiers in Psychiatry](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1637008/full)
- **[abstract read] Body doubling** was surveyed in a mostly neurodivergent sample; a later paper describes that sample as including people with ADHD, autism, OCD and other conditions — [Eagle et al.](https://doi.org/10.1145/3689648); [arXiv 2605.07851](https://arxiv.org/abs/2605.07851)
- **[page read] Time Timer** is described by ADDitude's editors as smoothing transitions for people with ADHD and autism (editorial, not a user report) — [ADDitude](https://www.additudemag.com/adhd-tools-pandemic-recommendations/)
- **[listed, not opened]** Europe PMC's search lists these; only the titles were seen: a qualitative study of late diagnosis of autism and/or ADHD (Autism in Adulthood, 2026, PMC13294709); "Working sustainably with ADHD or autism" (Scand J Occup Ther, 2023); a mixed-methods study of employment-related assistive technology needs in autistic adults (2025, PMC12468683); and a 2026 PsyArXiv preprint on energy and work functioning among autistic and ADHD employees using Brain in Hand. These are the best next reads.
- **[unverified lead]** Everything else in the first version: spoon theory and energy accounting pages (Neurodivergent Insights, ADDA, The Mighty, AANE), the Discord forum post, Ministry of Testing, the sensory-friendly design blog, the offline "Spoons" tracker listing, Tiimo and Lifestack, and all AuDHD first-person essays and the podcast ("anchors, not schedules"; green/amber/red days). None was opened in this pass.

### Inferences
| ADHD-app pattern | Why it is there | Autistic conflict | Evidence status |
|---|---|---|---|
| Frequent redesigns, rotating content | Counters novelty fading | Colour, font, wording and order changes each lowered usability or comfort | Read (Kent) |
| Playful, warm, mascot tone | Reduces shame | Neutral, "honest" tone valued | Read (SAM), n=10 |
| Frequent prompts and nudges | Externalise time | Four a day overwhelmed some; a fixed answer window was stressful | Read (SAM) |
| Celebration effects | Reward | Sensory load | Unverified (design blog) |
| Self-rearranging plans | Uneven attention | Unrequested change | Inferred from Kent; not tested |

- Predictability is not the same as rigidity. The SAM users valued a stable look and tone and objected to fixed *timing* and repetition. A fixed frame with adjustable frequency fits both findings.
- Not every change is unwelcome: the Kent participants liked an inconsistency that made the main button stand out. The cost is in change without a functional reason.
- The Kent wording result matters for any app that revises its copy: renaming a control stressed autistic participants more than restyling it.
- An interface that keeps its layout, colours and wording, has no animation by default and makes no sound is consistent with both studies. Whether it costs ADHD users anything is not answered by a source: no one read asked for the interface itself to keep changing, but some did ask for novelty and reward.
- Energy logging remains offline-compatible; interpreting the log would cross Adnotia's scope line on detecting risk. That is a project constraint, not a finding.

### Gaps
- **AuDHD specifically:** no study read includes people with both; Kent excluded ADHD. The conflict table is an inference across separate populations.
- **Nothing read** on visual schedules, transition warnings, shutdown or meltdown plans, communication cards, or sensory tracking as praised by autistic adults. Energy accounting and spoon theory remain community-page leads.
- No autistic community thread was read. r/AutisticWithADHD and r/AuDHDWomen were not attempted.
- Both studies are small (11 and 10), one from a single university and one from clinics in one country.
