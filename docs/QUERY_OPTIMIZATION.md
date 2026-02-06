# 🔍 Query Optimization Guide

## Overview

This document provides optimized query patterns that leverage the new database indexes for maximum performance.

## Optimized Query Patterns

### Tasks Queries

#### 1. Get User Tasks (Default Sorting)
```sql
-- ✅ OPTIMIZED: Uses idx_tasks_user_created_desc
SELECT * FROM tasks 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- ❌ AVOID: Without user_id filter
SELECT * FROM tasks ORDER BY created_at DESC;
```

#### 2. Filter by Status
```sql
-- ✅ OPTIMIZED: Uses idx_tasks_user_status
SELECT * FROM tasks 
WHERE user_id = $1 AND status = $2 
ORDER BY created_at DESC;

-- For active tasks only, use partial index:
SELECT * FROM tasks 
WHERE user_id = $1 AND status != 'done' 
ORDER BY created_at DESC;
-- Uses: idx_tasks_user_active
```

#### 3. Filter by Due Date
```sql
-- ✅ OPTIMIZED: Uses idx_tasks_user_due_date
SELECT * FROM tasks 
WHERE user_id = $1 
  AND due_date IS NOT NULL 
  AND due_date::date = CURRENT_DATE
ORDER BY due_date ASC;
```

#### 4. Sort by Priority
```sql
-- ✅ OPTIMIZED: Uses idx_tasks_user_priority
SELECT * FROM tasks 
WHERE user_id = $1 
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 0 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END,
  created_at DESC;
```

#### 5. Filter by Project and Status
```sql
-- ✅ OPTIMIZED: Uses idx_tasks_user_project_status
SELECT COUNT(*) FROM tasks 
WHERE user_id = $1 
  AND project_id = $2 
  AND status != 'done';
```

#### 6. Tag Filtering
```sql
-- ✅ OPTIMIZED: Uses idx_tasks_tags_gin (GIN index)
SELECT * FROM tasks 
WHERE user_id = $1 
  AND tags @> ARRAY[$2]::text[]
ORDER BY created_at DESC;

-- Multiple tags (AND)
SELECT * FROM tasks 
WHERE user_id = $1 
  AND tags @> ARRAY[$2, $3]::text[];

-- Any tag (OR)
SELECT * FROM tasks 
WHERE user_id = $1 
  AND tags && ARRAY[$2, $3]::text[];
```

### Analytics Queries

#### 1. Overview Metrics (Optimized Single Query)
```sql
-- ✅ OPTIMIZED: Single query instead of 7 separate queries
-- Uses: idx_ai_events_user_type_time
SELECT 
  COUNT(DISTINCT date_trunc('day', created_at)) AS dau,
  COUNT(*) FILTER (WHERE type = 'chat_started') AS sessions,
  COUNT(*) FILTER (WHERE type = 'message_sent') AS messages,
  SUM(CASE WHEN type = 'suggestion_accepted' THEN 1 ELSE 0 END)::float / 
    NULLIF(SUM(CASE WHEN type IN ('suggestion_accepted','suggestion_rejected') THEN 1 ELSE 0 END), 0) AS acceptance_rate
FROM ai_events 
WHERE user_id = $1 
  AND created_at BETWEEN $2 AND $3;
```

#### 2. Trends Query (Optimized)
```sql
-- ✅ OPTIMIZED: Single aggregation instead of multiple subqueries
-- Uses: idx_ai_events_date_trunc
WITH date_series AS (
  SELECT generate_series(
    date_trunc('day', $1::timestamptz), 
    date_trunc('day', $2::timestamptz), 
    interval '1 day'
  ) AS d
)
SELECT 
  ds.d::date AS date,
  COUNT(DISTINCT e.user_id) AS users,
  COUNT(*) FILTER (WHERE e.type = 'chat_started') AS sessions,
  COUNT(*) FILTER (WHERE e.type = 'message_sent') AS messages,
  SUM(CASE WHEN e.type = 'suggestion_accepted' THEN 1 ELSE 0 END)::float / 
    NULLIF(SUM(CASE WHEN e.type IN ('suggestion_accepted','suggestion_rejected') THEN 1 ELSE 0 END), 0) AS acceptance_rate
FROM date_series ds
LEFT JOIN ai_events e ON date_trunc('day', e.created_at) = ds.d
WHERE e.created_at BETWEEN $1 AND $2 OR e.created_at IS NULL
GROUP BY ds.d
ORDER BY ds.d ASC;
```

