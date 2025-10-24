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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      broker_notes: {
        Row: {
          broker_id: string
          created_at: string | null
          created_by: string | null
          id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note: string
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_notes_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          avatar_url: string | null
          commission_rate: number | null
          cpf: string | null
          created_at: string | null
          creci: string | null
          email: string
          hire_date: string | null
          id: string
          kanban_status: string | null
          meta_monthly: number | null
          name: string
          observations: string | null
          phone: string | null
          status: Database["public"]["Enums"]["broker_status"] | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string | null
          creci?: string | null
          email: string
          hire_date?: string | null
          id?: string
          kanban_status?: string | null
          meta_monthly?: number | null
          name: string
          observations?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["broker_status"] | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string | null
          creci?: string | null
          email?: string
          hire_date?: string | null
          id?: string
          kanban_status?: string | null
          meta_monthly?: number | null
          name?: string
          observations?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["broker_status"] | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_progress: {
        Row: {
          created_at: string
          created_by: string | null
          goal_id: string
          id: string
          notes: string | null
          progress_date: string
          progress_value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          progress_date?: string
          progress_value?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          progress_date?: string
          progress_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_quantity: number | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          goal_id: string
          id: string
          priority: string
          status: string
          target_quantity: number | null
          task_category: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_quantity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          goal_id: string
          id?: string
          priority?: string
          status?: string
          target_quantity?: number | null
          task_category?: string | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_quantity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string
          id?: string
          priority?: string
          status?: string
          target_quantity?: number | null
          task_category?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          assigned_to: string | null
          broker_id: string | null
          created_at: string
          created_by: string | null
          current_value: number
          description: string | null
          end_date: string
          id: string
          period_type: string
          start_date: string
          status: string
          target_type: string
          target_value: number
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          broker_id?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          end_date: string
          id?: string
          period_type?: string
          start_date: string
          status?: string
          target_type: string
          target_value?: number
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          broker_id?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          end_date?: string
          id?: string
          period_type?: string
          start_date?: string
          status?: string
          target_type?: string
          target_value?: number
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          logo_icon_url: string | null
          logo_url: string | null
          organization_name: string
          organization_tagline: string | null
          primary_color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          logo_icon_url?: string | null
          logo_url?: string | null
          organization_name?: string
          organization_tagline?: string | null
          primary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          logo_icon_url?: string | null
          logo_url?: string | null
          organization_name?: string
          organization_tagline?: string | null
          primary_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      process_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allowed_screens: string[] | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_admin: boolean | null
          manager_id: string | null
          role: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_screens?: string[] | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_admin?: boolean | null
          manager_id?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_screens?: string[] | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_admin?: boolean | null
          manager_id?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          ano: number | null
          broker_id: string | null
          captador: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_value: number | null
          contract_date: string | null
          created_at: string | null
          estilo: string | null
          gerente: string | null
          id: string
          latitude: string | null
          mes: number | null
          notes: string | null
          origem: string | null
          pagos: number | null
          process_stage_id: string | null
          produto: string | null
          property_address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_value: number
          sale_date: string | null
          sale_type: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          updated_at: string | null
          vendedor: string | null
          vgc: number
          vgv: number
        }
        Insert: {
          ano?: number | null
          broker_id?: string | null
          captador?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_value?: number | null
          contract_date?: string | null
          created_at?: string | null
          estilo?: string | null
          gerente?: string | null
          id?: string
          latitude?: string | null
          mes?: number | null
          notes?: string | null
          origem?: string | null
          pagos?: number | null
          process_stage_id?: string | null
          produto?: string | null
          property_address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_value: number
          sale_date?: string | null
          sale_type?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          updated_at?: string | null
          vendedor?: string | null
          vgc: number
          vgv: number
        }
        Update: {
          ano?: number | null
          broker_id?: string | null
          captador?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_value?: number | null
          contract_date?: string | null
          created_at?: string | null
          estilo?: string | null
          gerente?: string | null
          id?: string
          latitude?: string | null
          mes?: number | null
          notes?: string | null
          origem?: string | null
          pagos?: number | null
          process_stage_id?: string | null
          produto?: string | null
          property_address?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          property_value?: number
          sale_date?: string | null
          sale_type?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          updated_at?: string | null
          vendedor?: string | null
          vgc?: number
          vgv?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_process_stage_id_fkey"
            columns: ["process_stage_id"]
            isOneToOne: false
            referencedRelation: "process_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      targets: {
        Row: {
          achieved_sales_count: number | null
          achieved_value: number | null
          broker_id: string | null
          created_at: string | null
          id: string
          month: number
          target_sales_count: number | null
          target_value: number
          updated_at: string | null
          year: number
        }
        Insert: {
          achieved_sales_count?: number | null
          achieved_value?: number | null
          broker_id?: string | null
          created_at?: string | null
          id?: string
          month: number
          target_sales_count?: number | null
          target_value?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          achieved_sales_count?: number | null
          achieved_value?: number | null
          broker_id?: string | null
          created_at?: string | null
          id?: string
          month?: number
          target_sales_count?: number | null
          target_value?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "targets_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_admin_status: { Args: never; Returns: boolean }
      get_team_hierarchy: {
        Args: { user_id: string }
        Returns: {
          is_manager: boolean
          team_id: string
          team_members: string[]
          team_name: string
        }[]
      }
      get_user_allowed_screens: { Args: { user_id: string }; Returns: string[] }
      get_user_primary_role: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_admin: { Args: { user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: string
          _new_data?: Json
          _old_data?: Json
          _record_id?: string
          _table_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "diretor" | "gerente" | "corretor" | "user"
      broker_status: "ativo" | "inativo" | "ferias"
      property_type: "apartamento" | "casa" | "terreno" | "comercial" | "rural"
      sale_status: "pendente" | "confirmada" | "cancelada"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "diretor", "gerente", "corretor", "user"],
      broker_status: ["ativo", "inativo", "ferias"],
      property_type: ["apartamento", "casa", "terreno", "comercial", "rural"],
      sale_status: ["pendente", "confirmada", "cancelada"],
    },
  },
} as const
