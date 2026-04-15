# Synaptic — Full Implementation Audit Report
**Last updated:** April 2026 · **Validator:** ✅ 0 errors, 0 warnings · **Build:** ✅ 24/24 pages

---

## Changelog

### April 2026 — UI/UX Accessibility & Usability Overhaul ✅ COMPLETE

All items below were audited, changed, and verified with `tsc --noEmit` (0 errors) and `next build` (24/24 pages).

| Area | Change | Files |
|---|---|---|
| Contrast | Dark `--text-faint` `#747490→#9090b0`, `--text-ghost` `#545468→#707090` — both now pass WCAG AA | `globals.css` |
| Contrast | Light mode background `#f2f0eb→#f0f0f8` (cool neutral, eliminates purple clash) | `globals.css` |
| Contrast | Light `--text-muted/faint/ghost` all raised; light accent colours deepened | `globals.css` |
| Borders | Dark card border `rgba(255,255,255,0.07→0.10)`, light `rgba(0,0,0,0.08→0.12)` | `globals.css` |
| Graph nodes | 175×52px → 210×64px; label 11→13px; badge 9→11px; strip 3→5px; dot 8→10px | `GraphView.tsx` |
| Graph edges | Required 1.5→2px; optional 1→1.5px dashed with larger dash pattern | `GraphView.tsx` |
| Graph viewport | Fixed 580px → `calc(100vh - 220px)` fills screen | `graph/page.tsx` |
| Graph minimap | Added (pannable + zoomable, colour-coded by mastery state) | `GraphView.tsx` |
| Graph search | Real-time skill filter input with clear button | `graph/page.tsx` |
| Graph nav | "Go to active" button jumps to current learning node | `graph/page.tsx` |
| Graph spacing | `nodesep 48→60`, `ranksep 90→120` | `GraphView.tsx` |
| Dashboard circles | 48→64px skill path circles; active nodes pulse with ring animation | `dashboard/page.tsx` |
| Dashboard UX | Scroll fade hints on path edges; connector line 1→2px | `dashboard/page.tsx` |
| Dashboard stats | Left accent bar on cards; values 30→36px; labels 11→12px | `dashboard/page.tsx` |
| Dashboard bars | Phase progress `h-1.5→h-2`; accordion `h-1→h-1.5` | `dashboard/page.tsx` |
| Dashboard icons | Emoji (🔒✅▶○) → SVG icons | `dashboard/page.tsx` |
| Question stem | 15→17px | `QuestionCard.tsx` |
| MCQ options | 13→15px, `py-3.5→py-4`, stronger tints | `QuestionCard.tsx` |
| Code blocks | 12→13px, more padding | `QuestionCard.tsx` |
| Feedback banner | `border-2`, background `/0.07→/0.12`, SVG icons, title 13→15px | `FeedbackBanner.tsx` |
| Explanation tabs | 11→12px; body 13→14px; key insight callout stronger | `ExplanationPanel.tsx` |
| Learn container | `max-w-2xl→max-w-3xl` | `learn/page.tsx` |
| ModeBar | Circles `w-4→w-5`; labels 10→12px; SVG checkmarks | `learn/page.tsx` |
| Buttons | Submit/Next `py-3.5→py-4`, 14→15px | `learn/page.tsx` |
| Navbar | Theme toggle: unicode → SVG sun/moon; tap targets `py-1.5→py-2`; links 12→13px | `Navbar.tsx` |
| Detail panel | Intuition 13→14px; meta pills 11→12px; close button is now SVG × | `SkillDetailPanel.tsx` |
| Prose styles | Added `.prose-synaptic` CSS block for consistent list/code/strong rendering | `globals.css` |
| Scrollbar | Added thin theme-aware scrollbar styles | `globals.css` |

---

---

## 1. Folder Structure, How It Works, and What Is Being Achieved

### Architecture Overview