#### 3. Heatmap Query
```sql
-- ✅ OPTIMIZED: Uses idx_ai_events_type_created
SELECT 
  EXTRACT(DOW FROM created_at)::int AS dow,
  EXTRACT(HOUR FROM created_at)::int AS hour,
  COUNT(*) AS count
FROM ai_events 
WHERE type = 'message_sent' 
  AND created_at BETWEEN $1 AND $2
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Tool Calls Queries

#### 1. Success Rate
```sql
-- ✅ OPTIMIZED: Uses idx_ai_tool_calls_user_status_time
SELECT 
  AVG(CASE WHEN status = 'success' THEN 1.0 ELSE 0.0 END) AS success_rate,
  COUNT(*) AS total_calls,
  AVG(latency_ms) AS avg_latency
FROM ai_tool_calls 
WHERE user_id = $1 
  AND created_at BETWEEN $2 AND $3;
```

## Query Performance Tips

### 1. Always Filter by user_id First
```sql
-- ✅ GOOD: Index can be used efficiently
WHERE user_id = $1 AND status = $2

-- ❌ BAD: Full table scan
WHERE status = $2
```

### 2. Use Partial Indexes When Possible
```sql
-- ✅ GOOD: Uses partial index idx_tasks_user_active
WHERE user_id = $1 AND status != 'done'

-- ❌ LESS EFFICIENT: Uses full index
WHERE user_id = $1 AND status IN ('todo', 'in_progress', 'review')
```

### 3. Limit Result Sets
```sql
-- ✅ GOOD: Limits data transfer
SELECT * FROM tasks 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 50;
```

### 4. Use EXPLAIN ANALYZE
```sql
-- Check query execution plan
EXPLAIN ANALYZE 
SELECT * FROM tasks 
WHERE user_id = 1 AND status = 'todo';
```

### 5. Avoid Functions on Indexed Columns
```sql
-- ❌ BAD: Can't use index on created_at
WHERE DATE(created_at) = CURRENT_DATE

-- ✅ GOOD: Can use index
WHERE created_at >= CURRENT_DATE::date 
  AND created_at < (CURRENT_DATE + 1)::date
```

## Common Anti-Patterns to Avoid

### 1. N+1 Query Problem
```sql
-- ❌ BAD: Multiple queries
for each project:
  SELECT * FROM tasks WHERE project_id = $1

-- ✅ GOOD: Single query
SELECT * FROM tasks WHERE project_id = ANY($1::int[])
```

### 2. Unnecessary ORDER BY
```sql
-- ❌ BAD: Sorting when not needed
SELECT COUNT(*) FROM tasks WHERE user_id = $1 ORDER BY created_at

-- ✅ GOOD: No sorting needed
SELECT COUNT(*) FROM tasks WHERE user_id = $1
```

### 3. SELECT * When Not Needed
```sql
-- ❌ BAD: Fetching all columns
SELECT * FROM tasks WHERE user_id = $1

-- ✅ GOOD: Only needed columns
SELECT id, title, status FROM tasks WHERE user_id = $1
```

### 4. Multiple OR Conditions
```sql
-- ❌ BAD: Multiple index scans
WHERE status = 'todo' OR status = 'in_progress'

-- ✅ GOOD: Single index scan
WHERE status IN ('todo', 'in_progress')
```

## Monitoring Query Performance

### Enable Query Logging
```sql
-- In postgresql.conf
log_min_duration_statement = 100  -- Log queries > 100ms
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Use pg_stat_statements
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

## Backend Implementation Examples

### Optimized Tasks Route
```javascript
// Get tasks with optimized query
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, project_id, sort_by = 'created_at', limit = 100 } = req.query;
    
    let query = 'SELECT id, title, description, status, priority, due_date, project_id, tags, created_at FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    
    // Add filters
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (project_id) {
      query += ` AND project_id = $${paramIndex}`;
      params.push(project_id);
      paramIndex++;
    }
    
    // Add sorting (uses appropriate index)
    switch (sort_by) {
      case 'priority':
        query += ' ORDER BY priority, created_at DESC';
        break;
      case 'due_date':
        query += ' ORDER BY due_date NULLS LAST, created_at DESC';
        break;
      default:
        query += ' ORDER BY created_at DESC';
    }
    
    // Add limit
    query += ` LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(400).json({ error: err.message });
  }
});
```

## Testing Query Performance

### Benchmark Script
```javascript
// test-query-performance.js
import pool from './db.js';

async function benchmarkQuery(query, params, iterations = 100) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await pool.query(query, params);
    times.push(Date.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`Query: ${query.substring(0, 50)}...`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${min}ms, Max: ${max}ms`);
}

// Test queries
await benchmarkQuery(
  'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
  [1]
);
```

## Summary

1. **Always filter by user_id first** - Enables index usage
2. **Use composite indexes** - Match WHERE clause order
3. **Leverage partial indexes** - For common filtered queries
4. **Use GIN indexes** - For array and JSONB operations
5. **Limit result sets** - Reduce data transfer
6. **Monitor performance** - Use EXPLAIN ANALYZE and pg_stat_statements
7. **Avoid N+1 queries** - Batch operations when possible

