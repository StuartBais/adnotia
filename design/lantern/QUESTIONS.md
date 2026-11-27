# Questions for the owner

This is every question the prototype at `/bench/` leaves for you, in one place and in plain words. Each one says what the prototype does now and where to see it, so you can try it before you answer. The days the questions need are set up from Me › About this prototype, under "Prototype". "Load the example day" puts the board's day around the current time, with "Write the school email" running at step 2 of 3 and "Call the dentist" next, and the other buttons load the other days the board draws. Nothing here holds the build up: it went ahead on the defaults listed near the end, and each can be changed. Answer by number, in a word where a word will do. The one the rest hang on is 43: whether to confirm ADR-047, the direction itself.

## Behaviour

**1. The rest of today moving by itself after Undo.**

- **Now:** when nothing is running, Today shows the rest of the day half open. A quick tap that can be undone (Done, Set aside, or Save from capture) folds it down to its one Next line, to show Undo there for six seconds. When the six seconds end, it rises again with nobody touching it. SPEC 10 says motion never runs on its own. Over the open drawer, Save's Undo sits on the Hide band at its foot instead, and the drawer stays open.
- **See it:** "Load: not started yet", then capture, type anything and Save. Or "Load the example day", then Pause, then Set aside.
- **Question:** is the rise acceptable? If not, where should Undo go on Today when nothing runs? And over the open drawer, keep Undo on the Hide band, or fold the drawer for six seconds and raise it again?

**2. A second tap that comes too soon.**

- **Now:** a second quick tap acts on whatever is under the finger by then. From step 2 of 3, two quick taps on Step done mark both steps done and finish the task, and Undo takes back only the second. Two quick taps on Pause pause and then resume. A tap where the Undo pill was, just after it goes, opens the rest of today. With motion on, Step done and Pause also take a tap in the moment after Start, before they have faded in.
- **See it:** "Load the example day", then tap Step done twice, quickly.
- **Question:** should Step done, Done, Pause and Resume ignore a repeat tap for about a second after they act, and the Next line ignore a tap for a moment after Undo leaves it? Should Step done and Pause ignore taps until they can be seen?

**3. A tap on the drawer while it is still moving.**

- **Now:** a tap on the rest of today while it springs into place stops it there and acts, so a tap on a row opens that row. An iPhone list that is tapped while moving just stops.
- **See it:** pull the handle up, let go, and tap a row before it settles.
- **Question:** keep this, or have that tap only stop the drawer?

**4. The day turning at 04:00 with the app open.**

- **Now:** the day runs from 04:00 to 04:00. If a clock is running at 04:00 while the app is open, it keeps running into the new day, and the task moves to Anytime today (not the inbox). At the same moment an open rest of today folds by itself, and with motion on the capsule springs back into the lantern with nobody touching the phone. A paused Focus fades away. Coming back after 04:00 from time away is different: the clock closes within its own day.
- **See it:** only near 04:00. "Load the example day" after 03:50, open the rest of today, and keep the phone in your hand past 04:00.
- **Question:** is a clock that keeps running right, and is Anytime today the right list for it? Should the screen stay as it is until your next touch, or at least change without moving?

**5. Done on the last step in Focus.**

- **Now:** Focus closes at once, and Undo appears on Today's Next line.
- **See it:** "Load the example day", tap the step to open Focus, then Step done, then Done.
- **Question:** keep that, or stay in Focus for six seconds with Undo at its foot, as SPEC 5.4's wording suggests?

**6. The screen staying awake while Focus is paused.**

- **Now:** the screen stays on whenever Focus is open, paused or not.
- **See it:** open Focus, Pause, and wait past the phone's auto-lock time.
- **Question:** keep it on while paused, or only while the clock runs?

**7. Where Focus's way out returns to.**

- **Now:** "⌄ Today" from a Focus opened from the open drawer's capsule returns to Today with the drawer folded, not open. And Me opened from Focus takes Focus away: going back from Me lands on the tab underneath, with the capsule one tap away, not on Focus.
- **See it:** open the rest of today, tap its capsule, then "⌄ Today". Or open Focus, tap Me, then swipe back.
- **Question:** should "⌄ Today" return to the open drawer? Should back from Me return to Focus?

