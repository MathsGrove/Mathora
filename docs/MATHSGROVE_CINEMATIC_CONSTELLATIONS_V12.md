# MathsGrove Mathematical Constellations — v12

## Goal
Turn section changes and page-opening actions into a continuous premium maths experience, rather than unrelated decorative scenes. Preserve legible content, navigation, role permissions and fast static deployment.

## 1. Which buttons get which transitions
| Entry point | Theme | Destination |
| --- | --- | --- |
| **Explore programmes** / header links to programmes | Flowing mathematics, `f(x) → ∞` | `#services` |
| **Student dashboard** entry | Student progress, `x → progress` | `#dashboards` |
| **Parent dashboard** entry | Calm overview, `Δ confidence` | `#dashboards` |
| **Tutor dashboard** entry | Evidence and rate of change, `f′(x)` | `#dashboards` |
| **Signature** and **Examiner report** links | Carefully written quadratic solution and method marks | `#signature-discovery`, `#signature`, `#signature-sample` |
| **Read the seven-page examiner report** | Exam-method working and answer checking | `./report.html` |
| **Try the method**, **Reasoning Journey** | Handwritten linear-equation steps | `./reasoning-demo.html` |
| **Individual programme cards** | Programme-to-dashboard flow | `#learning-journey` |
| **Routine tab changes, calendar cells, small controls and skip links** | No cinematic delay | Existing functionality |

The full MathsGrove original question, assessment and role permission rules remain unchanged. All these demonstrations must still carry their fictional-example labels.

## 2. Exact phase timings
| Device | Scene opening | Maths constellation & working | Destination unveiling | Total |
| --- | ---: | ---: | ---: | ---: |
| Desktop / tablet | 440 ms | 650 ms | 550 ms | **1,640 ms** |
| Phone up to 720 px | 330 ms | 480 ms | 440 ms | **1,250 ms** |
| Reduced-motion, Save-Data or hidden page | 0 ms | 0 ms | 0 ms | **Immediate** |

The overlay is not a loading screen and has no remote content or data dependency.

## 3. Visual language
- Deep navy, editorial ivory and subtle champagne: maintain MathsGrove's established palette.
- Three depth layers: fine orbital geometry, 28 fixed formula/number motifs, and a central chapter-specific equation.
- SVG curve strokes animate once; formulas drift gently and dissolve.
- Mathematical solution lines write sequentially with a handwriting typeface and plain-text fallback.
- Report & reasoning scenes use **correct** demonstrated workings:
  - `x² − 5x + 6 = 0` → `(x − 2)(x − 3) = 0` → `x = 2 or x = 3`
  - `3(x + 4) = 27` → `x + 4 = 9` → `x = 5`

## 4. Implementation
- `index.html`: one hidden, accessible-to-skip decorative passage; no duplicated sections.
- `maths-cinematic-v11.css`: existing per-section background layers and calm interaction styling.
- `maths-cinematic-v12.css`: constellation, finite CSS scenes, handwriting and responsive rules.
- `maths-cinematic-v12.js`: finite Web Animations phase controller; no scroll loop, canvas or video downloads.
- `welcome-experience-v8.js`, `marketing-experience-v5.js`: preserve the selected role when opening dashboard scenes.
- `report.html` and `reasoning-demo.html`: short matching page-arrival animation.
- The fallback on systems without animation support remains the original native link/scroll behavior.

## 5. Release plan and acceptance gates
1. Preserve the existing GitHub Pages site structure; work only on a dedicated design branch.
2. Implement 28 static mathematical motifs and section-specific visual scenes.
3. Introduce exact staged timings and handwritten maths; give phone screens a reduced visual load.
4. Connect the existing CTA and role entry points without altering data or Supabase.
5. Check correctness of all worked examples and ensure every fallback navigates.
6. Run Node integrity tests plus desktop and phone Chromium smoke, including the examiner reader.
7. Merge only after successful GitHub checks, then confirm the main-site deployment run.

## Accessibility and performance contract
- Reduced-motion and Save-Data disable the animation entirely.
- Do not intercept new tabs, modified clicks, downloads or skip navigation.
- Restored keyboard focus after in-page navigation, short finite effects, no perpetual JS animation loops.
- No video, canvas background, account connector or personal student data in motion.
- Keep the mathematical meaning and CTA wording readable even when animation does not run.