Synaptic is a full-stack adaptive learning platform built on **Next.js 14 App Router + TypeScript + Tailwind CSS**, backed by **Supabase** (PostgreSQL + Auth + RLS). Content lives in plain JSON files in `content/` and is loaded at build-time via Node `require()`. The adaptive engine runs entirely in TypeScript on the server. Deployment target: Vercel + GitHub.

### Annotated File Tree

```
synaptic/
├── content/                         ← All teaching content (JSON, build-time loaded)
│   ├── graph/
│   │   ├── nodes.json              ← 31 skill nodes (intuition, analogy, why_it_matters on all)
│   │   ├── edges.json              ← 37 prerequisite edges (hard/soft), wired into DAG
│   │   └── meta.json               ← Graph version string
│   ├── questions/
│   │   ├── by-skill/
│   │   │   ├── p1_*.json  (12)     ← COMPLETE: 3–4 questions, tiers: same/harder/review
│   │   │   ├── p2_*.json  (9)      ← COMPLETE: same structure
│   │   │   └── p3–p8: ABSENT       ← 10 stub skills have empty question_ids arrays
│   │   └── diagnostic/questions.json  ← 12 placement questions for BKT initialisation
│   ├── explanations/
│   │   ├── p1_*/ (12 dirs × 3)    ← 36 files: key_insight, body, common_mistakes, mini_exercise in ALL
│   │   ├── p2_*/ (9 dirs × 3)     ← 27 files: same schema
│   │   └── p3–p8: ABSENT           ← No explanation dirs for 10 stub skills
│   └── templates/
│       ├── explanation_file.json   ← Complete template with all fields incl. real_world, build_task
│       └── question_file.json      ← Complete template with format guide
│
├── src/
│   ├── app/
│   │   ├── page.tsx                ← Landing (8-phase curriculum)
│   │   ├── (auth)/login+signup/    ← Supabase auth forms
│   │   ├── dashboard/page.tsx      ← Graph viz, p_know bars, mastery legend, due reviews
│   │   ├── learn/page.tsx          ← Study session: MCQ+fill, keyboard, motivation, analytics
│   │   ├── learn/diagnostic/       ← 12-question adaptive placement
│   │   ├── profile/page.tsx        ← Stats, 7-day heatmap, session history, top skills
│   │   └── api/
│   │       ├── attempt/route.ts    ← Hardened: server-verify, latency clamp, ownership check
│   │       ├── session/route.ts    ← start/next/end with adaptive engine
│   │       ├── explanation/route.ts ← Retrieval-first gate, p_know depth routing
│   │       ├── diagnostic/route.ts  ← Placement + 31-skill state init
│   │       ├── onboard/route.ts
│   │       └── analytics/route.ts
│   ├── components/
│   │   ├── learning/
│   │   │   ├── ExplanationPanel.tsx  ← Renders body, key_insight, mini_exercise, common_mistakes
│   │   │   │                           TABS for real_world/build_task/explain_back (UI ready)
│   │   │   ├── QuestionCard.tsx      ← MCQ (full) + fill (full) + explain (textarea stub)
│   │   │   ├── FeedbackBanner.tsx    ← Post-answer feedback
│   │   │   └── MotivationBanner.tsx  ← Motivation state overlay
│   │   ├── ui/                       ← Badge, ProgressBar, Spinner, mdToHtml
│   │   └── layout/                   ← EMPTY — no shared nav component
│   ├── lib/
│   │   ├── bkt/index.ts             ← Bayesian Knowledge Tracing (112 lines)
│   │   ├── sm2/index.ts             ← SM-2 + BKT↔SM2 sync (94 lines)
│   │   ├── session/engine.ts        ← 4-priority adaptive task selection (146 lines)
│   │   ├── graph/index.ts           ← DAG: Kahn's sort, prereq check (166 lines)
│   │   └── motivation/index.ts      ← 4-state FSM, 10-min cooldown (87 lines)
│   ├── hooks/useAnalytics.ts        ← 9 typed event types
│   ├── middleware.ts                 ← Route protection
│   └── types/index.ts               ← Full types: BuildTask, VisualElement, DepthLevel, SessionPhase
├── supabase/migrations/001+002.sql  ← 12 tables, RLS, RPCs
├── scripts/validate-content.js      ← CI content validator
└── content/CONTENT_GUIDE.md
```