**8. Coming back to an open drawer after 15 minutes or more.**

- **Now:** a drawer left open comes back open over Today, so the screen opens on the rest of today rather than the lantern, although the rule says "open on Today".
- **See it:** open the rest of today, lock the phone for 20 minutes, and come back.
- **Question:** should the drawer fold on that return, or keep its place for the day, as built?

**9. Capture.**

- **Now:** Save on an empty field does nothing and says nothing; Save looks the same either way. When the keyboard is put away with Done above the keys, the sheet stays where the keyboard was, with stone below it, rather than dropping to the foot.
- **See it:** capture, then Save with nothing typed. Then type, and tap Done above the keys.
- **Question:** should Save look disabled until something is typed? Is the sheet staying up right?

**10. Adding a step to the running task.**

- **Now:** the running task's own page (board page 8) shows its steps and its note, and, as drawn, no "+ Add a step". So a running task with no steps cannot gain one there.
- **See it:** Tasks › Inbox › Fix the bike light › Start this instead. Its page turns charcoal, with no "+ Add a step".
- **Question:** should that page offer "+ Add a step" under the note?

**11. Delete has no Undo.**

- **Now:** SPEC 9.8 gives Delete no six seconds of Undo, so its confirm says "There is no Undo for this."
- **See it:** Tasks › any task › ⋯ › Delete.
- **Question:** should Delete get an Undo like the other quick taps?

**12. Booking a time late at night.**

- **Now:** between 00:00 and 04:00 it is still yesterday's day, so "Today at a time" books a time on yesterday's date, which has already passed. After about 23:25 no :00 or :30 is left, so it picks one that has passed. Either way the task moves quietly to Anytime today at the next minute.
- **See it:** only late at night. Tasks › a task › When › Today at a time.
- **Question:** after midnight, should it book the next calendar date, refuse, or offer no time? After 23:25, should it pick the next 5 minutes, or offer no time?

**13. "Pick a day" waits for a day.**

- **Now:** SPEC 12 says each choice in the when sheet takes effect at once, but "Pick a day" opens an empty day field and leaves the task as it was until a day is set. That keeps to SPEC 13: nothing the app times by itself.
- **See it:** Tasks › Inbox › any item › When › Pick a day, then close without picking.
- **Question:** is waiting for the day right?

**14. Pulling the open drawer down.**

- **Now:** it can be pulled down from its grabber, its header row ("Rest of today" beside Me) and the Hide band at its foot. A 120 point flick on the Hide band carries it to half on Today with nothing running.
- **See it:** "Load: not started yet", open the rest of today, and pull from each place.
- **Question:** are the header row and the Hide band natural places to pull from?

## Words

**15. The crisis page.**

- **Now:** its lines and dates match the app's own page. Its order is: the emergency number, the note under it, then "Adnotia cannot help in a crisis". The app's page says that first. The prototype leaves out the app's paragraph "Somewhere else, or none of these fit", with its link to findahelpline.com, so someone outside the five regions has only the emergency number. The Next line at its foot still counts down ("Next · in 25 min"), though SPEC 12 says the page shows no timer of any kind.
- **See it:** "Load the example day", then Me › If things are bad right now.
- **Question:** should the page carry the "Somewhere else" paragraph and its link, in the app's order? (The link takes the person to another site; the prototype still fetches nothing.) Does the countdown on the Next line count as a timer there?

**16. "Timer stopped" and the capsule.**

- **Now:** with Settings › "A session the app closed reads" set to Timer stopped, Today says "Timer stopped", but the capsule says "Paused", because the longer words do not fit it.
- **See it:** set Timer stopped, then "Load: a clock left running", then open Tasks.
- **Question:** is "Paused" in the capsule acceptable, or should the capsule say something else?

**17. Paused Focus cutting the task's name.**

- **Now:** on a 390 point phone, paused Focus's top line reads "Focus · Paused · Write the schoo… · step 2 of 3".
- **See it:** "Load the example day", open Focus, then Pause.
- **Question:** is the cut acceptable, or should "Paused" take Focus's place on that line, as it takes Now's place on paused Today, so the name fits whole?

