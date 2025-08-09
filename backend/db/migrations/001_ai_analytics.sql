-- AI Analytics schema (idempotent)

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

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ai_events_user_time ON ai_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_type_time ON ai_events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_user_time ON ai_tool_calls(user_id, created_at DESC);


