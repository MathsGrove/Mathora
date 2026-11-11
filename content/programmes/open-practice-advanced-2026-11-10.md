# MathsGrove original open-practice candidates · 10 November 2026

**DRAFT / NOT MODERATED / NOT PUBLISHED.** These are original public teaching exemplars, not secure unseen questions, not real student assignments, not official or endorsed examination questions. Nine items: 3 academic routes × 3 Grove service tiers. All have suggested mark allocations and fully worked answers. These complement, rather than duplicate, the 18 GCSE/IGCSE/AS/A Level draft items in PR #83. Board/year alignment and the exact operational availability of IB, Further Mathematics and TMUA must be confirmed before editorial approval. Grove Exam items here are **untimed open exam preparation**, not monthly unseen mocks.

**Research:** [Cambridge International Further Mathematics 9231, 2026–27 syllabus](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-mathematics-further-9231/). IB AA HL and TMUA mappings below are *provisional* and require direct specification checking. No exact paper-format or calculator-policy claim is made.

## Grove Daily — focused retrieval

### D-IB-01 · IB Mathematics AA HL candidate · sequences · 2 marks
**Question:** A geometric sequence begins $3,6,12,\ldots$. Find its seventh term.

**Solution:** Common ratio $r=6/3=2$. The $n$th term is $u_n=3(2)^{n-1}$; hence $u_7=3(2)^6=\boxed{192}$.

**Indicative marking:** M1 identifies the ratio or correct general term; A1 obtains 192. **Misconception:** seven terms means six multiplications by the ratio.

### D-FM-01 · Further Mathematics candidate · complex numbers · 2 marks
**Question:** Evaluate $(2+i)(2-i)$, where $i^2=-1$.

**Solution:** $4-2i+2i-i^2=4+1=\boxed{5}$.

**Indicative marking:** M1 expands correctly or recognises conjugates; A1 obtains 5. **Misconception:** $i^2=-1$, not $+1$.

### D-TMUA-01 · TMUA-style logic candidate · 1 mark
**Question (single best answer):** Every integer divisible by 6 is divisible by 3. Which statement is necessarily true?

A. Every integer divisible by 3 is divisible by 6.  
B. No integer divisible by 3 is divisible by 6.  
C. Some integers divisible by 3 are not divisible by 6.  
D. Every integer divisible by 6 is odd.

**Solution:** $\boxed{\text{C}}$: 3 is divisible by 3 but not 6. A is disproved by 3, B by 6, D by 6. **Indicative marking:** B1 correct option only. **Misconception:** the converse of a true implication need not hold.

## Grove Weekly — connected reasoning

### W-IB-01 · IB Mathematics AA HL candidate · optimisation · 4 marks
**Question:** A rectangle has perimeter 40 cm. Find the maximum possible area and the dimensions that achieve it.

**Solution:** Let one side be $x$ cm; the other is $20-x$ cm with $0<x<20$. Area $A=x(20-x)=20x-x^2=100-(x-10)^2$. Since $(x-10)^2\ge0$, $A\le100$. Equality holds at $x=10$, so the rectangle is $10$ cm by $10$ cm and the maximum area is $\boxed{100\text{ cm}^2}$.

**Indicative marking:** M1 correct perimeter constraint; M1 area expression; M1 valid maximum argument; A1 dimensions and area. **Misconception:** perimeter 40 means the two adjacent sides total 20.

### W-FM-01 · Further Mathematics candidate · complex roots · 4 marks
**Question:** Solve $z^2-4z+13=0$ over the complex numbers.

**Solution:** By the quadratic formula, $z=\frac{4\pm\sqrt{16-52}}2=\frac{4\pm\sqrt{-36}}2=\frac{4\pm6i}2=\boxed{2\pm3i}$.

**Indicative marking:** M1 correct discriminant; M1 identify $\sqrt{-36}=6i$ up to sign; A1 one root; A1 both roots. **Misconception:** negative discriminants do not imply no *complex* roots.

### W-TMUA-01 · TMUA-style proof candidate · 1 mark
**Question (single best answer):** Which argument correctly proves that $n^2+n$ is even for every integer $n$?

A. Every integer squared is even.  
B. $n^2+n=n(n+1)$, and one of two consecutive integers is even.  
C. $n^2+n$ is even for $n=1,2,3$, so it is always even.  
D. $n^2+n=2n$ for every integer $n$.

**Solution:** $\boxed{\text{B}}$. Two consecutive integers have opposite parity, so their product is even. A is false for odd $n$; C checks only examples; D is algebraically false in general. **Indicative marking:** B1 correct option only. **Misconception:** examples are not a universal proof.

## Grove Exam-preparation — original extended reasoning / MCQ

### E-IB-01 · IB Mathematics AA HL candidate · binomial probability · 5 marks
**Question:** A fair procedure is repeated four times independently. The probability of a success on each repetition is $0.3$. Find the probability of exactly two successes, giving your answer to four decimal places.

**Solution:** Let $X\sim\operatorname{Bin}(4,0.3)$. Then $P(X=2)=\binom42(0.3)^2(0.7)^2=6(0.09)(0.49)=\boxed{0.2646}$.

**Indicative marking:** M1 identify binomial model; M1 correct $\binom42$; M1 probability powers; M1 correct multiplication; A1 0.2646. **Misconception:** the six arrangements are distinct, hence the combination factor.

### E-FM-01 · Further Mathematics candidate · matrices · 5 marks
**Question:** For $A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, find the eigenvalues and one non-zero eigenvector for each.

**Solution:** $\det(A-\lambda I)=(2-\lambda)^2-1=\lambda^2-4\lambda+3=(\lambda-1)(\lambda-3)$. The eigenvalues are $\boxed{1,3}$. For $\lambda=1$, $(A-I)v=0$ gives $x+y=0$, so $v=\boxed{(1,-1)^T}$. For $\lambda=3$, $(A-3I)v=0$ gives $-x+y=0$, so $v=\boxed{(1,1)^T}$. Any non-zero scalar multiple is accepted.

**Indicative marking:** M1 determinant; A1 both eigenvalues; M1 solve an eigenvector equation; A1 eigenvector for 1; A1 eigenvector for 3. **Misconception:** eigenvectors are not unique up to non-zero scale.

### E-TMUA-01 · TMUA-style algebra candidate · 1 mark
**Question (single best answer):** For which real values of $x$ is $x^2-5x+6<0$?

A. $x<2$ or $x>3$  
B. $2\le x\le3$  
C. $2<x<3$  
D. All real $x$

**Solution:** $x^2-5x+6=(x-2)(x-3)$. The upward-opening quadratic is negative strictly between its roots, so $\boxed{\text{C}}$. Endpoints are excluded by the strict inequality. **Indicative marking:** B1 correct option only. **Misconception:** $\le$ would include the roots, but $<$ does not.

## Diagram and editorial policy

None of these nine questions requires a figure to determine a unique answer. For W-IB-01, an optional original vector rectangle may be created after moderation with adjacent sides labelled $x$ and $20-x$, explicitly marked **not to scale**; do not imply a fixed shape. For E-FM-01, the matrix is given in exact mathematical notation rather than a potentially misleading diagram.

**Checks completed:** nine distinct item IDs, nine question stems, nine worked solutions, nine indicative mark schemes; exact values verified algebraically. All TMUA-style questions have exactly one correct option. **Not completed:** independent examiner moderation, exact current IB/TMUA syllabus and board-year mapping, student-facing accessibility testing, publication, or full-browser E2E tests.