### How the System Works — Content Flow

1. **Onboard** → `/api/onboard` creates `learner_profiles` + `motivation_states`
2. **Diagnostic** → 12-question placement. `/api/diagnostic` runs `placeLearner()`, initialises all 31 skill states and SM-2 schedules
3. **Study loop** → `/api/session` (start) calls `selectNextTask()` which reads skill states, SM-2 schedules, motivation → picks next question → learner answers → `/api/attempt` verifies server-side → updates BKT, SM-2, motivation → on correct: `/api/explanation` serves content at right depth
4. **Explanation** → `ExplanationPanel.tsx` renders body, key_insight, mini_exercise, common_mistakes, and (if present) tabs for real_world, build_task, explain_back
5. **Dashboard** → Server component reads all skill states, groups by phase, renders p_know bars

---

## 2. Current Implemented Items

### Content Stats
- **21 complete skills** (Phase 1: 12, Phase 2: 9)
- **66 total questions** (mcq: 50, fill: 16)
- **63 explanation files** · 164 KB of content
- **31 nodes, 37 edges** in prerequisite graph

### Field Coverage in Explanation Files
| Field | Coverage | Status |
|---|---|---|
| skill_id, depth, title, key_insight, body | 63/63 | ✅ Complete |
| common_mistakes, mini_exercise | 63/63 | ✅ Complete |
| real_world_usage | 6/63 (10%) | ❌ Missing in 90% |
| explain_back_prompt | 6/63 (10%) | ❌ Missing in 90% |
| build_task | 3/63 (5%) | ❌ Missing in 95% |
| visual_element | 0/63 | ❌ Entirely absent |
| level_breakdown | 0/63 | ❌ Entirely absent |

### Engine Layer — All Fully Implemented
| Module | Location | Status |
|---|---|---|
| BKT Engine | `src/lib/bkt/index.ts` | ✅ Implemented |
| SM-2 Engine | `src/lib/sm2/index.ts` | ✅ Implemented |
| Graph Engine | `src/lib/graph/index.ts` | ✅ Implemented |
| Session Engine | `src/lib/session/engine.ts` | ✅ Implemented |
| Motivation FSM | `src/lib/motivation/index.ts` | ✅ Implemented |

### API Layer — All Implemented and Hardened
All 6 routes: attempt, session, explanation, diagnostic, onboard, analytics — ✅ Implemented with security fixes applied

---

## 3. Missing Items

| Missing Item | Expected Location | Why It Matters |
|---|---|---|
| Phase 3–8 question files | `content/questions/by-skill/p3_*.json…` | 10 stub skills cannot be served to learners |
| Phase 3–8 explanation files | `content/explanations/p3_*/…` | No content after correct answers on P3–P8 |
| real_world_usage (57 files) | All explanation files | "Used in practice" tab is dead for 90% of skills |
| build_task (60 files) | All explanation files | Build task panel shows nothing for 95% of skills |
| explain_back_prompt (57 files) | All explanation files | Explain-back textarea has no prompt for 90% of skills |
| visual_element (63 files) | All explanation files + ExplanationPanel | Not rendered or present anywhere |
| level_breakdown (63 files) | All explanation files + ExplanationPanel | Recursive breakdown teaching layer entirely absent |
| Explain-back DB save | `/api/attempt` or new route | Submission fires analytics only — no BKT credit |
| Build-task DB save | `/api/attempt` or new route | Completion fires analytics only — no BKT credit |
| code/order question renderers | `QuestionCard.tsx` | Cannot add these question types to any skill |
| Layout component | `src/components/layout/` | Empty dir — each page re-implements nav inline |
| Validator extended field checks | `scripts/validate-content.js` | Authors get no warning when extended fields are absent |
| Monaco code editor | `QuestionCard.tsx` | Plain textarea — poor UX for developer learning platform |
| Study schedule UI | Dashboard or profile | `implementation_intentions` table exists; no UI |

