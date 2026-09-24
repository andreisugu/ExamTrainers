# 🎓 ExamTrainers — Agent Directives & Engineering Standards

Welcome to **ExamTrainers** (`andreisugu/ExamTrainers`). This project is a curated, open-source collection of interactive exam training web applications published to GitHub Pages (`gh-pages`). It is designed to help computer science and engineering students (currently focusing on University of Craiova - UCV, AN3 and AN4) pass challenging exams through interactive solvers, visualizers, homework decoders, and timed mock tests.

---

## 🏛️ 1. Architecture & Directory Standard

The repository follows a clean, predictable multi-page directory hierarchy:

```
ExamTrainers/
├── trainers/
│   ├── index.html                           # Landing hub & catalog of all available trainers
│   │
│   ├── an3-sem2/micro/                      # Subject: Microprocesoare (AVR ASM, timers, interrupts)
│   │   ├── index.html                       # Subject dashboard
│   │   ├── setup/                           # Chapter 1 (index.html + theory.html)
│   │   ├── timers/                          # Chapter 2 (index.html + theory.html)
│   │   └── ...
│   │
│   ├── an4-sem1/securitatea-datelor/        # Subject: Securitatea Datelor (SD)
│   │   ├── index.html                       # Subject dashboard (breadcrumbs, stats, chapter cards)
│   │   ├── delastelle/                      # Chapter 1: Bifid & Trifid
│   │   │   ├── index.html                   # Interactive Simulator & Step-by-Step Solver
│   │   │   └── theory.html                  # Deep-dive theory, proofs, partial block rules
│   │   ├── classical/                       # Chapter 2: Caesar, ROT13, Vigenère, Kasiski, Ic
│   │   │   ├── index.html
│   │   │   └── theory.html
│   │   ├── asymmetric/                      # Chapter 3: RSA & Diffie-Hellman MitM
│   │   │   ├── index.html
│   │   │   └── theory.html
│   │   ├── websec/                          # Chapter 4: DVWA SQLi/XSS/CSRF & HTB Invites
│   │   │   ├── index.html
│   │   │   └── theory.html
│   │   └── mock-exam/                       # Chapter 5: Timed Mock Exam (45 min, 10 questions)
│   │       ├── index.html
│   │       └── theory.html                  # Cheat sheet: "Cele 10 Porunci ale Examenului"
│   │
│   └── an4-sem1/proiectarea-translatoarelor/ # Subject: Proiectarea Translatoarelor (Compilatoare & M+-)
│       ├── index.html                       # Subject dashboard (breadcrumbs, stats, chapter cards)
│       ├── lexer-automata/                  # Chapter 1: Lexical Analysis, Thompson, Hopcroft, Flex
│       │   ├── index.html                   # Interactive Automata & Flex Workbench
│       │   └── theory.html                  # Deep-dive theory, proofs, Maximal Munch rules
│       ├── top-down-ll1/                    # Chapter 2: Top-Down LL(1) Parsing & Recursive Descent
│       │   ├── index.html                   # FIRST/FOLLOW Calculator & LL(1) Stack Simulator
│       │   └── theory.html                  # Formal derivations, left recursion/factoring proofs
│       ├── bottom-up-lr/                    # Chapter 3: Bottom-Up LR/LALR & Bison
│       │   ├── index.html                   # LALR(1) Core Merge Lab & Shift-Reduce Trace
│       │   └── theory.html                  # Handles, LR(0), SLR, LR(1), LALR core merging, Bison %prec
│       ├── semantics-mplusminus/            # Chapter 4: Static Semantics, Type Checking & M+-
│       │   ├── index.html                   # Scoped Symbol Table, Type Checker & 3AC/Dataflow
│       │   └── theory.html                  # SDD/SDT, Scope tables, M+- spec, 3AC quadruples
│       └── mock-exam/                       # Chapter 5: Timed Mock Exam (60 min, 15 questions)
│           ├── index.html                   # Exam simulator with randomized pool & diagnostics
│           └── theory.html                  # Cheat sheet: "Cele 10 Porunci ale Examenului de PT"
│
├── .github/workflows/pages.yml              # CI/CD: Deploys `trainers/` directly to GitHub Pages
├── README.md                                # Repository overview and catalog index
└── AGENTS.md                                # This authoritative engineering standard
```

