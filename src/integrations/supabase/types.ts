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
          meta_monthly: number | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["broker_status"] | null
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
          meta_monthly?: number | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["broker_status"] | null
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
          meta_monthly?: number | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["broker_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          broker_id: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_value: number | null
          contract_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          property_address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_value: number
          sale_date: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          updated_at: string | null
          vgc: number
          vgv: number
        }
        Insert: {
          broker_id?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_value?: number | null
          contract_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_value: number
          sale_date?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          updated_at?: string | null
          vgc: number
          vgv: number
        }
        Update: {
          broker_id?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_value?: number | null
          contract_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          property_address?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          property_value?: number
          sale_date?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      broker_status: ["ativo", "inativo", "ferias"],
      property_type: ["apartamento", "casa", "terreno", "comercial", "rural"],
      sale_status: ["pendente", "confirmada", "cancelada"],
    },
  },
} as const
