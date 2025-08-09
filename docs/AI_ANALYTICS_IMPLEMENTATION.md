## AI Analytics Page — Implementation Plan

This document defines the end‑to‑end plan to implement an AI Analytics page for the project. It is tailored to the current stack (Express + PostgreSQL + React + Recharts) and assumes Gemini as the LLM provider.

### Objectives
- **Visibility**: Understand assistant adoption, performance, quality, and cost.
- **Actionability**: Provide insights that directly guide prompt/tool UX improvements.
- **Safety & Privacy**: Collect only the minimum metrics; avoid storing raw message content in analytics tables.

### Key Metrics (KPIs)
- **Adoption**
  - Daily active AI users
  - AI sessions per day
  - Messages per session
- **Action Impact**
  - Suggestions proposed → confirmations shown → accepted (acceptance rate)
  - Tasks/Projects created/updated via AI
- **Quality**
  - User rating (thumbs up/down)
  - Reversal/rollback rate
  - Confirmation declines
- **Performance**
  - Total response latency (p50/p95)
  - Model time vs tool call time
  - Tool call success rate
- **Cost/Usage**
  - Input/output tokens or character counts
  - Model usage by model name
  - Estimated spend
- **Safety**
  - Safety‑blocked response count
  - Redactions performed

### Architecture Summary
- Backend (`backend/`)
  - New routes: `ai.js` (chat with instrumentation) and `ai_analytics.js` (read APIs)
  - New tables for events, tool calls, and daily aggregates
  - Optional nightly aggregation job (Node cron) or on‑write aggregation
- Frontend (`src/`)
  - New page `AIAnalytics.tsx`
  - Hook `useAIAnalytics.ts` for fetching analytics
  - Reusable charts/cards components

### Environment
- `.env` (backend)
  - `PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD`
  - `JWT_SECRET`
  - `GOOGLE_API_KEY`
  - Optional: `AI_MODEL=gemini-1.5-flash`

### Database Schema

Do not store raw message content in analytics tables; store counts and metadata. Chat/message content continues to live in `ai_chats`/`ai_messages` if you implement history.

```sql
-- Atomic events across the assistant lifecycle
CREATE TABLE IF NOT EXISTS ai_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id INTEGER,
  type TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool invocation records (for latency and reliability)
CREATE TABLE IF NOT EXISTS ai_tool_calls (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id INTEGER,
  tool_name TEXT NOT NULL,
  args JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  latency_ms INTEGER,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregates for fast dashboard queries
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  date DATE NOT NULL,
  model TEXT,
  users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  suggestions INTEGER DEFAULT 0,
  accepted INTEGER DEFAULT 0,
  tool_calls INTEGER DEFAULT 0,
  tool_success_rate NUMERIC,
  p50_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  cost_usd NUMERIC DEFAULT 0,
  PRIMARY KEY (date, model)
);
```

If you also implement chat history:

