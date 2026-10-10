export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          feature: string
          id: string
          model: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          model: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          model?: string
          user_id?: string | null
        }
        Relationships: []
      }
      barrier_responses: {
        Row: {
          answers: Json
          comments: Json
          created_at: string
          id: string
          open_feedback: Json
          org_name: string | null
          priorities: Json
          profile: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          comments?: Json
          created_at?: string
          id?: string
          open_feedback?: Json
          org_name?: string | null
          priorities?: Json
          profile?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          answers?: Json
          comments?: Json
          created_at?: string
          id?: string
          open_feedback?: Json
          org_name?: string | null
          priorities?: Json
          profile?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_share_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          label: string
          revoked: boolean
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          label?: string
          revoked?: boolean
          token?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          label?: string
          revoked?: boolean
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_enquiries: {
        Row: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          job_title: string | null
          message: string
          phone: string | null
          source: string
          workforce_size: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          job_title?: string | null
          message: string
          phone?: string | null
          source?: string
          workforce_size?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          message?: string
          phone?: string | null
          source?: string
          workforce_size?: string | null
        }
        Relationships: []
      }
      dg_reviews: {
        Row: {
          ai_assessment: string | null
          answers: Json
          created_at: string
          id: string
          plan_id: string | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_assessment?: string | null
          answers?: Json
          created_at?: string
          id?: string
          plan_id?: string | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_assessment?: string | null
          answers?: Json
          created_at?: string
          id?: string
          plan_id?: string | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_reviews_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "ee_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ee_plans: {
        Row: {
          company: string
          content: Json
          created_at: string
          department: string
          dg_review_due: string | null
          division: string
          end_date: string | null
          id: string
          section: string
          sector: string
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string
          content?: Json
          created_at?: string
          department?: string
          dg_review_due?: string | null
          division?: string
          end_date?: string | null
          id?: string
          section?: string
          sector?: string
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          company?: string
          content?: Json
          created_at?: string
          department?: string
          dg_review_due?: string | null
          division?: string
          end_date?: string | null
          id?: string
          section?: string
          sector?: string
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eea12_analyses: {
        Row: {
          ai_summary: string | null
          counts: Json
          created_at: string
          eap: Json
          id: string
          level: string
          results: Json
          sector: string
          targets: Json
          total_headcount: number
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          counts: Json
          created_at?: string
          eap: Json
          id?: string
          level: string
          results: Json
          sector?: string
          targets: Json
          total_headcount?: number
          user_id?: string
        }
        Update: {
          ai_summary?: string | null
          counts?: Json
          created_at?: string
          eap?: Json
          id?: string
          level?: string
          results?: Json
          sector?: string
          targets?: Json
          total_headcount?: number
          user_id?: string
        }
        Relationships: []
      }
      evidence_extractions: {
        Row: {
          created_at: string
          data: Json
          file_names: string[]
          id: string
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          file_names?: string[]
          id?: string
          summary?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          data?: Json
          file_names?: string[]
          id?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      internal_tokens: {
        Row: {
          name: string
          token: string
        }
        Insert: {
          name: string
          token?: string
        }
        Update: {
          name?: string
          token?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_email: string
          client_name: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          items: Json
          notes: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          client_email?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json
          notes?: string
          status?: string
          total: number
          user_id: string
        }
        Update: {
          client_email?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      plan_gap_analyses: {
        Row: {
          created_at: string
          file_name: string
          id: string
          plan_text: string
          result: string
          user_id: string
          workforce: Json
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          plan_text?: string
          result: string
          user_id?: string
          workforce?: Json
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          plan_text?: string
          result?: string
          user_id?: string
          workforce?: Json
        }
        Relationships: []
      }
      portal_documents: {
        Row: {
          area: string
          category: string
          created_at: string
          file_name: string
          id: string
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          area: string
          category: string
          created_at?: string
          file_name: string
          id?: string
          size_bytes?: number
          storage_path: string
          user_id?: string
        }
        Update: {
          area?: string
          category?: string
          created_at?: string
          file_name?: string
          id?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          company: string
          created_at: string
          details: string
          email: string
          full_name: string
          id: string
          phone: string | null
          service: string
        }
        Insert: {
          company: string
          created_at?: string
          details: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          service: string
        }
        Update: {
          company?: string
          created_at?: string
          details?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          service?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          enabled: boolean
          lead_days: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          lead_days?: number[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          enabled?: boolean
          lead_days?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          m_payment_id: string
          payfast_payment_id: string | null
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          m_payment_id: string
          payfast_payment_id?: string | null
          plan: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          m_payment_id?: string
          payfast_payment_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workforce_snapshots: {
        Row: {
          counts: Json
          created_at: string
          disability: Json
          file_name: string | null
          id: string
          notes: string | null
          snapshot_date: string
          source: string
          total_headcount: number
          units: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          counts?: Json
          created_at?: string
          disability?: Json
          file_name?: string | null
          id?: string
          notes?: string | null
          snapshot_date?: string
          source?: string
          total_headcount?: number
          units?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          counts?: Json
          created_at?: string
          disability?: Json
          file_name?: string | null
          id?: string
          notes?: string | null
          snapshot_date?: string
          source?: string
          total_headcount?: number
          units?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_clients: {
        Args: never
        Returns: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      admin_clients_all: {
        Args: never
        Returns: {
          company: string
          confirmed: boolean
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      enquiry_throttled: { Args: { p_email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      review_clients: {
        Args: never
        Returns: {
          company: string
          email: string
          full_name: string
          id: string
        }[]
      }
      set_manager_role: {
        Args: { _make: boolean; _user_id: string }
        Returns: undefined
      }
      shared_portal: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "manager"],
    },
  },
} as const