**18. Saving to today's list.**

- **Now:** after Save with Today chosen, the Next line says "Saved to today's list", and Undo reads "Undo: remove … from today's list". SPEC 5.5 does not draw this.
- **See it:** capture, choose Today, type anything, Save.
- **Question:** are those the right words?

**19. Medication and Family named under "Left out".**

- **Now:** About says "Medication and Family are not in the prototype." SPEC 12 says those words appear nowhere for someone who has not turned them on.
- **See it:** Me › About this prototype › Left out.
- **Question:** keep the line on the prototype's own About page, or drop the names?

**20. Routines while running one is left out.**

- **Now:** Routines' helper line is SPEC's "Open a routine to start it.", though this round cannot start one. A routine's page says "Running a routine is not in this prototype." and then "In the app, a routine starts from its own page", which reads oddly on that very page.
- **See it:** Routines › Leaving the house.
- **Question:** keep SPEC's helper line or change it for now? On the page, say something like "In the app, this page has a Start", or carry only "Running a routine is not in this prototype."?

**21. The Library's second lines.**

- **Now:** each of the five Library rows has a proposed second line under its name.
- **See it:** the Library tab.
- **Question:** keep the lines, or show names alone until there is something behind them?

**22. Words SPEC does not give.**

- **Now:** some states the board does not draw are worded by the build: the running task's page repeats some words, Focus's top line for a task with no steps, and how hours are said aloud against how they are drawn. Separately, an unopened task's page does not show its note, because the board's page 3a has none; the note is reached from ⋯.
- **See it:** Tasks › Inbox › Ask about the boiler quote, which has a note.
- **Question:** do you want to word these, or leave them to the build? Should an unopened task's page show its note?

## The look, and how things move

**23. Safari's own text size.**

- **Now:** Safari's page zoom (the "aA" menu) breaks Today from 150%. At 150%, Step done is 8 points wide. At 200%, Pause is half off the left edge, the step is drawn over the date and cannot be scrolled to, the Tasks switcher's Done is off the screen, and capture's Save is pushed below its sheet. The plan leaves larger-text layouts out of this round, but this is Safari's own control, not the phone's text size, and the prototype does not block it.
- **See it:** in a Safari tab, "aA", then 150% and 200%.
- **Question:** should the prototype stay usable at Safari's page zoom, at least Step done, Pause and the step on Today? Or should About say that larger text is not in this round?

**24. Today on smaller phones.**

- **Now:** on screens shorter than 740 points, Today with nothing running opens with the rest of today folded to its one line, not half open with Later today and Anytime today. At 390 × 844 and 430 × 932 it opens half. An iPhone SE is below 740, and so is a 6.1-inch phone in a Safari tab with its toolbars showing.
- **See it:** on an iPhone SE, or in a Safari tab: "Load: not started yet".
- **Question:** should an SE open Today on the half drawer, as SPEC 9.8 says, or folded, as built?

**25. The phone turned sideways.**

- **Now:** the app is a 430 point column in the middle, and Today's step is cut off above the top of the screen. A web page on an iPhone cannot hold the screen upright, in Safari or from the home screen.
- **See it:** turn the phone sideways with rotation lock off.
- **Question:** leave it as built; show a plain line such as "Turn the phone upright" when it is sideways; or design a sideways layout? Whatever the answer, it counts in deciding how the app is built.

**26. Counting the five choices on the prototype's own pages.**

- **Now:** by SPEC 3's counting, Settings offers six choices while something runs (its four switches, the capsule and capture) and five when nothing does. About offers four. The crisis page offers two by SPEC's counting, though the test that counts choices sees six, because its five dial links are not marked as one list.
- **See it:** "Load the example day", then Me › Settings.
- **Question:** are Settings and About exempt, as the prototype's control pages? If not, one way to bring Settings to five is to leave the capsule off pages under Me, as on the crisis page.

**27. Focus with a long step.**

- **Now:** a long step at Focus's large size can push the bar, the minutes and +5 min below the bottom of the screen, with nothing to show there is more.
- **See it:** add a long step to a task, start it, and open Focus.
- **Question:** should the step get smaller, should the clock stay pinned, or is scrolling acceptable?