---

## ⚡ 2. Core Architectural Principles

1. **Zero-Build, Static Delivery:**
   - There is **no Node.js build step, bundler, or package manager** in production.
   - All pages run directly in any modern browser via standard CDN links (Tailwind CSS, React 18 UMD, and Babel Standalone for interactive components).
   - This ensures instant zero-friction deployment to GitHub Pages and guarantees that any student can clone the repository and double-click any `index.html` to run it offline via `file://`.

2. **The Multi-Page Dual Pattern (`index.html` + `theory.html`):**
   - **Never bundle an entire subject into a monolithic single-page app.**
   - Every chapter MUST have:
     - `index.html`: Interactive, highly visual tool with live state, sliders, inputs, visual matrices, and immediate feedback.
     - `theory.html`: Comprehensive theoretical reference, mathematical proofs, step-by-step algorithms, worked homework examples, and exam trap alerts.

3. **Strict Separation of Concerns:**
   - **Theory Pages (`theory.html`) MUST BE PURE STATIC HTML.**
     - Do NOT import React or Babel in `theory.html`.
     - Never use React `.map()` expressions, curly braces, or JSX syntax in `theory.html`.
     - Use clean semantic HTML typography (`<strong>`, `<em>`, `<code>`, `<pre>`, `<kbd>`) and HTML math entities (`&phi;`, `&Zopf;<sub>26</sub>`, `&rarr;`, `&rArr;`, `&times;`, `&le;`, `&ge;`).
   - **Interactive Pages (`index.html`) USE REACT 18 + BABEL:**
     - Use React 18 (`React.useState`, `React.useEffect`, `React.useMemo`).
     - Render into `<div id="root"></div>` via `ReactDOM.createRoot(document.getElementById('root')).render(<App />);`.

---

## 🚨 3. Critical Syntax & Coding Traps for Agents

### ⚠️ A. The JSX LaTeX Interpolation Trap
- **The Bug:** Writing LaTeX like `\mathbf{U}` or `\phi(n)` directly in JSX text.
- **The Consequence:** Babel standalone parses `{U}` as a JavaScript variable interpolation, throwing:
  ```
  Uncaught ReferenceError: U is not defined
  ```
- **The Rule:** In React JSX files, **never write raw LaTeX math symbols with curly braces**. Always use semantic HTML tags:
  - ❌ BAD: `$(5, 1) \to \mathbf{U}$`
  - ✅ GOOD: `<span>(5, 1) &rarr; <strong>U</strong></span>`

### ⚠️ B. The HTML `<script>` Closing Tag Trap
- **The Bug:** Writing `</script>` or unescaped HTML tags inside string literals inside a `<script>` tag.
- **The Consequence:** The browser HTML parser immediately terminates the script block regardless of whether it was inside a JS string literal.
- **The Rule:** Escape closing tags in string literals (e.g. `<\/script>` or HTML entity `&lt;/script&gt;`).

### ⚠️ C. Class Attribute Hygiene
- In React JSX (`index.html`): ALWAYS use `className="..."`.
- In Static HTML (`theory.html`): ALWAYS use `class="..."`.

### ⚠️ D. Relative Path Integrity
- ExamTrainers is hosted at `https://andreisugu.github.io/ExamTrainers/` AND executed locally via `file://`.
- **Never use root-relative paths like `/trainers/...` or `/css/...`.**
- Always use strictly calculated relative paths:
  - From `trainers/index.html` to a subject: `./an4-sem1/securitatea-datelor/`
  - From a chapter `index.html` to parent dashboard: `../index.html`
  - From a chapter `index.html` to main hub: `../../../index.html`
  - Between `index.html` and `theory.html` in the same chapter: `./theory.html` and `./index.html`.

