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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_activities: {
        Row: {
          activity_date: string
          activity_type: string
          agency_id: string | null
          broker_id: string
          client_name: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          observations: string | null
          property_reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          agency_id?: string | null
          broker_id: string
          client_name?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observations?: string | null
          property_reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          agency_id?: string | null
          broker_id?: string
          client_name?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observations?: string | null
          property_reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_activities_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_notes: {
        Row: {
          agency_id: string | null
          audio_url: string | null
          broker_id: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          note: string
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          audio_url?: string | null
          broker_id: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          note: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          audio_url?: string | null
          broker_id?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          note?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_notes_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_tasks: {
        Row: {
          agency_id: string | null
          broker_id: string
          column_id: string
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          property_reference: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          broker_id: string
          column_id: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          property_reference?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          broker_id?: string
          column_id?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          property_reference?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_tasks_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "process_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_weekly_activities: {
        Row: {
          agency_id: string | null
          broker_id: string
          category: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          meta_semanal: number
          period_type: string
          realizado: number
          task_name: string
          updated_at: string
          week_start: string
        }
        Insert: {
          agency_id?: string | null
          broker_id: string
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meta_semanal?: number
          period_type?: string
          realizado?: number
          task_name: string
          updated_at?: string
          week_start: string
        }
        Update: {
          agency_id?: string | null
          broker_id?: string
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meta_semanal?: number
          period_type?: string
          realizado?: number
          task_name?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_weekly_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_weekly_activities_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_weekly_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          birthday: string | null
          commission_rate: number | null
          company_id: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
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
          agency_id?: string | null
          avatar_url?: string | null
          birthday?: string | null
          commission_rate?: number | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
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
          agency_id?: string | null
          avatar_url?: string | null
          birthday?: string | null
          commission_rate?: number | null
          company_id?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
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
            foreignKeyName: "brokers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_shares: {
        Row: {
          agency_id: string | null
          company_id: string | null
          created_at: string
          event_id: string
          id: string
          shared_with_team_id: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          shared_with_team_id?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          shared_with_team_id?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_shares_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_shares_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_shares_shared_with_team_id_fkey"
            columns: ["shared_with_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          agency_id: string | null
          client_name: string | null
          color: string | null
          company_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          is_all_day: boolean
          is_private: boolean
          property_reference: string | null
          responsible_id: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          client_name?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          is_all_day?: boolean
          is_private?: boolean
          property_reference?: string | null
          responsible_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          client_name?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_all_day?: boolean
          is_private?: boolean
          property_reference?: string | null
          responsible_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          agency_id: string | null
          appointments: number
          broker_id: string
          calls: number
          campaign_id: string
          captures: number
          company_id: string | null
          created_at: string
          id: string
          negotiations: number
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          appointments?: number
          broker_id: string
          calls?: number
          campaign_id: string
          captures?: number
          company_id?: string | null
          created_at?: string
          id?: string
          negotiations?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          appointments?: number
          broker_id?: string
          calls?: number
          campaign_id?: string
          captures?: number
          company_id?: string | null
          created_at?: string
          id?: string
          negotiations?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_reports: {
        Row: {
          agency_id: string | null
          campaign_id: string
          company_id: string | null
          conversion_rate: number
          created_at: string
          duration_minutes: number
          id: string
          total_appointments: number
          total_calls: number
          total_captures: number
          total_negotiations: number
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          campaign_id: string
          company_id?: string | null
          conversion_rate?: number
          created_at?: string
          duration_minutes?: number
          id?: string
          total_appointments?: number
          total_calls?: number
          total_captures?: number
          total_negotiations?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          campaign_id?: string
          company_id?: string | null
          conversion_rate?: number
          created_at?: string
          duration_minutes?: number
          id?: string
          total_appointments?: number
          total_calls?: number
          total_captures?: number
          total_negotiations?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_reports_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          agency_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          finished_at: string | null
          id: string
          meta_calls: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          id?: string
          meta_calls?: number
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          id?: string
          meta_calls?: number
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      column_targets: {
        Row: {
          agency_id: string | null
          broker_id: string
          column_id: string
          company_id: string | null
          created_at: string
          id: string
          target_count: number
          updated_at: string
          week_start: string
        }
        Insert: {
          agency_id?: string | null
          broker_id: string
          column_id: string
          company_id?: string | null
          created_at?: string
          id?: string
          target_count?: number
          updated_at?: string
          week_start: string
        }
        Update: {
          agency_id?: string | null
          broker_id?: string
          column_id?: string
          company_id?: string | null
          created_at?: string
          id?: string
          target_count?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_targets_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "column_targets_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "column_targets_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "process_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "column_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_installments: {
        Row: {
          agency_id: string | null
          commission_id: string
          company_id: string | null
          created_at: string
          due_date: string | null
          id: string
          installment_number: number
          observations: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          agency_id?: string | null
          commission_id: string
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number: number
          observations?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          agency_id?: string | null
          commission_id?: string
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          observations?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_installments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_installments_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_installments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agency_id: string | null
          base_value: number
          broker_id: string | null
          commission_percentage: number
          commission_type: string
          commission_value: number
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          installments: number | null
          observations: string | null
          paid_installments: number | null
          payment_date: string | null
          payment_method: string | null
          received_at: string | null
          sale_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          base_value?: number
          broker_id?: string | null
          commission_percentage?: number
          commission_type?: string
          commission_value?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          installments?: number | null
          observations?: string | null
          paid_installments?: number | null
          payment_date?: string | null
          payment_method?: string | null
          received_at?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          base_value?: number
          broker_id?: string | null
          commission_percentage?: number
          commission_type?: string
          commission_value?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          installments?: number | null
          observations?: string | null
          paid_installments?: number | null
          payment_date?: string | null
          payment_method?: string | null
          received_at?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          max_users: number
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_users?: number
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_users?: number
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      follow_up_contacts: {
        Row: {
          agency_id: string | null
          company_id: string | null
          contact_date: string
          contact_type: string
          created_at: string
          created_by: string | null
          follow_up_id: string
          id: string
          notes: string | null
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          contact_date?: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          follow_up_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
          contact_date?: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          follow_up_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_contacts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_contacts_follow_up_id_fkey"
            columns: ["follow_up_id"]
            isOneToOne: false
            referencedRelation: "follow_ups"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_notes: {
        Row: {
          agency_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          follow_up_id: string
          id: string
          note: string
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          follow_up_id: string
          id?: string
          note: string
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          follow_up_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_notes_follow_up_id_fkey"
            columns: ["follow_up_id"]
            isOneToOne: false
            referencedRelation: "follow_ups"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_statuses: {
        Row: {
          color: string
          company_id: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          label: string
          order_index: number
          updated_at: string
          value: string
        }
        Insert: {
          color?: string
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label: string
          order_index?: number
          updated_at?: string
          value: string
        }
        Update: {
          color?: string
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label?: string
          order_index?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          agency_id: string | null
          broker_id: string
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          estimated_vgv: number
          id: string
          next_contact_date: string | null
          observations: string | null
          property_interest: string | null
          reminder_enabled: boolean | null
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          broker_id: string
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_vgv?: number
          id?: string
          next_contact_date?: string | null
          observations?: string | null
          property_interest?: string | null
          reminder_enabled?: boolean | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          broker_id?: string
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_vgv?: number
          id?: string
          next_contact_date?: string | null
          observations?: string | null
          property_interest?: string | null
          reminder_enabled?: boolean | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_progress: {
        Row: {
          agency_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          goal_id: string
          id: string
          notes: string | null
          progress_date: string
          progress_value: number
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          progress_date?: string
          progress_value?: number
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
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
            foreignKeyName: "goal_progress_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          agency_id: string | null
          assigned_to: string | null
          company_id: string | null
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
          agency_id?: string | null
          assigned_to?: string | null
          company_id?: string | null
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
          agency_id?: string | null
          assigned_to?: string | null
          company_id?: string | null
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
            foreignKeyName: "goal_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      goal_types: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          order_index: number
          updated_at: string
          value_format: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          order_index?: number
          updated_at?: string
          value_format?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          order_index?: number
          updated_at?: string
          value_format?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          agency_id: string | null
          assigned_to: string | null
          broker_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          current_value: number
          description: string | null
          end_date: string
          id: string
          period_type: string
          show_in_ranking: boolean
          show_in_tv: boolean
          start_date: string
          status: string
          target_type: string
          target_value: number
          team_id: string | null
          title: string
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          assigned_to?: string | null
          broker_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          end_date: string
          id?: string
          period_type?: string
          show_in_ranking?: boolean
          show_in_tv?: boolean
          start_date: string
          status?: string
          target_type: string
          target_value?: number
          team_id?: string | null
          title: string
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          assigned_to?: string | null
          broker_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number
          description?: string | null
          end_date?: string
          id?: string
          period_type?: string
          show_in_ranking?: boolean
          show_in_tv?: boolean
          start_date?: string
          status?: string
          target_type?: string
          target_value?: number
          team_id?: string | null
          title?: string
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_email: string | null
          company_id: string | null
          created_at: string
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiation_notes: {
        Row: {
          agency_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          negotiation_id: string
          note: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          negotiation_id: string
          note: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          negotiation_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiation_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiation_notes_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiation_statuses: {
        Row: {
          color: string
          company_id: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          label: string
          order_index: number
          updated_at: string
          value: string
        }
        Insert: {
          color?: string
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label: string
          order_index?: number
          updated_at?: string
          value: string
        }
        Update: {
          color?: string
          company_id?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label?: string
          order_index?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiations: {
        Row: {
          agency_id: string | null
          bloco: string | null
          broker_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          latitude: string | null
          longitude: string | null
          loss_reason: string | null
          negotiated_value: number
          observations: string | null
          origem: string | null
          process_stage_id: string | null
          property_address: string
          property_type: string
          start_date: string
          status: string
          temperature: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          bloco?: string | null
          broker_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: string | null
          longitude?: string | null
          loss_reason?: string | null
          negotiated_value: number
          observations?: string | null
          origem?: string | null
          process_stage_id?: string | null
          property_address: string
          property_type?: string
          start_date?: string
          status?: string
          temperature?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          bloco?: string | null
          broker_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: string | null
          longitude?: string | null
          loss_reason?: string | null
          negotiated_value?: number
          observations?: string | null
          origem?: string | null
          process_stage_id?: string | null
          property_address?: string
          property_type?: string
          start_date?: string
          status?: string
          temperature?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_process_stage_id_fkey"
            columns: ["process_stage_id"]
            isOneToOne: false
            referencedRelation: "process_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          logo_icon_url: string | null
          logo_url: string | null
          organization_name: string
          organization_tagline: string | null
          primary_color: string | null
          secondary_color: string | null
          spotlight_broker_id: string | null
          support_phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          logo_icon_url?: string | null
          logo_url?: string | null
          organization_name?: string
          organization_tagline?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          spotlight_broker_id?: string | null
          support_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          logo_icon_url?: string | null
          logo_url?: string | null
          organization_name?: string
          organization_tagline?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          spotlight_broker_id?: string | null
          support_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_spotlight_broker_id_fkey"
            columns: ["spotlight_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      process_stages: {
        Row: {
          agency_id: string | null
          color: string
          company_id: string | null
          created_at: string
          id: string
          is_default: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          color?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          color?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_stages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          allowed_screens: string[] | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          birth_date: string | null
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_login_at: string | null
          manager_id: string | null
          nickname: string | null
          phone: string | null
          status: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          allowed_screens?: string[] | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          last_login_at?: string | null
          manager_id?: string | null
          nickname?: string | null
          phone?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          allowed_screens?: string[] | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          manager_id?: string | null
          nickname?: string | null
          phone?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      push_subscriptions: {
        Row: {
          auth: string
          company_id: string | null
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          company_id?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          company_id?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          company_id: string | null
          created_at: string
          id: string
          role: string
          screen: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          role: string
          screen: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          role?: string
          screen?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          agency_id: string | null
          ano: number | null
          bloco: string | null
          broker_id: string | null
          captador: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_value: number | null
          company_id: string | null
          contract_date: string | null
          created_at: string | null
          estilo: string | null
          gerente: string | null
          id: string
          is_partnership: boolean | null
          latitude: string | null
          longitude: string | null
          mes: number | null
          notes: string | null
          origem: string | null
          pagos: number | null
          parceria_tipo: string | null
          process_stage_id: string | null
          produto: string | null
          property_address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_value: number
          sale_date: string | null
          sale_type: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          tipo: string
          unidade: string | null
          updated_at: string | null
          vendedor: string | null
          vendedor_creci: string | null
          vendedor_nome: string | null
          vendedor_telefone: string | null
          vgc: number
          vgv: number
          visibilidade: string
        }
        Insert: {
          agency_id?: string | null
          ano?: number | null
          bloco?: string | null
          broker_id?: string | null
          captador?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_value?: number | null
          company_id?: string | null
          contract_date?: string | null
          created_at?: string | null
          estilo?: string | null
          gerente?: string | null
          id?: string
          is_partnership?: boolean | null
          latitude?: string | null
          longitude?: string | null
          mes?: number | null
          notes?: string | null
          origem?: string | null
          pagos?: number | null
          parceria_tipo?: string | null
          process_stage_id?: string | null
          produto?: string | null
          property_address: string
          property_type: Database["public"]["Enums"]["property_type"]
          property_value: number
          sale_date?: string | null
          sale_type?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          tipo?: string
          unidade?: string | null
          updated_at?: string | null
          vendedor?: string | null
          vendedor_creci?: string | null
          vendedor_nome?: string | null
          vendedor_telefone?: string | null
          vgc: number
          vgv: number
          visibilidade?: string
        }
        Update: {
          agency_id?: string | null
          ano?: number | null
          bloco?: string | null
          broker_id?: string | null
          captador?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_value?: number | null
          company_id?: string | null
          contract_date?: string | null
          created_at?: string | null
          estilo?: string | null
          gerente?: string | null
          id?: string
          is_partnership?: boolean | null
          latitude?: string | null
          longitude?: string | null
          mes?: number | null
          notes?: string | null
          origem?: string | null
          pagos?: number | null
          parceria_tipo?: string | null
          process_stage_id?: string | null
          produto?: string | null
          property_address?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          property_value?: number
          sale_date?: string | null
          sale_type?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          tipo?: string
          unidade?: string | null
          updated_at?: string | null
          vendedor?: string | null
          vendedor_creci?: string | null
          vendedor_nome?: string | null
          vendedor_telefone?: string | null
          vgc?: number
          vgv?: number
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      sticky_notes: {
        Row: {
          agency_id: string | null
          color: string
          company_id: string | null
          content: string
          created_at: string
          id: string
          is_minimized: boolean
          is_pinned: boolean
          position_x: number | null
          position_y: number | null
          title: string
          updated_at: string
          user_id: string
          visibility_mode: string
        }
        Insert: {
          agency_id?: string | null
          color?: string
          company_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_minimized?: boolean
          is_pinned?: boolean
          position_x?: number | null
          position_y?: number | null
          title?: string
          updated_at?: string
          user_id: string
          visibility_mode?: string
        }
        Update: {
          agency_id?: string | null
          color?: string
          company_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_minimized?: boolean
          is_pinned?: boolean
          position_x?: number | null
          position_y?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "sticky_notes_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sticky_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          month: number
          target_sales_count: number | null
          target_value: number
          team_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          achieved_sales_count?: number | null
          achieved_value?: number | null
          broker_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          month: number
          target_sales_count?: number | null
          target_value?: number
          team_id?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          achieved_sales_count?: number | null
          achieved_value?: number | null
          broker_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          month?: number
          target_sales_count?: number | null
          target_value?: number
          team_id?: string | null
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
          {
            foreignKeyName: "targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "targets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          company_id: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "broker_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "broker_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "broker_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          agency_id: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      check_is_event_owner: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      check_is_event_shared_with_user: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      get_current_user_admin_status: { Args: never; Returns: boolean }
      get_manager_user_ids: { Args: never; Returns: string[] }
      get_team_hierarchy: {
        Args: { user_id: string }
        Returns: {
          is_manager: boolean
          team_id: string
          team_members: string[]
          team_name: string
        }[]
      }
      get_user_agency_id: { Args: { _user_id: string }; Returns: string }
      get_user_allowed_screens: { Args: { user_id: string }; Returns: string[] }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_primary_role: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of_user: {
        Args: { manager_uid: string; target_uid: string }
        Returns: boolean
      }
      is_socio: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
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
      app_role:
        | "admin"
        | "diretor"
        | "gerente"
        | "corretor"
        | "user"
        | "super_admin"
        | "socio"
      broker_status: "ativo" | "inativo" | "ferias"
      property_type: "apartamento" | "casa" | "terreno" | "comercial" | "rural"
      sale_status: "pendente" | "confirmada" | "cancelada" | "distrato"
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
      app_role: [
        "admin",
        "diretor",
        "gerente",
        "corretor",
        "user",
        "super_admin",
        "socio",
      ],
      broker_status: ["ativo", "inativo", "ferias"],
      property_type: ["apartamento", "casa", "terreno", "comercial", "rural"],
      sale_status: ["pendente", "confirmada", "cancelada", "distrato"],
    },
  },
} as const
