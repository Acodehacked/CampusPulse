import type { IssueCategory, IssuePriority, IssueStatus, IssueUpdateEventType } from "@/constants/issues";

/**
 * Hand-written mirror of the Supabase schema (supabase/migrations/*.sql is
 * the source of truth). Passed as the generic to createClient<Database>()
 * so every `.from(...)` call is fully typed without generating types against
 * a running database.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: "student" | "admin";
          department: string | null;
          graduation_year: number | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: IssueCategory;
          location: string;
          priority: IssuePriority;
          status: IssueStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: IssueCategory;
          location: string;
          priority?: IssuePriority;
          status?: IssueStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
        Relationships: [];
      };
      issue_confirmations: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: { id?: string; issue_id: string; user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["issue_confirmations"]["Insert"]>;
        Relationships: [];
      };
      issue_updates: {
        Row: {
          id: string;
          issue_id: string;
          actor_id: string | null;
          event_type: IssueUpdateEventType;
          old_value: unknown;
          new_value: unknown;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          actor_id?: string | null;
          event_type: IssueUpdateEventType;
          old_value?: unknown;
          new_value?: unknown;
          message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["issue_updates"]["Insert"]>;
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          issue_id: string;
          uploaded_by: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          uploaded_by: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attachments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "student" | "admin";
      issue_category: IssueCategory;
      issue_priority: IssuePriority;
      issue_status: IssueStatus;
      issue_update_event_type: IssueUpdateEventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
