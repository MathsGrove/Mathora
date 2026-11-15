# MathsGrove v16 — The Signature Reading Studio

## Objective
Make the existing seven-page **fictional** Signature examiner report fit naturally on desktop and mobile, deliver a visually rich but understandable reading experience, and add truthful animations from the *original* report data. No student information, backend access, assessment content, or examiner marking is changed.

## Design improvements

**Before:** Seven landscape-like pages stacked in a wide container, with two horizontal navigation rows. Mobile controls and long content felt dense.

**Now:**
- Editorial hero with restrained mathematical ornament.
- An animated **assessment-at-a-glance** area, calculated dynamically by summing the question rows in the original `report-pages.html`: **43/60** awarded, **72%** of marks rounded, **10/10** questions reviewed, **2/10** full-mark questions.
- A circular mark-share animation and **ten question-level bars**. Every data bar has a precise text alternative with awarded/available marks. These are fictional, not a grade prediction.
- An attractive, sticky **seven-chapter sidebar** on desktop. Below 1120px it becomes a compact horizontal navigator.
- A narrower report-page width (**up to 920px**) to avoid stretching dense explanations, tables and examiner observations. Mobile pages use responsive internal spacing instead of a forced landscape ratio or artificially large fixed height.
- Print remains the **original seven complete A4 portrait pages**; the new stats and navigation disappear from print.
- Adjacent page navigation scrolls smoothly; long jumps move instantly so users do not have to watch several full pages pass by. Focus follows the requested page for keyboard readers.
- Pages receive a brief, one-time editorial reveal as they enter view; topic bars animate once when their page appears. The animation does not alter scores or block page interaction.
- `prefers-reduced-motion`, Save-Data and hidden-page conditions bypass animated counting. CSS ensures immediate static scores and charts for reduced-motion users.
- No looping timers, network calls to learner APIs, tracking or persistent state. The only source request remains the original, public fictional specimen.

## Data provenance
Original `report-pages.html` ten rows, with `data-mg7-question`, `data-mg7-awarded` and `data-mg7-available`. They are checked for finite integer values and unique question IDs before rendering. The reader's existing seven pages still come from that same canonical HTML, so the overview and examiner report cannot quietly drift.

## Release criteria
- Full `scripts/check-report-studio-v16.mjs` confirms canonical totals and percentages, motion limits, source integrity, responsive layout and A4 print safeguards.
- Browser smoke checks the actual rendered stats and ten bars on desktop/mobile, the page widths, chapter navigation, and print CSS.
- Existing maths reasoning, family permissions, marking-lab, calendar, Lighthouse and CodeQL checks must succeed before release.
- Curated Pages bundling includes `report-experience-v16.css`.
