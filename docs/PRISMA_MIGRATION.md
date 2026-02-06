# 🔄 Prisma ORM Migration Guide

## Overview

This project has been migrated from raw SQL queries using `pg` to **Prisma ORM** for better type safety, developer experience, and maintainability.

## What Changed

### 1. Database Connection
- **Before**: Direct PostgreSQL pool connection (`pg`)
- **After**: Prisma Client with connection pooling

### 2. Query Methods
- **Before**: Raw SQL with `pool.query()`
- **After**: Prisma query methods (`prisma.model.findMany()`, etc.)
- **Complex Queries**: Still use `prisma.$queryRaw` for analytics

### 3. Type Safety
- **Before**: Manual type definitions
- **After**: Auto-generated TypeScript types from Prisma schema

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `@prisma/client` - Prisma client for database access
- `prisma` - Prisma CLI (dev dependency)

### 2. Configure Database URL

Create or update `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db?schema=public"
```

**Note**: Prisma uses `DATABASE_URL` instead of separate `PGHOST`, `PGPORT`, etc.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client based on `prisma/schema.prisma`.

### 4. Run Migrations

#### Option A: Use Prisma Migrate (Recommended)

```bash
# Create initial migration from existing database
npm run prisma:migrate

# Or push schema directly (for development)
npm run prisma:push
```

#### Option B: Keep Existing SQL Migrations

The existing SQL migrations in `backend/db/migrations/` will still work. Prisma will work with the existing database structure.

### 5. Start the Server

```bash
npm run dev
```

The server will automatically:
- Generate Prisma Client if needed
- Connect to the database using Prisma

## Prisma Schema

The schema is located at `backend/prisma/schema.prisma` and includes:

- **Profile** - User profiles
- **Project** - Projects
- **Task** - Tasks with status and priority enums
- **AiEvent** - AI interaction events
- **AiToolCall** - Tool invocation records
- **AiUsageDaily** - Daily aggregated metrics

## Code Changes

### Before (Raw SQL)

```javascript
import pool from '../db.js';

const result = await pool.query(
  'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
  [userId]
);
res.json(result.rows);
```

### After (Prisma)

```javascript
import prisma from '../db.js';

const tasks = await prisma.task.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
});
res.json(tasks);
```

### Complex Queries (Raw SQL with Prisma)

For complex analytics queries, we use Prisma's `$queryRaw`:

```javascript
const rows = await prisma.$queryRaw`
  SELECT COUNT(*) FROM ai_events 
  WHERE user_id = ${userId} AND created_at BETWEEN ${start} AND ${end}
`;
```

## Benefits

### 1. Type Safety
- Auto-generated TypeScript types
- Compile-time error checking
- IntelliSense support in IDE

### 2. Developer Experience
- Cleaner, more readable code
- Less boilerplate
- Built-in query optimization

### 3. Maintainability
- Schema as code (`schema.prisma`)
- Automatic migrations
- Better error messages

### 4. Performance
- Connection pooling built-in
- Query optimization
- Prepared statements

## Migration Status

✅ **Completed Routes:**
- `/auth` - Signup, login
- `/tasks` - CRUD operations
- `/projects` - CRUD operations
- `/profiles` - Get/update profile
- `/ai` - AI chat logging
- `/ai/analytics` - Analytics queries (using `$queryRaw`)
- Background jobs - Daily aggregation

## Troubleshooting

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npm run prisma:generate
```

### Issue: "Can't reach database server"

**Solution:**
1. Check `DATABASE_URL` in `.env`
2. Verify PostgreSQL is running
3. Test connection: `psql $DATABASE_URL`

### Issue: "Schema is out of sync"

**Solution:**
```bash
# Pull schema from existing database
npx prisma db pull

# Or push schema to database
npm run prisma:push
```

### Issue: "Type errors in TypeScript"

**Solution:**
1. Regenerate Prisma Client: `npm run prisma:generate`
2. Restart TypeScript server in IDE
3. Check `prisma/schema.prisma` matches database

## Prisma Studio

View and edit data in a GUI:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

## Useful Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Push schema changes (dev only)
npm run prisma:push

# Open Prisma Studio
npm run prisma:studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Next Steps

1. ✅ All routes migrated to Prisma
2. ✅ Complex queries use `$queryRaw`
3. ⏳ Consider removing legacy `pool` export (optional)
4. ⏳ Add Prisma migrations for future schema changes
5. ⏳ Update frontend types to use Prisma-generated types

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/guides/migrate)

