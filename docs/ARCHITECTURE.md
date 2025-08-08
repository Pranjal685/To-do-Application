# 🏗️ Project Architecture

## 📁 Directory Structure

```
ai-todo-app/
├── 📁 src/
│   ├── 📁 components/          # Reusable UI components
│   │   ├── 📁 ui/             # Base UI components (Radix)
│   │   ├── 📁 forms/          # Form components
│   │   ├── 📁 layout/         # Layout components
│   │   └── 📁 features/       # Feature-specific components
│   ├── 📁 pages/              # Route components
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 services/           # API services
│   ├── 📁 utils/              # Utility functions
│   ├── 📁 types/              # TypeScript type definitions
│   ├── 📁 stores/             # State management
│   ├── 📁 constants/          # App constants
│   └── 📁 assets/             # Static assets
├── 📁 supabase/
│   ├── 📁 migrations/         # Database migrations
│   └── 📁 functions/          # Edge functions
├── 📁 docs/                   # Documentation
├── 📁 tests/                  # Test files
├── 📁 public/                 # Public assets
└── 📁 scripts/                # Build/deployment scripts
```

## 🔧 Component Architecture

### Core Principles
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data
- **Reusability**: Modular components that can be composed
- **Type Safety**: Full TypeScript coverage
- **Performance**: Optimized rendering and lazy loading

### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main
├── Dashboard
│   ├── KanbanBoard
│   ├── CalendarView
│   ├── AnalyticsDashboard
│   └── AIAssistant
└── Features
    ├── TaskManager
    ├── PomodoroTimer
    ├── SmartScheduler
    └── CollaborationTools
```

## 🗄️ Database Schema

### Core Tables
- **users**: User profiles and preferences
- **tasks**: Task data with AI metadata
- **projects**: Project organization
- **categories**: Smart categorization
- **analytics**: Usage and productivity data
- **ai_interactions**: Chat history and context

### Relationships
- Users → Tasks (1:many)
- Projects → Tasks (1:many)
- Tasks → Subtasks (1:many)
- Users → Analytics (1:many)

## 🔄 Data Flow

1. **User Input** → Form validation → API call
2. **API Layer** → Business logic → Database
3. **Real-time Updates** → WebSocket → UI refresh
4. **AI Processing** → Background jobs → Smart suggestions

## 🛡️ Security Architecture

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Row Level Security (RLS)
- **Data Encryption**: End-to-end for sensitive tasks
- **API Security**: Rate limiting and validation
- **Privacy**: GDPR compliant data handling