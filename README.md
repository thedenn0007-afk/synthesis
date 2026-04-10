# Synaptic — Adaptive AI Engineering Learning Platform

Adaptive learning platform built with **Next.js 14 + TypeScript + Tailwind CSS**.
Primary storage: **SQLite** (zero-config, local-first). Optional: Supabase.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit JWT_SECRET to a random string

# 3. Start development server
npm run dev
# Opens at http://localhost:3000

# 4. Validate content files
npm run validate
```

# synthesis

## Storage Architecture

### Default: SQLite (Local)
- Zero configuration required
- Database file: `data/synaptic.db` (auto-created on first run)
- Auth: bcryptjs + JWT cookies (no external service needed)
- All data stays on your machine

### Optional: Supabase
Set `DB_BACKEND=supabase` in `.env.local` and add Supabase env vars.
See `supabase/migrations/` for the schema to run in Supabase SQL Editor.

## Project Structure

```
synaptic/
├── content/              ← Teaching content (JSON files)
│   ├── graph/            ← 31 skill nodes, 37 prerequisite edges
│   ├── questions/        ← 66 questions (P1+P2 complete)
│   └── explanations/     ← 63 explanation files (P1+P2 complete)
├── src/
│   ├── app/              ← Next.js pages and API routes
│   ├── components/       ← UI components
│   ├── lib/
│   │   ├── db/           ← SQLite layer (index.ts, auth.ts, queries.ts)
│   │   ├── bkt/          ← Bayesian Knowledge Tracing engine
│   │   ├── sm2/          ← Spaced repetition (SM-2) engine
│   │   ├── graph/        ← DAG prerequisite engine
│   │   ├── session/      ← Adaptive task selection engine
│   │   └── motivation/   ← Motivation state machine
│   └── types/            ← TypeScript type definitions
├── scripts/
│   ├── validate-content.js  ← Content validator
│   ├── init-db.js           ← Database init
│   └── reset-db.js          ← Database reset
└── data/
    └── synaptic.db       ← SQLite database (git-ignored)
```

## Adding Content

For Phase 3-8 skills, follow the guide in `content/CONTENT_GUIDE.md`.

After adding any content files, run:
```bash
npm run validate  # must show 0 errors, 0 warnings
```

## Invariants — Never Break These

```
✗ NEVER delete nodes from nodes.json → set "deprecated": true
✗ NEVER edit existing migration files → create new ones
✗ NEVER trust body.correct in /api/attempt (server-side verification only)
✓ ALWAYS run npm run validate before committing
✓ ALWAYS sync question_ids in nodes.json when adding question files
```