---

## 4. Items That Should Exist in a Complete System

| Required Item | Level | Current State |
|---|---|---|
| Super Simple Start (L0 hook) | L0 | Partial — analogies present but no enforced hook field |
| Intuition Layer | L1 | ✅ Done — all 31 nodes have intuition field |
| Analogy Section | L2 | ✅ Done — all 31 nodes have analogy field |
| Recursive Breakdown | L3 | ❌ Missing — typed only, never populated or rendered |
| Technical Depth (mid/advanced) | L4 | ✅ Done — 63 files present |
| Real-World Usage | L5 | ⚠ Partial — 6/63 files |
| Mini Build Task | L6 | ⚠ Partial — 3/63 files, completion not saved |
| Explain-Back Loop | — | ⚠ Partial — 6/63 prompts, not saved to DB |
| Visual/Interactive Element | — | ❌ Missing — typed only |
| MCQ Questions | — | ⚠ Partial — 21/31 skills |
| Fill-in Questions | — | ⚠ Partial — 21/31 skills |
| Code Questions | — | ❌ Missing — typed, no renderer, no content |
| Order Questions | — | ❌ Missing — typed, no renderer, no content |
| Adaptive Difficulty | — | ✅ Done |
| Spaced Repetition (SM-2) | — | ✅ Done |
| BKT | — | ✅ Done |
| Prerequisite Graph | — | ✅ Done |
| Motivation FSM | — | ✅ Done |
| Diagnostic Placement | — | ✅ Done |
| 8-Phase Curriculum (content) | — | ⚠ Partial — P1+P2 only |
| Post-answer Feedback | — | ✅ Done |
| Content Validator | — | ⚠ Partial — checks structure only |
| Content Templates | — | ✅ Done |
| Layout Component Library | — | ❌ Missing — directory empty |
| Monaco Code Editor | — | ❌ Missing — plain textarea used |

---

## 5. Requirement-by-Requirement Status

| Requirement | Status | Current Location | Gap |
|---|---|---|---|
| L0 Hook | Partial | beginner.json body | No enforced `hook` field; add to schema + validator |
| L1 Intuition | ✅ Done | nodes.json | — |
| L2 Analogy | ✅ Done | nodes.json | Not surfaced as separate UI section |
| L3 Recursive Breakdown | ❌ Missing | types/index.ts (typed) | Add content + renderer |
| L4 Technical Depth | ✅ Done | mid.json + advanced.json | — |
| L5 Real-World Usage | ⚠ Partial | ExplanationPanel tab + 6/63 files | Add to 57 files |
| L6 Mini Build Task | ⚠ Partial | ExplanationPanel + 3/63 files | Add to 60 files; wire to DB |
| Explain-Back Loop | ⚠ Partial | ExplanationPanel + 6/63 files | Add to 57 files; wire to DB |
| Visual Element | ❌ Missing | types/index.ts (typed) | Build renderer; add content |
| MCQ/Fill Questions | ⚠ Partial | questions/by-skill/ (21/31) | Add for P3–P8 |
| Code Questions | ❌ Missing | QuestionFormat type | Build renderer; add content |
| Order Questions | ❌ Missing | QuestionFormat type | Build renderer; add content |
| Adaptive Difficulty | ✅ Done | session/engine.ts | — |
| Spaced Repetition | ✅ Done | lib/sm2/ | — |
| BKT | ✅ Done | lib/bkt/ | — |
| Prerequisite Graph | ✅ Done | content/graph/ + lib/graph/ | — |
| Motivation FSM | ✅ Done | lib/motivation/ | — |
| 8-Phase Curriculum | ⚠ Partial | nodes.json | P1+P2 content exists; P3–P8 are stubs |
| Post-answer Feedback | ✅ Done | FeedbackBanner + explanation_after | — |
| Content Validator | ⚠ Partial | scripts/validate-content.js | Add warnings for missing extended fields |
| Content Templates | ✅ Done | content/templates/ | — |
| Auth + Route Protection | ✅ Done | middleware.ts | — |
| Database Schema | ✅ Done | supabase/migrations/ | — |
| Profile Page | ✅ Done | app/profile/page.tsx | — |
| Layout Components | ❌ Missing | src/components/layout/ | Empty dir |
| Code Editor | ❌ Missing | QuestionCard.tsx | Plain textarea |
| Study Schedule UI | ❌ Missing | (table exists in DB) | No UI |

