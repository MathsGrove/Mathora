# MathsGrove Signature — Editorial Mathematics v17

## Purpose
The prior v16 standalone report mixed inherited stylesheet generations with overlapping sticky controls, separate metric cards, dense chapter titles and seven long reading pages. v17 reduces this visual competition and adds a cohesive, cinematic but **finite** series of mathematical motifs. The report remains a source-of-truth demonstration, never an interactive score generator or grade prediction.

## Design system
- **Ink + ivory + warm brass** instead of adding new saturated gradients or oversized decorative cards
- One dominant editorial headline per page and a slender graph-like geometric ribbon below the page header
- Shorter chapter headings: *Beyond the mark*, *The shape of understanding*, *Every question. Every decision*, *Inside the reasoning*, *Four weeks. A clearer path*, *One learner. Three perspectives*
- A single compact reading toolbar and a sidebar on large screens, transforming into a horizontal list on tablet and mobile
- Distinct per-chapter figures: orbits, proportion relationships, plotted curves, steps in reasoning, circle geometry, a four-stage staircase, and three-perspective connections
- One-time stroke drawing and staggered content reveals: score bands on the cover, summary evidence cards, topic bars, question table rows, exemplar reasoning, plan steps and family/tutor guidance
- A small closing chapter with clear links to Signature and an original reasoning example
- No sound, background video, looping timers, visual-only numerical claims, or blocking animation

## Performance and content safeguards
- Removed unnecessary legacy atmosphere and role stylesheet assets from the standalone reader; the wordless shared mathematical galaxy is retained
- One small SVG ribbon per page inserted into document flow, between header and body, so diagrams do not cover prose or mathematical tables
- Existing `report-pages.html` remains the single source for all ten question marks and seven canonical specimen pages: 43/60 overall, 72% rounded, 2/10 full-mark questions
- One-shot IntersectionObserver triggers; `prefers-reduced-motion` and Save-Data bypass decorative motion
- Print explicitly hides navigation, ribbons, hero/outro and animation, retaining seven original A4 portrait document pages
- No private services, student records, Supabase roles, marking logic or authentication changes

## Verification
- `scripts/check-report-editorial-v17.mjs` validates the seven original report pages, mathematical totals, seven unique motif scenes, style conflict cleanup, print and motion safeguards
- Existing `scripts/check-report-studio-v16.mjs` remains active to assert source-backed animated overview totals
- Chromium smoke tests report at 390px and 1440px widths, inspects all seven page positions, checks no document overflow or title collision, verifies reduced-motion behavior and printed output, and exercises the chapter controls
- Keep GitHub Pages publication gated on all existing maths, calendar, family privacy, examiner-lab, security, accessibility and performance checks

Source text remains an illustrative, non-official examiner specimen. The renewed visual language should never imply that the single diagnostic is a grade forecast or proof of long-term mastery.