**28. A half-drawer row whose name wraps.**

- **Now:** built at 66 points. SPEC 5.7 and 9.7 say such a row "grows to 62", but SPEC's own rule of 11 above and below gives 66 for two lines.
- **See it:** "Load: not started yet", then capture "Ask the school about the trip forms for Friday" with Today chosen. After the six seconds it is the last row of the half drawer.
- **Question:** which number is right?

**29. Half and open showing different lists.**

- **Now:** moving between the half drawer and the open one changes what it lists: the header grows and the lit item joins the list. The change is a short cross-fade as it comes to rest.
- **See it:** "Load: not started yet", then pull the handle from half to open.
- **Question:** is the cross-fade acceptable, or should the change be drawn moving?

**30. The motion path.** (Seen only with motion on: the phone's Reduce Motion off, and Settings › Motion at As the phone.)
- **A tap's spring.** A tap moves the drawer on the same spring as a finger, which takes about half a second to settle. Is that right for a tap, or should it be quicker?
- **The lantern into the capsule.** As the rest of today opens over Today, the lantern folds into the capsule as a charcoal card travelling over the rising drawer. Keep it, or let the lantern fade under the drawer while the capsule grows in place?
- **The light around the step.** Leaving Today by a tab, the light goes at once under the shrinking canvas, and it jumps on Start and when capture raises the lantern. Acceptable, or should it fade or move?
- **Tabs and pages.** Tab switches fade, and pushed pages slide; a page pushed from Today slides while the lantern folds into the capsule. Should tab switches slide too?
- **Step done on Today.** The finished step rises and fades in ash. Is that the right place for it to go, given that Today has no done line as Focus does?
- **See it:** "Load the example day", with motion on, and try each.

## Phone checks

These need the iPhone. Each says what to look for, and what it means if it goes wrong. About this prototype lists the same tries in shorter words.

**31. Back by the edge swipe.** In a Safari tab: Tasks › a task, then swipe in from the left edge. Watch whether the page slides in twice (Safari's slide, then the app's). Repeat from the open drawer and from Focus. Then close a page with its back pill and swipe in from the right edge. Then reload and try back again. From the home screen: see whether the edge swipe does anything at all. If it does not, About's tries should say "in a Safari tab" where they mention it.

**32. VoiceOver.** Across Today, Focus, capture and the rest of today: does VoiceOver follow each tap to the right place, does it say what changed while it moves, and do done rows, the bar and the tabs read sensibly? Without VoiceOver, a page's title takes focus when the page opens: does Safari draw a ring round it? It should not.

**33. Reduce Transparency.** Settings › Accessibility › Display & Text Size › Reduce Transparency on. With a task running, open Tasks and scroll the list under the capsule. The band under the dock line should turn solid charcoal, or solid white on white places. If it stays a soft fade, note it: it would go under "Left out" in About, or become a switch in Settings.

**34. Dragging with the keyboard up.** Open capture so the keyboard is up. Drag slowly up and down on the line under the field, between Inbox/Today and Save, and on the lantern above the sheet. Watch whether the whole page slides. Do the same in a task's note sheet.

**35. Double tap on text.** Double-tap "Later today" in the open drawer, and a paragraph in About. The page must not zoom.

**36. The capsule's width.** "Load the example day", then open Tasks so the capsule shows. Its second line must show "Write the school email" with no "…". Then pause it: "Paused" must sit inside its space, clear of the words beside it.

**37. The when sheet's time and day fields.** Tasks › a task › When › Today at a time. The field should look like the white fields elsewhere. Tap it, and use Reset or Clear if the picker offers one: the field should come back to the booked time rather than go blank, since the time stays booked. Then the same for Pick a day, once a day is set. Also note whether the picker shows a 12-hour clock ("10:30 AM"): it follows the phone's own setting, while the rest of the prototype uses 24 hours. Should the sheet draw its own 24-hour picker instead?

**38. Japanese or Chinese input.** Add the Japanese (Romaji) keyboard. In capture, type "nihon", choose a conversion, and press return to confirm it. The item must not be saved until a second return. Try "Add a step" the same way.

**39. The status bar over white places.** From the home screen, set Places to White in Settings and look at the clock and battery on Tasks. If they stay white on white, white places cannot meet SPEC 2 in a home-screen web app, which counts in deciding how the app is built.

**40. The drawer under the thumb.** How the pull feels: the few points before it moves, the spring, and the give past each end. Whether a flick lands where you meant, and whether stopping before you lift lets go where you stopped. Whether Safari ever takes a pull on the handle as its own gesture, and whether a tap ever fires after a pull ends over the handle.

**41. Smoothness.** On the motion path, on the oldest iPhone to hand: watch for stutter as the drawer is pulled (the lantern folding into the capsule frame by frame) and as the folded handle comes back. Two faint things the tests could not judge: capture opened over Focus dissolves its step for a moment, and "After this" fades briefly as the bar passes it.

**42. The font.** Today should be set in Instrument Sans, in a Safari tab and from the home screen, not in the phone's own face.

## Answered by default for this round

The build took these answers so it would not wait. Each stands until you change it. The first is the direction itself; the rest are plan section 21's questions, and the plan's "Defaults taken for the owner's questions".

**43. The direction.** The whole prototype is Lantern with the Now capsule, as ADR-047 proposes and `board.html` draws it. ADR-047 is still proposed: it waits on you. Confirm ADR-047, Lantern with the Now capsule, as the board draws it? If something should change first, say what.

**44. The font.** Instrument Sans is bundled as a trial, with its licence beside it. ADR-047 still calls the typeface proposed. Keep it?

**45. First open.** With nothing kept, the prototype loads the example day around the current time. "Start empty" is in About. Or should it open on "Nothing planned for today"?

**46. Charcoal or white places.** Settings › Places switches Tasks, Routines, Library and Me between the two. Today and Focus stay charcoal. Which do you want? ADR-047 leaves this to you.

**47. Coming back the same day.** Under 15 minutes away, the prototype returns exactly where you were; after that, it opens on Today. See it: open a task's page, lock the phone for 5 minutes and come back, then again for 20.

**48. A clock left running.** It closes at the end of its estimate, or with no estimate at the last moment the app was open, once the app has been in the background 15 minutes. Today then reads "Paused", or "Timer stopped" if Settings says so. See it: "Load: a clock left running".

**49. +5 min with no estimate.** It sets the estimate to the whole minutes worked so far plus 5. See it: start a task with no estimate, such as Fix the bike light, open Focus, then +5 min.

**50. The clock.** 24-hour, as the board draws it ("10:30", "ends 10:23").

**51. A booked item's two lengths.** The when sheet's "How long" sets both the slot's length and the estimate, kept equal.

**52. The pieces SPEC does not draw.** Built as proposed: Tasks › Coming up grouped by day; Tasks › Done newest first, with a disc to un-tick; an unopened task's steps as plain text, with no Now; a paused task's page as page 8 with the paused bar; a done task's page with "Not done after all"; Me opened on the current tab, which stays current; "⌄" and the tab's name when Focus opens from a pushed page; "in 1 h 20 min" for an hour or more; and "Nothing running · until 10:40" with "Booked now" when a booked slot is under way.

**53. Running routines.** Left out of this round. Do you want them before deciding how the phone apps are built? If so, what should Pause mean for a routine? The proposal is that it freezes the current step's minutes, with Resume and Set aside as for a task.

**54. Android.** Not this round. Will you also try it on an Android phone? It would need a manifest of its own.

**55. The design's own decisions.** SPEC section 14 lists the rest, each with a proposed answer: how long Undo stays, where a booked item goes when its time passes, whether starting a routine stops the running task, and whether the time box belongs to the task or the step. The prototype follows those proposals.

## Known, and left for later

Not questions, but rough edges you may meet. Each needs more work than this round allowed.

- On an iPhone SE, the capsule riding a task's sheet sits over the header, and the running task's note runs under "⌃ Focus".
- On very narrow screens (320 points, or Display Zoom on a small phone) some rows crowd. SPEC's answer is the larger-text layout, which is left out of this round.
- With a hardware keyboard, closing a sheet leaves no visible focus ring, and in Anytime and Tasks rows VoiceOver reads the tick ring before the row's name.