---

## 6. Gap Analysis Against the Master Prompt

### Strongly Aligned ✅
- Adaptive engine (BKT + SM-2 + motivation + session) — fully implemented, integrated, hardened
- Prerequisite graph — 31 nodes, 37 edges, live and correct
- Base explanation layers (L1–L2) — all 63 files have key_insight, body, common_mistakes, mini_exercise
- Security — 9 critical fixes applied
- Content quality infrastructure — templates, guide, validator all present

### Weak — Present But Incomplete ⚠
- **L5 Real-World Usage** — UI built, 6/63 content files
- **L6 Build Task** — UI fully built, 3/63 content files, completion not saved to DB
- **Explain-Back** — UI built, 6/63 prompts, not saved to DB (no adaptive effect)
- **8-Phase Curriculum** — P1+P2 only; P3–P8 are navigable stubs with no content
- **Question variety** — only MCQ and fill; explain/code/order have no content or renderers

### Absent — Concept Only ❌
- **L3 Recursive Breakdown** — typed in DepthLevel, never populated or rendered
- **Visual/Interactive Element** — typed in VisualElement, not rendered or in any content
- **Code/Order question formats** — typed, no renderer, no questions
- **Layout component library** — directory empty
- **Monaco code editor** — plain textarea used
- **Study schedule UI** — DB table exists, no UI
- **Explain-back + build-task DB persistence** — fires analytics only; no BKT credit

---

## 7. Missing Content and Missing Phases Guide

### 7.1 Priority Matrix

| Content Item | Count Missing | Priority | Effort |
|---|---|---|---|
| P3 questions + explanations | 3 skills | 🔴 Highest | 30–60 min/skill |
| P4 questions + explanations | 2 skills | 🔴 Highest | 60–90 min/skill |
| P5–P8 questions + explanations | 5 skills | 🟠 High | 60–120 min/skill |
| real_world_usage (57 files) | 57 additions | 🟠 High | 5–10 min/file |
| explain_back_prompt (57 files) | 57 additions | 🟠 High | 3–5 min/file |
| build_task (60 files) | 60 additions | 🟡 Medium | 15–25 min/file |

### 7.2 Phase 3–8 Prerequisite Order

Add content in this order (prerequisites first):
`p3_what_is_ai → p3_ai_vs_ml_vs_dl → p4_data_pipeline → p4_supervised_learning → p5_neural_network_basics → p6_transformers → p6_embeddings → p6_rag_systems → p7_ai_apis → p8_system_design_ai`

### 7.3 Technical Guide

**Add extended fields to explanation files:**
Open `content/explanations/{skill}/{depth}.json`, add JSON fields at the end of the object, run `npm run validate`. No code changes.

**Extend validator:**
In `scripts/validate-content.js` around line 150, add:
```js
if (exp && !exp.real_world_usage)   warn(`${node.id}/${depth}.json missing 'real_world_usage'`)
if (exp && !exp.explain_back_prompt) warn(`${node.id}/${depth}.json missing 'explain_back_prompt'`)
if (exp && !exp.build_task)          warn(`${node.id}/${depth}.json missing 'build_task'`)
```

**Wire explain-back to DB:**
In `src/app/learn/page.tsx`, `onExplainBack` callback (line 295): POST to `/api/attempt` with `format: 'explain'`, `correct: true`, question_id. No new API route needed.

