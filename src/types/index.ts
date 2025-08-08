export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  work_hours: {
    start: string;
    end: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  ai_features: {
    auto_categorize: boolean;
    smart_scheduling: boolean;
    productivity_insights: boolean;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category_id?: string;
  project_id?: string;
  user_id: string;
  due_date?: string;
  completed_at?: string;
  estimated_duration?: number; // in minutes
  actual_duration?: number; // in minutes
  tags: string[];
  subtasks: Subtask[];
  dependencies: string[]; // task IDs
  ai_metadata: AIMetadata;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface AIMetadata {
  auto_categorized: boolean;
  confidence_score?: number;
  suggested_duration?: number;
  optimal_time_slots?: TimeSlot[];
  productivity_score?: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  confidence: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
  team_id?: string;
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  user_id: string;
  is_system: boolean;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  task_id: string;
  user_id: string;
  duration: number; // in minutes
  type: 'work' | 'short_break' | 'long_break';
  completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface AIChat {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  context: ChatContext;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    task_ids?: string[];
    action_taken?: string;
    confidence?: number;
  };
}

export interface ChatContext {
  current_tasks: string[];
  recent_activity: string[];
  user_patterns: UserPatterns;
  productivity_state: ProductivityState;
}

export interface UserPatterns {
  peak_hours: string[];
  preferred_task_duration: number;
  completion_rate: number;
  common_categories: string[];
}

export interface ProductivityState {
  current_focus_level: number; // 1-10
  tasks_completed_today: number;
  current_streak: number;
  energy_level: 'low' | 'medium' | 'high';
}

export interface Analytics {
  user_id: string;
  date: string;
  tasks_created: number;
  tasks_completed: number;
  total_focus_time: number; // in minutes
  productivity_score: number; // 1-100
  categories_breakdown: Record<string, number>;
  peak_productivity_hour: number;
  ai_suggestions_accepted: number;
  ai_suggestions_total: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export type NotificationType = 
  | 'task_reminder'
  | 'task_overdue'
  | 'pomodoro_break'
  | 'daily_summary'
  | 'ai_suggestion'
  | 'collaboration';

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  members: TeamMember[];
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface CreateTaskForm {
  title: string;
  description?: string;
  priority: TaskPriority;
  category_id?: string;
  project_id?: string;
  due_date?: string;
  estimated_duration?: number;
  tags: string[];
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  status?: TaskStatus;
}

export interface CreateProjectForm {
  name: string;
  description?: string;
  color: string;
}

// Hook return types
export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  createTask: (task: CreateTaskForm) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskForm) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refetch: () => void;
}

export interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;