```sql
CREATE TABLE IF NOT EXISTS ai_chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Backend Changes

- Dependencies
  - `@google/generative-ai`, `zod`, `chrono-node`, `eventsource-parser`
  - Optional: `express-rate-limit`, `pino` for logs

- Routes
  - `backend/routes/ai.js`
    - `POST /ai/chat` (streamed or non‑streamed)
    - Emit `ai_events`: `chat_started`, `message_sent`, `streaming_started`, `streaming_completed`, `safety_blocked`
    - Emit `ai_tool_calls`: `tool_call_started`, `tool_call_succeeded`, `tool_call_failed`
    - Record: model name, durations, input/output tokens/characters
    - Use JWT for user scoping; remove any reliance on hardcoded user ids
  - `backend/routes/ai_analytics.js`
    - `GET /ai/analytics/overview?from&to`
    - `GET /ai/analytics/trends?from&to&granularity=day|week`
    - `GET /ai/analytics/funnel?from&to`
    - `GET /ai/analytics/heatmap?from&to`
    - `GET /ai/analytics/model-breakdown?from&to`
    - `GET /ai/analytics/cost?from&to`
    - `POST /ai/analytics/feedback` (thumbs up/down + optional text)

- Aggregation
  - Job: `backend/jobs/aggregate_ai_usage.js` (cron daily at 00:15)
  - Input: `ai_events`, `ai_tool_calls`; Output: `ai_usage_daily`
  - Store p50/p95 latencies, totals, success rates, tokens, cost estimates

- Security/Privacy
  - All `/ai/*` routes require `Authorization: Bearer <jwt>`
  - No raw message text in `ai_events`/`ai_tool_calls`/`ai_usage_daily`
  - Redact sensitive args in `ai_tool_calls.args` (e.g., truncate long texts)

### Frontend Changes

- New Page: `src/pages/AIAnalytics.tsx`
  - Overview cards: DAU, Sessions, Acceptance Rate, Tool Success Rate, p95 Latency, Est. Cost
  - Trends: line charts for messages/sessions/acceptance
  - Funnel: suggested → confirmed → accepted
  - Heatmap: interactions by hour/day (reuse style from `src/pages/Analytics.tsx`)
  - Model breakdown: stacked bars by model
  - Cost/usage: tokens or character counts per day
  - Feedback feed: recent thumbs up/down

- Hook: `src/hooks/useAIAnalytics.ts`
  - Wraps `GET /ai/analytics/*` endpoints using React Query

- Navigation
  - Add route in `src/App.tsx`: `/ai-analytics`
  - Add item in `src/components/layout/Sidebar.tsx`: “AI Analytics”

### API Contracts (Read‑only)

```http
GET /ai/analytics/overview?from=2025-01-01&to=2025-01-31
Response: {
  dau: number,
  sessions: number,
  messages: number,
  acceptanceRate: number,
  toolSuccessRate: number,
  p95LatencyMs: number,
  estimatedCostUsd: number
}

GET /ai/analytics/trends?from=...&to=...&granularity=day
Response: Array<{ date: string, users: number, sessions: number, messages: number, acceptanceRate: number }>

GET /ai/analytics/funnel?from=...&to=...
Response: { suggested: number, shownForConfirmation: number, accepted: number, declined: number }

GET /ai/analytics/heatmap?from=...&to=...
Response: { matrix: number[][], max: number }

GET /ai/analytics/cost?from=...&to=...
Response: Array<{ date: string, inputTokens: number, outputTokens: number, costUsd: number }>
```

### Instrumentation Events (Write)

- `chat_started`, `message_sent`, `streaming_started`, `streaming_completed`, `safety_blocked`
- `tool_call_started`, `tool_call_succeeded`, `tool_call_failed`
- `suggestion_accepted`, `suggestion_rejected`
- `rating_given` (properties: `rating: 'up'|'down'`, `comment?: string`)

### Progress Tracking (Phases with Text Bars)

- **Phase 0 — Foundations** `[#####-----] 50%`
  - Gemini decision and env keys
  - KPIs and schema definition
  - Repo scan/prereqs

- **Phase 1 — Event Logging** `[##--------] 20%`
  - Create tables `ai_events`, `ai_tool_calls`, `ai_usage_daily`
  - Instrument `/ai/chat` to emit events and timings
  - Persist token/character usage (per provider reports)

- **Phase 2 — Aggregation & APIs** `[#---------] 10%`
  - Cron job to populate `ai_usage_daily`
  - Implement read endpoints (`overview`, `trends`, `funnel`, `heatmap`, `model-breakdown`, `cost`)

- **Phase 3 — Frontend UI** `[----------] 0%`
  - Build `AIAnalytics.tsx`, hook, and cards/charts
  - Add navigation and state management

- **Phase 4 — Feedback & Quality** `[----------] 0%`
  - Add thumbs up/down to Assistant chat UI
  - Show recent feedback and acceptance trends

- **Phase 5 — Hardening & Docs** `[----------] 0%`
  - Indexes, caching, error budgets, privacy review
  - README/runbooks and dashboard usage tips

Legend: `#` = 10% complete, `-` = remaining.

### Testing & Validation
- Seed script to generate synthetic events for charts
- Contract tests for `/ai/analytics/*` endpoints
- Visual QA for charts with empty, sparse, and dense datasets
- Spot SQL checks must match UI KPIs within ±1%

### Acceptance Criteria
- Backend records events and exposes analytics read APIs with `from/to` filters
- Frontend shows KPIs, trends, funnel, heatmap, and cost/model charts
- Acceptance rate, tool success rate, and p95 latency validated against SQL
- No PII in analytics tables; all routes gated by JWT

### File Map (Planned)
- Backend
  - `backend/routes/ai.js`
  - `backend/routes/ai_analytics.js`
  - `backend/jobs/aggregate_ai_usage.js`
  - `backend/db/migrations/xxxx_ai_analytics.sql`
- Frontend
  - `src/pages/AIAnalytics.tsx`
  - `src/hooks/useAIAnalytics.ts`
  - `src/components/ai-analytics/*`
  - Route additions in `src/App.tsx` and `src/components/layout/Sidebar.tsx`

### Notes & Recommendations
- Start with character counts for usage if token counts are not directly available; convert via a stable factor and label as estimate.
- Keep a small rolling raw events window (e.g., 30 days) and rely on the daily aggregate for long‑range charts.
- Consider feature flags to toggle advanced charts without redeploys.