**Add Phase 3–8 question files:**
1. Copy `content/templates/question_file.json`
2. Rename to `content/questions/by-skill/{skill_id}.json`
3. Fill all fields
4. Update `content/graph/nodes.json` — add question IDs to `question_ids` array
5. Run `npm run validate`

### 7.4 Content Guide

**Question writing:**
- `same-tier MCQ`: Core concept at face value. Distractors = real misconceptions.
- `harder-tier MCQ`: Apply in AI/ML context. Numbers, code, or real system scenarios.
- `review-tier fill`: Key term completion (1–4 word answer). Most-forgotten thing.
- `explanation_after`: Always connect to AI engineering. "In PyTorch you'll…"

**Explanation depths:**
- `beginner.json`: Analogy first. No jargon in para 1. Code 5–10 lines.
- `mid.json`: Technical terminology. Real ML patterns. Code 10–30 lines.
- `advanced.json`: Production concerns, trade-offs, papers, tools. Reference FAISS, Flash Attention, etc.

**real_world_usage template:**
"[Concept] is used in [specific tool/company] because [technical reason]. The concrete consequence is [what engineers do]. Without understanding [concept], you would [common error]."

**build_task template:**
- title: Action verb + noun ("Build a Tokeniser Counter")
- steps: 4–6 concrete, unambiguous actions
- expected_output: Exact numbers, shapes, or printed values
- hint: Smallest nudge that doesn't give the answer away

---

## 8. Practical Integration Plan

### Wave 1 — Content Fill (No Code Changes)

**Step 1:** Add `real_world_usage` + `explain_back_prompt` to all 57 existing explanation files. UI already renders them. Highest ROI — no code changes.

**Step 2:** Add `build_task` to 60 explanation files. ExplanationPanel renders all subfields. No code changes.

**Step 3:** Create Phase 3 question files (`p3_what_is_ai.json`, `p3_ai_vs_ml_vs_dl.json`, `p4_data_pipeline.json`), create matching explanation dirs with beginner/mid/advanced.json, update `nodes.json` question_ids. Run `npm run validate`.

**Step 4:** Create Phase 4–8 content in prerequisite order. Same process as Step 3.

### Wave 2 — Validator Enhancement (Minor Code Change)

**Step 5:** Add 3 `warn()` calls to `scripts/validate-content.js` for missing real_world_usage, explain_back_prompt, build_task. No breaking changes.

### Wave 3 — UI Features (Moderate Code Changes)

**Step 6:** Wire explain-back and build-task to DB. File: `learn/page.tsx`. Call `/api/attempt` in both callbacks. No new API routes needed.

**Step 7:** Extract shared `Navbar.tsx` into `src/components/layout/`. Import in all 5 pages. Pure refactor.

**Step 8:** Add `visual_element` renderer to ExplanationPanel. Add `'visual'` SubPhase. Render by type.

### Wave 4 — Advanced Features (Significant Changes)

**Step 9:** Install Monaco: `npm install @monaco-editor/react`. Add code format renderer to QuestionCard.

**Step 10:** Build order question renderer using HTML5 drag API or `@dnd-kit/core`.

**Step 11:** Add `level_breakdown` accordion renderer to ExplanationPanel. Backfill content.

### After Each Wave — Verification

```bash
npm run validate   # must show 0 errors, 0 warnings
npm run dev        # app boots without TypeScript errors
# Navigate to a skill, start session, verify new content appears
```

### Rules — Never Break

```
✗ NEVER delete nodes from nodes.json → set "deprecated": true
✗ NEVER edit 001 or 002 migration files → create 003_*.sql for changes
✗ NEVER restore trusting body.correct in /api/attempt
✓ ALWAYS sync question_ids in nodes.json when adding question files
✓ ALWAYS run npm run validate before committing
✓ ALWAYS use require() not fetch() for loading content in Next.js
```

---

*Synaptic Full Audit · March 2026 · Validator: ✅ 0 errors, 0 warnings*
