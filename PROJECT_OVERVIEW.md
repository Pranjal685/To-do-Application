# 📊 Project Overview & Database Schema

## 🎯 Project Summary

**AI-Powered To-Do Application** - A full-stack productivity application with AI integration, task management, Kanban boards, Pomodoro timer, analytics, and more.

---

## 🗄️ Database Schema

### Core Tables

#### 1. **profiles** (Users)
```sql
- id: SERIAL PRIMARY KEY
- email: TEXT UNIQUE NOT NULL
- full_name: TEXT
- password: TEXT NOT NULL (bcrypt hashed)
- preferences: JSONB DEFAULT '{}'
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 2. **projects**
```sql
- id: SERIAL PRIMARY KEY
- name: TEXT NOT NULL
- description: TEXT
- color: TEXT DEFAULT '#3B82F6'
- user_id: INTEGER REFERENCES profiles(id) ON DELETE CASCADE
- progress: INTEGER DEFAULT 0
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 3. **tasks**
```sql
- id: SERIAL PRIMARY KEY
- title: TEXT NOT NULL
- description: TEXT
- status: TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done'))
- priority: TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
- user_id: INTEGER REFERENCES profiles(id) ON DELETE CASCADE
- project_id: INTEGER REFERENCES projects(id) ON DELETE SET NULL
- due_date: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- estimated_duration: INTEGER (minutes)
- actual_duration: INTEGER (minutes)
- tags: TEXT[] DEFAULT '{}'
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Indexes:**
- `idx_tasks_user_id` on `tasks(user_id)`
- `idx_tasks_status` on `tasks(status)`
- `idx_tasks_project_id` on `tasks(project_id)`
- `idx_projects_user_id` on `projects(user_id)`

#### 4. **ai_events** (AI Analytics)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER REFERENCES profiles(id) ON DELETE CASCADE
- chat_id: INTEGER
- type: TEXT NOT NULL
- properties: JSONB DEFAULT '{}'
- created_at: TIMESTAMPTZ
```

**Event Types:**
- `message_sent`
- `assistant_replied`
- `chat_started`
- `suggestion_proposed`
- `suggestion_shown_for_confirmation`
- `suggestion_accepted`
- `suggestion_rejected`
- `task_status_changed`
- `safety_blocked`

**Indexes:**
- `idx_ai_events_user_time` on `(user_id, created_at DESC)`
- `idx_ai_events_type_time` on `(type, created_at DESC)`