---

## 🎯 4. Course & Exam Fidelity Directives

Simulators and solvers in this repository must **never be generic toys**. They must reflect the exact requirements, edge cases, and grading criteria taught by university professors:

1. **Include Official Homework Presets:**
   - Every tool should feature a "Quick Load / Presets" toolbar loading official course exercises, homework texts, and exam problems directly into the solver with a single click.
2. **Implement Step-by-Step Derivations:**
   - Don't just show the final answer; show the intermediary tables and traces:
     - Delastelle: Polybius coordinates $\to$ row/col concatenation $\to$ block re-grouping.
     - RSA: Extended Euclidean Algorithm Bezout table ($r_i, q_i, s_i, t_i$).
     - Caesar / Vigenère: Frequency histograms vs standard English baseline ($E, T, A, O...$).
     - PT Lexer: Subset construction with $\epsilon$-closure, Hopcroft state partitioning, Flex Maximal Munch tracking `Last-Final`.
     - PT LL(1): Step-by-step FIRST & FOLLOW computation with $\epsilon$ rule ($\epsilon \notin \text{FOLLOW}$), LL(1) stack matching.
     - PT LALR(1): Dragon Book core merging proof with LR(1) lookahead unioning, showing that core merging CANNOT create Shift-Reduce conflicts, only Reduce-Reduce conflicts.
     - PT Semantics: Scoped symbol table (shadowing vs duplicate trap), $M^{+-}$ type checking (`WHILE 1 DO` boolean error), 3AC quadruples, DEF/USE dataflow sets.
3. **Explicitly Teach Exam Traps:**
   - Highlight common student pitfalls with styled alert boxes:
     - Partial blocks ($k < p$) in Delastelle do NOT pad with 'X'.
     - Modular subtractions in $\mathbb{Z}_{26}$ with negative values require adding $+26$.
     - RSA private exponent $d$ is calculated strictly $\pmod{\phi(n)}$, NEVER $\pmod{n}$.
     - DVWA Medium SQL injection receives numeric POST inputs without quotes (`id=1 OR 1=1`, not `' OR '1'='1`).
     - PT Lexer: Keywords vs Identifiers ordering in Flex rules (first-rule-wins trap) and longest-match fallback when no match succeeds.
     - PT LL(1): $\epsilon$ is NEVER placed in $\text{FOLLOW}(A)$. Left factoring does not eliminate left recursion.
     - PT LALR(1): LALR(1) tables have the EXACT same number of states as SLR(1) and LR(0), only lookaheads differ.
     - PT Semantics: $M^{+-}$ does NOT allow integer expressions in conditions (`WHILE 1 DO` is a fatal type error); local variables shadow globals without modifying outer scope.

---

## ✅ 5. Pre-Commit Quality Checklist for Agents

Before completing any task or proposing a git commit, agents must execute the following checks:

1. **Automated Verification Script:**
   - Always run `node scripts/verify.js`. It runs headless compilation via `@babel/standalone` across every `<script type="text/babel">` in the repo, validates all relative `href` and `src` links, checks theory purity, and catches unclosed tags or JSX syntax traps before they reach the browser.
2. **Link Verification Check:**
   - Ensured via `node scripts/verify.js` (0 dead links allowed).
3. **Theory Page Purity Check:**
   - Ensured via `node scripts/verify.js` (`theory.html` must remain pure static HTML).
4. **Hub & Catalog Registration:**
   - If a new trainer or chapter is created:
     - Register it in `trainers/index.html` (in the `TRAINERS` array and stats badges).
     - Update `README.md` to list the new trainer.
5. **Git Protocol:**
   - Remote URL must use SSH: `git@github.com:andreisugu/ExamTrainers.git`.
   - Never push to `main` without explicit user permission.
