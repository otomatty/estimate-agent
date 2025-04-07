export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_analyses: {
        Row: {
          company_size: number | null
          cost_optimization: Json | null
          created_at: string
          current_process_hours: number | null
          efficiency_prediction: Json | null
          estimate_id: string | null
          id: string
          industry: string | null
          roi_analysis: Json | null
          scalability_analysis: Json | null
          session_id: string | null
          temporary_estimate_id: string | null
          updated_at: string
        }
        Insert: {
          company_size?: number | null
          cost_optimization?: Json | null
          created_at?: string
          current_process_hours?: number | null
          efficiency_prediction?: Json | null
          estimate_id?: string | null
          id?: string
          industry?: string | null
          roi_analysis?: Json | null
          scalability_analysis?: Json | null
          session_id?: string | null
          temporary_estimate_id?: string | null
          updated_at?: string
        }
        Update: {
          company_size?: number | null
          cost_optimization?: Json | null
          created_at?: string
          current_process_hours?: number | null
          efficiency_prediction?: Json | null
          estimate_id?: string | null
          id?: string
          industry?: string | null
          roi_analysis?: Json | null
          scalability_analysis?: Json | null
          session_id?: string | null
          temporary_estimate_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_analyses_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_analyses_temporary_estimate_id_fkey"
            columns: ["temporary_estimate_id"]
            isOneToOne: false
            referencedRelation: "temporary_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      business_analysis_reports: {
        Row: {
          business_analysis_id: string
          created_at: string
          id: string
          report_type: string
          report_url: string
          session_id: string | null
        }
        Insert: {
          business_analysis_id: string
          created_at?: string
          id?: string
          report_type: string
          report_url: string
          session_id?: string | null
        }
        Update: {
          business_analysis_id?: string
          created_at?: string
          id?: string
          report_type?: string
          report_url?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analysis_reports_business_analysis_id_fkey"
            columns: ["business_analysis_id"]
            isOneToOne: false
            referencedRelation: "business_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          content: Json | null
          created_at: string
          email: string
          estimate_id: string | null
          id: string
          sent_at: string | null
          status: string
          temporary_estimate_id: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          email: string
          estimate_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          temporary_estimate_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          email?: string
          estimate_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          temporary_estimate_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_temporary_estimate_id_fkey"
            columns: ["temporary_estimate_id"]
            isOneToOne: false
            referencedRelation: "temporary_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          complexity: string | null
          created_at: string
          description: string | null
          estimate_id: string
          estimated_hours: number | null
          id: string
          is_required: boolean | null
          is_selected: boolean | null
          name: string
          position: number
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          complexity?: string | null
          created_at?: string
          description?: string | null
          estimate_id: string
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          is_selected?: boolean | null
          name: string
          position?: number
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          complexity?: string | null
          created_at?: string
          description?: string | null
          estimate_id?: string
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          is_selected?: boolean | null
          name?: string
          position?: number
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_questions: {
        Row: {
          answer: string | null
          category: string | null
          created_at: string
          estimate_id: string
          id: string
          is_answered: boolean | null
          position: number
          question: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          answer?: string | null
          category?: string | null
          created_at?: string
          estimate_id: string
          id?: string
          is_answered?: boolean | null
          position?: number
          question: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string | null
          category?: string | null
          created_at?: string
          estimate_id?: string
          id?: string
          is_answered?: boolean | null
          position?: number
          question?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_questions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "question_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          initial_requirements: string
          metadata: Json | null
          pdf_url: string | null
          session_id: string | null
          status: string
          title: string
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          initial_requirements: string
          metadata?: Json | null
          pdf_url?: string | null
          session_id?: string | null
          status?: string
          title: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          initial_requirements?: string
          metadata?: Json | null
          pdf_url?: string | null
          session_id?: string | null
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_benchmarks: {
        Row: {
          average_roi: number
          average_savings_rate: number
          created_at: string
          data_source: string | null
          efficiency_metrics: Json | null
          id: string
          industry: string
          updated_at: string
        }
        Insert: {
          average_roi: number
          average_savings_rate: number
          created_at?: string
          data_source?: string | null
          efficiency_metrics?: Json | null
          id?: string
          industry: string
          updated_at?: string
        }
        Update: {
          average_roi?: number
          average_savings_rate?: number
          created_at?: string
          data_source?: string | null
          efficiency_metrics?: Json | null
          id?: string
          industry?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_templates: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          category: string
          content_embedding: string | null
          created_at: string
          description: string | null
          features: Json
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          category: string
          content_embedding?: string | null
          created_at?: string
          description?: string | null
          features: Json
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          category?: string
          content_embedding?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      question_templates: {
        Row: {
          category: string
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean | null
          position: number
          question: string
          updated_at: string
        }
        Insert: {
          category: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          position?: number
          question: string
          updated_at?: string
        }
        Update: {
          category?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          position?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_categories: {
        Row: {
          content_embedding: string | null
          created_at: string
          default_questions: Json | null
          description: string | null
          id: string
          keywords: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          content_embedding?: string | null
          created_at?: string
          default_questions?: Json | null
          description?: string | null
          id?: string
          keywords?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          content_embedding?: string | null
          created_at?: string
          default_questions?: Json | null
          description?: string | null
          id?: string
          keywords?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      temporary_estimate_items: {
        Row: {
          complexity: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_required: boolean | null
          is_selected: boolean | null
          name: string
          position: number
          quantity: number
          temporary_estimate_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          complexity?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          is_selected?: boolean | null
          name: string
          position?: number
          quantity?: number
          temporary_estimate_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          complexity?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_required?: boolean | null
          is_selected?: boolean | null
          name?: string
          position?: number
          quantity?: number
          temporary_estimate_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_estimate_items_temporary_estimate_id_fkey"
            columns: ["temporary_estimate_id"]
            isOneToOne: false
            referencedRelation: "temporary_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_estimate_questions: {
        Row: {
          answer: string | null
          category: string | null
          created_at: string
          id: string
          is_answered: boolean | null
          position: number
          question: string
          template_id: string | null
          temporary_estimate_id: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean | null
          position?: number
          question: string
          template_id?: string | null
          temporary_estimate_id: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean | null
          position?: number
          question?: string
          template_id?: string | null
          temporary_estimate_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_estimate_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "question_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporary_estimate_questions_temporary_estimate_id_fkey"
            columns: ["temporary_estimate_id"]
            isOneToOne: false
            referencedRelation: "temporary_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_estimates: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          expires_at: string
          id: string
          initial_requirements: string
          metadata: Json | null
          pdf_url: string | null
          session_id: string
          status: string
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          initial_requirements: string
          metadata?: Json | null
          pdf_url?: string | null
          session_id: string
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          initial_requirements?: string
          metadata?: Json | null
          pdf_url?: string | null
          session_id?: string
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cleanup_expired_temporary_estimates: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_categories: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          name: string
          description: string
          keywords: Json
          default_questions: Json
          similarity: number
        }[]
      }
      match_projects: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          category_filter?: string
        }
        Returns: {
          id: string
          name: string
          category: string
          description: string
          features: Json
          actual_hours: number
          actual_cost: number
          similarity: number
        }[]
      }
      migrate_temporary_estimate_to_permanent: {
        Args: { p_temp_estimate_id: string; p_user_id: string }
        Returns: string
      }
      process_pending_email_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      set_app_setting: {
        Args: { name: string; value: string }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
