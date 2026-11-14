# MathsGrove / The Mathematics Gallery v13

## Experience concept

A gallery of mathematical ideas, rather than a generic page wipe. A visitor clicks an important button and 24 translucent editorial panels rise into view, each containing a mathematical expression, number or concept. Fine graph curves and orbital geometry draw over the gallery. A central equation or question resolves into three handwritten steps. The panels move through a subtle depth shift while the destination enters, making the website feel connected rather than segmented.

The visual language continues MathsGrove's deep-navy, warm-ivory and champagne palette. The gallery is generated as lightweight DOM/SVG using existing static assets: no video download, canvas animation, tracking or third-party animation platform.

## Navigation coverage and visual distinction

| User action | Visual treatment | Destination |
| --- | --- | --- |
| Explore Programmes, programme card | Number pattern 2, 4, 8, 16; rhythmic sequence gallery | Services or dashboard product tour |
| Student, parent or tutor entry | Role-specific equation and context; same mathematics gallery | Fictional role-specific dashboard |
| Signature discovery, Signature detail, examiner specimen | Quadratic factorisation and three written working lines | Corresponding Signature section or full specimen |
| Try the method, independent reasoning | 3(x + 4) = 27 → x + 4 = 9 → x = 5 | Original reasoning demonstration |
| Dashboard overview, practice, reports | Animated gallery, with shorter transitions to minor anchors | Exact requested section |
| Calendar-to-practice, dashboard side navigation | Shared gallery with correct destination selection | Practice or dashboard section |
| Navigation links between homepage, examiner reader and reasoning demo | Shared gallery on departure and matching page entrance | Exact internal page |
| Private role sign-in or Examiner Studio **links from marketing** | Short, decorative farewell scene only | Original, unchanged login/Studio application |
| Tab changes, report page next/previous, calendar date and role switches | Immediate action plus a tiny 5-number trail (no full-screen wait) | Existing interaction unchanged |
| Form inputs, answer entry, print, uploads, authentication requests, buttons with no approved selector | No interception or artificial delay | Native behaviour |

## Timings

| Transition class | Desktop | Up to 720 px | Notes |
| --- | --- | --- | --- |
| Major gallery | 450 ms enter + 650 ms mathematics + 520 ms unveil = **1.62 s** | 340 + 465 + 440 = **1.245 s** | Main buttons, account page links, whole demonstrations |
| Smaller chapter | 210 + 145 + 250 = **605 ms** | 175 + 110 + 210 = **495 ms** | Minor in-page anchor navigation |
| Local number trail | **480 ms** | **480 ms** | Decorative only; action happens immediately |
| Reduced motion / Save-Data / hidden document | **0 ms** | **0 ms** | Immediate navigation and no decorative trail |

## Implementation

1. Replace the large homepage-embedded v12 constellation (static 28 symbols) with a single reusable gallery created in `maths-gallery-v13.js`. This cuts page HTML and removes repetitive DOM.
2. Use `maths-gallery-v13.css` for a 24-tile gallery, spatial curves, orbital lines, and magazine-style typography. Only 16 gallery panels are shown on small screens.
3. Intercept **safe, same-origin, internal public links only**, including existing in-page hashes, while allowing new tabs, modified clicks, external links, skip links, downloads and open dialog controls to behave natively.
4. Preserve existing `MathsGroveMotion.navigateHash`, `navigatePage` and `navigateReport` APIs used by role cards, programme tours and the Signature buttons.
5. Connect the existing `showcase-v3.js` dashboard side navigation and `experience-v4.js` calendar-to-practice action to the shared route without changing their data models.
6. Share the same cinematic departure/arrival styling with the full examiner report and standalone reasoning demonstration. The authenticated pages keep their own original behaviour and permissions.
7. Attach a small, finite five-character number trail to selected marketing buttons, report controls and demonstration tabs; remove it when its container animation ends.
8. Use the existing curated GitHub Pages deployment workflow to ship only the two v13 assets plus retained v11 section atmosphere CSS.

## Maths correctness

All worked examples are real algebra:
- `x² − 5x + 6 = 0` → `(x − 2)(x − 3) = 0` → `x = 2 or x = 3`
- `3(x + 4) = 27` → `x + 4 = 9` → `x = 5`
- `2x + 3 = 11` → `2x = 8` → `x = 4`
- `2, 4, 8, 16, …` → doubled terms → `32`

These are explicitly **illustrations**, not a claim of live marking, actual learner results or an examination board's endorsed solutions.

## Safety, accessibility and release criteria

- No Supabase, private student data, role permissions, automatic marking or examination bank changes.
- Focus is moved to in-page destinations; the skip link and all altered-click/new-tab behaviours remain native.
- Reduced-motion, Save-Data and hidden-tab routes bypass cinematic effects; keyboard Escape can end the passage.
- No persistent JavaScript animation timer, interval or scroll listener.
- The controller uses native browser animations and does not require external downloads.
- The homepage remains below the existing **65,000-character** integrity budget.
- Release only after Node regression tests, mobile/desktop Chromium tests, maths/calendars/family QA and curated Pages deployment pass.