#### 5. **ai_tool_calls** (Tool Invocation Tracking)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER REFERENCES profiles(id) ON DELETE CASCADE
- chat_id: INTEGER
- tool_name: TEXT NOT NULL
- args: JSONB DEFAULT '{}'
- status: TEXT CHECK (status IN ('success', 'error'))
- latency_ms: INTEGER
- error_code: TEXT
- created_at: TIMESTAMPTZ
```

**Indexes:**
- `idx_ai_tool_calls_user_time` on `(user_id, created_at DESC)`

#### 6. **ai_usage_daily** (Daily Aggregates)
```sql
- date: DATE NOT NULL
- model: TEXT
- users: INTEGER DEFAULT 0
- sessions: INTEGER DEFAULT 0
- messages: INTEGER DEFAULT 0
- suggestions: INTEGER DEFAULT 0
- accepted: INTEGER DEFAULT 0
- tool_calls: INTEGER DEFAULT 0
- tool_success_rate: NUMERIC
- p50_latency_ms: INTEGER
- p95_latency_ms: INTEGER
- input_tokens: BIGINT DEFAULT 0
- output_tokens: BIGINT DEFAULT 0
- cost_usd: NUMERIC DEFAULT 0
- PRIMARY KEY (date, model)
```

---

## 🏗️ Backend Architecture

### Tech Stack
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL (via `pg` pool)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **AI Integration**: OpenRouter API (OpenAI-compatible)
- **Date Parsing**: chrono-node
- **Validation**: Zod

### API Routes

#### `/auth`
- `POST /signup` - Create new user account
- `POST /login` - Authenticate user
- `POST /logout` - Logout (client-side token deletion)

#### `/tasks`
- `GET /` - Get all tasks for authenticated user
- `POST /` - Create new task
- `PUT /:id` - Update task (tracks status changes for analytics)
- `DELETE /:id` - Delete task
- `POST /:id/pomodoro` - Log Pomodoro session to task

#### `/projects`
- `GET /` - Get all projects (currently hardcoded to user_id=1)
- `POST /` - Create project
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

#### `/profiles`
- `GET /me` - Get current user profile (hardcoded to id=1)
- `PUT /me` - Update profile

#### `/ai`
- `POST /chat` - AI chat endpoint (OpenRouter integration)
- `POST /task-flow` - Interactive task creation flow with AI

#### `/ai/analytics`
- `GET /overview` - Analytics overview (DAU, sessions, messages, acceptance rate, etc.)
- `GET /trends` - Daily trends over date range
- `GET /funnel` - Suggestion funnel metrics
- `GET /heatmap` - Activity heatmap (day of week × hour)
- `GET /cost` - Token usage and cost over time

### Background Jobs
- `jobs/aggregate_ai_usage.js` - Daily aggregation job for AI analytics

---

## 🎨 Frontend Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI
- **Animations**: Framer Motion
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - Zustand for client state
  - Context API (Auth, Theme, Settings)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Notifications**: react-hot-toast
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts

### Pages & Routes
- `/login` - Authentication page
- `/` - Dashboard (main task overview)
- `/kanban` - Kanban board with drag-and-drop
- `/calendar` - Calendar view
- `/analytics` - Analytics dashboard
- `/chat` - AI Assistant chat interface
- `/projects` - Project management
- `/pomodoro` - Pomodoro timer
- `/settings` - User settings

### Key Components

#### Layout
- `Layout.tsx` - Main app layout wrapper
- `Header.tsx` - Top navigation bar
- `Sidebar.tsx` - Left sidebar navigation

#### Tasks
- `TaskCard.tsx` - Individual task display
- `CreateTaskModal.tsx` - Task creation form
- `EditTaskModal.tsx` - Task editing form
- `DraggableTaskCard.tsx` - Drag-and-drop task card
- `DroppableColumn.tsx` - Kanban column

#### AI Assistant
- `ThreadSidebar.tsx` - Chat thread sidebar

#### Pomodoro
- `MiniPlayer.tsx` - Compact Pomodoro player
- `PomodoroContext.tsx` - Pomodoro state management

#### UI Components
- `Button.tsx` - Reusable button component
- `Card.tsx` - Card container
- `Input.tsx` - Form input
- `LoadingSpinner.tsx` - Loading indicator
- `Switch.tsx` - Toggle switch

### Custom Hooks
- `useTasks.ts` - Task CRUD operations
- `useProjects.ts` - Project management
- `useAssistant.ts` - AI chat integration
- `useAIAnalytics.ts` - AI analytics data
- `usePomodoro.ts` - Pomodoro timer logic

### Contexts
- `AuthContext.tsx` - Authentication state
- `ThemeContext.tsx` - Dark/light theme
- `SettingsContext.tsx` - User preferences

---

## 🔐 Authentication Flow

1. User signs up/logs in via `/auth/login` or `/auth/signup`
2. Backend returns JWT token (expires in 7 days)
3. Frontend stores token in localStorage
4. All protected routes require `Authorization: Bearer <token>` header
5. `authMiddleware` validates token on each request

**Note**: Currently, some routes (projects, profiles) are hardcoded to `user_id = 1` for development.

---

## 🤖 AI Features

### Chat Assistant (`/ai/chat`)
- Uses OpenRouter API (configurable model, default: `qwen/qwen3-coder:free`)
- System prompt: "AI task copilot for productivity app"
- Logs all interactions to `ai_events` table
- Tracks latency and token usage

### Task Flow (`/ai/task-flow`)
- Interactive task creation via natural language
- Supports two modes:
  - **Auto**: AI extracts fields and creates task
  - **Manual**: Provides step-by-step guidance
- Extracts:
  - Title, description, priority, due date
  - Tags (via hashtags or "tags:" keyword)
  - Duration, break intervals, break count (Pomodoro planning)
  - Subtasks (from lists or enumerated items)
  - Preferences (notifications on/off)
- Uses chrono-node for date parsing
- Validates with Zod schema
- Confirmation flow before task creation

---

## 📊 Analytics System

### Event Tracking
All AI interactions are logged as events in `ai_events`:
- Message sent/received
- Chat sessions started
- Suggestions proposed/accepted/rejected
- Task status changes
- Safety blocks

### Daily Aggregation
Background job (`aggregate_ai_usage.js`) aggregates:
- Daily active users
- Session counts
- Message counts
- Suggestion acceptance rates
- Tool call success rates
- Latency percentiles (p50, p95)
- Token usage and costs

### Analytics Endpoints
- **Overview**: High-level metrics
- **Trends**: Time-series data
- **Funnel**: Conversion metrics
- **Heatmap**: Activity patterns
- **Cost**: Token usage and costs

---

## 🎯 Task Management Features

### Task Statuses
- `todo` - Not started
- `in_progress` - Currently working
- `review` - Needs review
- `done` - Completed

### Task Priorities
- `low` - Low priority
- `medium` - Default priority
- `high` - High priority
- `urgent` - Urgent priority

### Task Properties
- Title (required, min 3 chars)
- Description (optional)
- Status (default: `todo`)
- Priority (default: `medium`)
- Due date (optional, TIMESTAMPTZ)
- Project association (optional)
- Tags (array of strings)
- Estimated duration (minutes)
- Actual duration (minutes, updated via Pomodoro)
- Created/updated timestamps

### Pomodoro Integration
- Tasks can log Pomodoro sessions via `POST /tasks/:id/pomodoro`
- Completed work sessions update `actual_duration`
- Supports work/break session types
- Tracks interruptions

---

## 🚀 Development Setup

### Backend
```bash
cd backend
npm install
# Set up .env with:
# - PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
# - JWT_SECRET
# - OPENROUTER_API_KEY (optional)
# - AI_MODEL (optional, default: qwen/qwen3-coder:free)
npm run dev  # Runs on port 4000
```

### Frontend
```bash
npm install
npm run dev  # Runs on port 3000 (Vite default)
```

### Database Migrations
Migrations run automatically on backend startup via `migrate.js`:
- `000_initial_schema.sql` - Core tables
- `001_ai_analytics.sql` - AI analytics tables

---

## 📝 Current State & Known Issues

### Development Mode
- Some routes hardcode `user_id = 1` (projects, profiles)
- Authentication middleware exists but not fully enforced everywhere

### Database
- Uses PostgreSQL with connection pooling
- Migrations are idempotent (safe to run multiple times)
- Foreign key constraints enforce data integrity

### AI Integration
- OpenRouter API key required for AI features
- Falls back gracefully if API key missing
- Supports `AI_OFFLINE` mode for testing

---

## 🔄 Data Flow Examples

### Creating a Task
1. User fills form in `CreateTaskModal`
2. Frontend calls `POST /tasks` with task data
3. Backend validates and inserts into database
4. Returns created task
5. React Query invalidates cache
6. UI updates automatically

### AI Task Creation
1. User types natural language in AI assistant
2. Frontend calls `POST /ai/task-flow` with message
3. Backend extracts fields using AI + heuristics
4. Returns structured data + next question
5. User confirms or provides more info
6. Final confirmation → `POST /tasks` creates task

### Analytics Tracking
1. User interacts with AI
2. Backend logs event to `ai_events`
3. Background job aggregates daily stats
4. Frontend queries `/ai/analytics/*` endpoints
5. Charts and metrics displayed

---

## 📚 Documentation Files

- `docs/ARCHITECTURE.md` - System architecture
- `docs/ROADMAP.md` - Development roadmap
- `docs/USER_FLOWS.md` - User journey diagrams
- `docs/TECH_STACK.md` - Technology details
- `docs/test-plan-dashboard.md` - QA test plan
- `docs/AI_ANALYTICS_IMPLEMENTATION.md` - AI analytics docs
- `docs/DRAG_AND_DROP_IMPLEMENTATION.md` - Kanban implementation

---

## 🎨 UI/UX Features

- **Dark/Light Theme** - ThemeContext with system preference detection
- **Responsive Design** - Mobile, tablet, desktop layouts
- **Drag & Drop** - Kanban board task movement
- **Toast Notifications** - Success/error feedback
- **Loading States** - Spinners and skeletons
- **Form Validation** - Real-time validation with Zod
- **Accessibility** - Keyboard navigation, screen reader support

---

This overview provides a comprehensive understanding of the database schema, backend API, frontend architecture, and key features. Ready to start working on improvements! 🚀

