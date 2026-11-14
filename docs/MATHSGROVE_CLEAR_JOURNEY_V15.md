# MathsGrove v15 — A Simpler Journey, Pure Mathematics Galaxy

## Design brief and release constraints

The homepage is now organised as a learning story rather than a series of unrelated marketing showcases. This release is presentation-only: it does not change Supabase, private roles, student records, examiner marking, live question data or active assessments.

### The four visible chapters

1. **Welcome.** A clear invitation to explore MathsGrove, with **Explore the three programmes** as the primary action.
2. **Three programmes.** Grove Weekly (one structured weekly set and monthly reflection), Grove Daily (short frequent practice and weekly reflection), and Grove Exam (Daily plus separately moderated exam preparation, with permissioned parent/tutor views). A long feature table is optional behind **Compare all programme features**. Signature is explicitly a separate service.
3. **Dashboards.** Student/parent/tutor role entry and the interactive fictional product tour live directly after the programmes. An **illustrative seven-day chart** responds to the existing programme and role selections; the case-study analytics follow.
4. **Signature → Reports.** The human examiner-led add-on and the seven-page examiner specimen appear together, in that order. The full reader has seven numbered chapter buttons, a page progress line, and existing previous/next/select/print controls.

Additional reasoning examples, examination pathway details and frequently asked questions are retained *after* the main four-chapter story, where curious visitors can continue without disrupting the central flow.

### Transitions: mathematics only

- **No writing, headlines, quotes, labels, prose or handwritten working in the overlay.**
- 24 luminous numeric and symbolic tiles, mathematical traces, orbital rings and one destination-specific central mathematical glyph.
- Soft opacity and scale crossfade instead of a full-page vertical wipe. In-page destinations are scrolled to immediately beneath the fade, avoiding mid-transition smooth-scroll conflicts.
- Main desktop sequence: **500 ms reveal + 250 ms choreography + 600 ms dissolve = 1.35 seconds**.
- Main phone sequence: **350 + 180 + 480 ms = 1.01 seconds**.
- Smaller section jumps: **540 ms desktop / 440 ms mobile**.
- Reduced-motion, Save-Data and hidden pages bypass the animation entirely. Small mathematical button trails remain decorative and non-blocking.

### Seven-day chart: an honest example

The weekly visual is **fictional**, not an actual parent, tutor or student's activity record. It shows *example question counts* across seven days, not verified study minutes. The data sets are:
- Weekly: `[0,0,0,6,0,0,0]` — one example set.
- Daily: `[5,4,6,4,5,7,0]` — 31 example questions over six days.
- Exam: `[4,5,4,6,5,7,0]` — 31 example practice questions, not a mock score.

Only the Grove Exam fictional sample offers parent and tutor perspectives. Those perspectives change the interpretation, not the underlying counts. The chart is accessible in text as well as bars, reveals once when in view, and respects reduced-motion preferences. It makes no claim of improved grades, academic mastery, measured learning time or individual student behaviour.

### Examiner report reader

The seven canonical specimen pages remain loaded from `report-pages.html`; their mathematical contents and page count are unchanged. The new chapter buttons jump to the requested page, update the existing select, maintain an active-page announcement, and advance a small progress line. The design improves discovery without adding an extra backend or a second data source.

### Performance and verification

- A single runtime-generated galaxy overlay; no repeated text sections, looping canvas, video or live data fetch.
- Existing homepage size budget remains below 65,000 characters.
- Existing original reasoning, calendar, public and private access safeguards must stay green.
- Tests validate exact page order, three tier explanations, wordless motion, finite timings, fictional week boundaries, reader navigation, keyboard and reduced-motion behaviour.
- Merge only if the pull request's CI is green. Confirm curated Pages deployment before claiming the update is live.
