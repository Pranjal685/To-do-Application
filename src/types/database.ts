export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: any;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'review' | 'done';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          category_id: string | null;
          project_id: string | null;
          user_id: string;
          due_date: string | null;
          completed_at: string | null;
          estimated_duration: number | null;
          actual_duration: number | null;
          tags: string[];
          subtasks: any[];
          dependencies: string[];
          ai_metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category_id?: string | null;
          project_id?: string | null;
          user_id: string;
          due_date?: string | null;
          completed_at?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          tags?: string[];
          subtasks?: any[];
          dependencies?: string[];
          ai_metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'review' | 'done';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          category_id?: string | null;
          project_id?: string | null;
          user_id?: string;
          due_date?: string | null;
          completed_at?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          tags?: string[];
          subtasks?: any[];
          dependencies?: string[];
          ai_metadata?: any;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          user_id: string;
          team_id: string | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color: string;
          user_id: string;
          team_id?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          user_id?: string;
          team_id?: string | null;
          progress?: number;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string | null;
          user_id: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          icon?: string | null;
          user_id: string;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          icon?: string | null;
          user_id?: string;
          is_system?: boolean;
        };
      };
    };
  };
}