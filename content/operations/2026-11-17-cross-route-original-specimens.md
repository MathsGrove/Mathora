# Cross-route original mathematical checks — 17 November 2026

**Editorial only.** These three original examples are public worked specimens, not unseen mock questions, examiner-approved mark schemes, student assignments or evidence of production coverage. Before use, independently verify the board/component/syllabus year and secure human moderation. Grove Weekly, Daily and Exam are service plans, not qualifications.

## 1. GCSE Higher — quadratic area model (Weekly specimen)
**Route:** GCSE Higher; algebra/geometry; proposed calculator-free 5 marks; exam-board mapping pending.

A rectangular garden has width `x` metres and length `x+5` metres. Its area is `84 m²`. Find the dimensions and explain why only one algebraic solution is valid.

**Worked solution:** `x(x+5)=84`, so `x²+5x−84=0=(x+12)(x−7)`. Hence `x=7` or `x=−12`. A physical width must be positive, so the dimensions are **7 m by 12 m**. Check: `7×12=84`.

**Proposed marking guidance (5):** M1 formulate area equation; M1 expand/rearrange to zero; M1 valid factorisation or equivalent quadratic method; A1 two algebraic roots; A1 correct positive dimensions with contextual rejection. Alternative correct quadratic-formula method accepted. Not an official board mark scheme.

## 2. Cambridge IGCSE 0580 Extended — compound change (Daily specimen)
**Route:** IGCSE Extended; percentage change; proposed calculator 5 marks; check exact syllabus/paper year before use.

A bicycle costs `$480`. Its price increases by `12.5%`, then a sale reduces the new price by `20%`. Calculate the sale price and the overall percentage change from the original price.

**Worked solution:** After increase, `480×1.125=540`. After discount, `540×0.8=432`. Relative change `(432−480)/480×100=−10%`. The final price is **$432**, an **overall 10% decrease**. The percentages do not cancel because their bases differ.

**Proposed marking guidance (5):** M1 apply 1.125 to original; A1 obtain 540; M1 apply 0.8 to increased price; A1 obtain 432; A1 obtain 10% decrease with correct reference base. Equivalent combined multiplier `1.125×0.8=0.9` accepted. Not an official Cambridge mark scheme.

## 3. TMUA Paper 2 — necessary versus sufficient (Exam specimen)
**Route:** TMUA mathematical reasoning; non-calculator five-option multiple choice; proposed one answer mark. Validate against current test specification before use.

Let `n` be an integer. Which statement is **always true**?

A. If `n²` is even, then `n` is odd.

B. If `n²` is divisible by 4, then `n` is even.

C. If `n` is even, then `n²` is odd.

D. If `n²` is odd, then `n` is even.

E. If `n²` is divisible by 4, then `n` is divisible by 4.

**Worked solution:** **B**. If `n` were odd, `n=2k+1` and `n²=4k(k+1)+1`, which is odd and cannot be divisible by 4. Thus divisibility of `n²` by 4 requires `n` even. A is false at `n=2`; C is false at `n=2`; D is false at `n=1`; E is false at `n=2`. Exactly one option is correct.

**Proposed marking guidance (1):** B only. The other choices are distractors, not partial-credit responses. No claim of official TMUA endorsement.

## Mechanical QA
Run `node scripts/check-cross-route-specimens-20261117.mjs` from repository root. This checks arithmetic, both roots, counterexamples, and exhaustive integer samples for TMUA option uniqueness; it is **not** an independent examiner review or proof of syllabus alignment.

**Research anchors:** [AQA GCSE 8300](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/specification-at-a-glance), [Cambridge 0580 2025–27 syllabus](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf), [TMUA official test](https://esat-tmua.ac.uk/about-the-tests/tmua-test/). These are reference links, not claims of fresh official source verification.
