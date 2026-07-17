# MindBridge AI

An AI tutor for intro data structures & algorithms that diagnoses *why* a student is stuck rather than just answering their question. Uses one LLM call to hypothesize the missing prerequisite, then validates and teaches from a static knowledge graph.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mindbridge run dev` — run the frontend (port 18425)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter (routing), TanStack Query, Tailwind CSS
- API: Express 5 (shared api-server artifact)
- LLM: Anthropic Claude Haiku (diagnosis only, via `ANTHROPIC_API_KEY` secret)
- Validation: Zod 3, Orval codegen from OpenAPI spec
- No database — mastery state lives in React state (in-memory for hackathon demo)

## Where things live

- `artifacts/api-server/src/data/graph.json` — knowledge graph with 15 DSA nodes (the source of truth for all teaching content)
- `artifacts/api-server/src/lib/llm.ts` — Anthropic LLM wrapper with timeout + fallback
- `artifacts/api-server/src/routes/mindbridge.ts` — all five API routes
- `artifacts/mindbridge/src/` — React frontend
- `lib/api-spec/openapi.yaml` — API contract (source of truth for types)

## API Routes

- `POST /api/diagnose` — LLM call → `{ asked_topic, hypothesis_node, confidence, fallback }`
- `POST /api/validate` — static lookup → validation multiple-choice question
- `POST /api/teach` — static lookup → explanation + analogy
- `POST /api/quiz` — static lookup → quiz questions
- `POST /api/progress` — pure logic → next recommended node + full mastery map

## Architecture decisions

- Only `/api/diagnose` calls the LLM (claude-haiku-4-5, 8s timeout). All other routes are static lookups from graph.json — keeps the demo reliable.
- Fallback: if the LLM call fails/times out, diagnose returns `{ fallback: true }` with a safe default node instead of an error.
- Mastery state is purely client-side React state — no database, intentional for hackathon demo.
- graph.json loaded once at server startup and cached in memory.

## Product

Six-step tutoring loop:
1. Student types a question → AI diagnoses the missing prerequisite
2. Validation question confirms the gap
3. Explanation + analogy teaches the confirmed gap
4. Quiz tests retention, updates mastery score
5. Mastery dashboard shows Duolingo-style progress bars per topic
6. Learning path recommends what to study next

## User preferences

_Populate as needed._

## Gotchas

- `ANTHROPIC_API_KEY` secret must be set or the diagnose endpoint falls back gracefully.
- The api-server uses esbuild; `zod/v4` subpath import doesn't resolve — use `"zod"` (v3 is in the catalog).
- After changing openapi.yaml, always run codegen before editing routes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
