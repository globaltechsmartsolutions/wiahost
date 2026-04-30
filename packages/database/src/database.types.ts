export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          approved_at: string | null
          approved_by: string | null
          contains_personal_data: boolean
          created_at: string
          id: string
          metadata: Json
          model_name: string | null
          prediction_id: string | null
          prompt_hash: string | null
          prompt_summary: Json
          provider: string | null
          response_summary: Json
          risk_level: Database["public"]["Enums"]["severity"]
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          contains_personal_data?: boolean
          created_at?: string
          id?: string
          metadata?: Json
          model_name?: string | null
          prediction_id?: string | null
          prompt_hash?: string | null
          prompt_summary?: Json
          provider?: string | null
          response_summary?: Json
          risk_level?: Database["public"]["Enums"]["severity"]
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          contains_personal_data?: boolean
          created_at?: string
          id?: string
          metadata?: Json
          model_name?: string | null
          prediction_id?: string | null
          prompt_hash?: string | null
          prompt_summary?: Json
          provider?: string | null
          response_summary?: Json
          risk_level?: Database["public"]["Enums"]["severity"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_audit_log_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_audit_log_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "model_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"]
          conditions: Json
          created_at: string
          created_by: string | null
          delay_minutes: number
          enabled: boolean
          id: string
          name: string
          template: string
          trigger: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["message_channel"]
          conditions?: Json
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          enabled?: boolean
          id?: string
          name: string
          template: string
          trigger: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["message_channel"]
          conditions?: Json
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          enabled?: boolean
          id?: string
          name?: string
          template?: string
          trigger?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          created_at: string
          error_message: string | null
          executed_at: string | null
          guest_id: string | null
          id: string
          reservation_id: string | null
          rule_id: string | null
          status: Database["public"]["Enums"]["sync_status"]
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          guest_id?: string | null
          id?: string
          reservation_id?: string | null
          rule_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          guest_id?: string | null
          id?: string
          reservation_id?: string | null
          rule_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_blocks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          property_id: string
          reason: string
          reservation_id: string | null
          source: Database["public"]["Enums"]["channel_type"]
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          property_id: string
          reason?: string
          reservation_id?: string | null
          source?: Database["public"]["Enums"]["channel_type"]
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          property_id?: string
          reason?: string
          reservation_id?: string | null
          source?: Database["public"]["Enums"]["channel_type"]
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_blocks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_blocks_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_accounts: {
        Row: {
          account_label: string
          auth_mode: string
          channel: Database["public"]["Enums"]["channel_type"]
          connected_at: string | null
          created_at: string
          external_account_id: string | null
          health_status: Database["public"]["Enums"]["sync_status"]
          id: string
          last_checked_at: string | null
          notes: string | null
          scopes: Json
          status: string
          updated_at: string
        }
        Insert: {
          account_label: string
          auth_mode?: string
          channel: Database["public"]["Enums"]["channel_type"]
          connected_at?: string | null
          created_at?: string
          external_account_id?: string | null
          health_status?: Database["public"]["Enums"]["sync_status"]
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          scopes?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          account_label?: string
          auth_mode?: string
          channel?: Database["public"]["Enums"]["channel_type"]
          connected_at?: string | null
          created_at?: string
          external_account_id?: string | null
          health_status?: Database["public"]["Enums"]["sync_status"]
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          scopes?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      channel_sync_events: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          created_at: string
          direction: string
          error_message: string | null
          id: string
          listing_id: string | null
          payload: Json
          property_id: string | null
          status: Database["public"]["Enums"]["sync_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          direction: string
          error_message?: string | null
          id?: string
          listing_id?: string | null
          payload?: Json
          property_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          listing_id?: string | null
          payload?: Json
          property_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "channel_sync_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_sync_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_message_id: string | null
          id: string
          metadata: Json
          read_at: string | null
          sender_profile_id: string | null
          sent_at: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["message_channel"]
          conversation_id: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          external_message_id?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          sender_profile_id?: string | null
          sent_at?: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          external_message_id?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          sender_profile_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          created_at: string
          guest_id: string | null
          id: string
          last_message_at: string | null
          property_id: string
          reservation_id: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          last_message_at?: string | null
          property_id: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          last_message_at?: string | null
          property_id?: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          incident_id: string | null
          mime_type: string | null
          owner_profile_id: string | null
          property_id: string | null
          reservation_id: string | null
          storage_path: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id?: string | null
          mime_type?: string | null
          owner_profile_id?: string | null
          property_id?: string | null
          reservation_id?: string | null
          storage_path: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string | null
          mime_type?: string | null
          owner_profile_id?: string | null
          property_id?: string | null
          reservation_id?: string | null
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          preferred_language: string
          tags: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_language?: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_language?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: []
      }
      incident_features: {
        Row: {
          actual_cost: number | null
          category: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          incident_id: string
          metadata: Json
          property_id: string
          recurrence_count: number
          reservation_id: string | null
          resolution_minutes: number | null
          severity_final: Database["public"]["Enums"]["severity"] | null
          severity_initial: Database["public"]["Enums"]["severity"] | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          incident_id: string
          metadata?: Json
          property_id: string
          recurrence_count?: number
          reservation_id?: string | null
          resolution_minutes?: number | null
          severity_final?: Database["public"]["Enums"]["severity"] | null
          severity_initial?: Database["public"]["Enums"]["severity"] | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          incident_id?: string
          metadata?: Json
          property_id?: string
          recurrence_count?: number
          reservation_id?: string | null
          resolution_minutes?: number | null
          severity_final?: Database["public"]["Enums"]["severity"] | null
          severity_initial?: Database["public"]["Enums"]["severity"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_features_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: true
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_features_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          charge_amount: number | null
          created_at: string
          description: string
          estimated_cost: number | null
          id: string
          property_id: string
          reported_by: string | null
          reservation_id: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["severity"]
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          charge_amount?: number | null
          created_at?: string
          description: string
          estimated_cost?: number | null
          id?: string
          property_id: string
          reported_by?: string | null
          reservation_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          charge_amount?: number | null
          created_at?: string
          description?: string
          estimated_cost?: number | null
          id?: string
          property_id?: string
          reported_by?: string | null
          reservation_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_labels: {
        Row: {
          category: string | null
          confidence: number | null
          conversation_id: string
          created_at: string
          id: string
          intent: string | null
          labeled_by: string | null
          language: string | null
          message_id: string | null
          metadata: Json
          rationale: string | null
          sentiment: string | null
          source: Database["public"]["Enums"]["ai_label_source"]
          updated_at: string
          urgency: Database["public"]["Enums"]["severity"] | null
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          conversation_id: string
          created_at?: string
          id?: string
          intent?: string | null
          labeled_by?: string | null
          language?: string | null
          message_id?: string | null
          metadata?: Json
          rationale?: string | null
          sentiment?: string | null
          source?: Database["public"]["Enums"]["ai_label_source"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["severity"] | null
        }
        Update: {
          category?: string | null
          confidence?: number | null
          conversation_id?: string
          created_at?: string
          id?: string
          intent?: string | null
          labeled_by?: string | null
          language?: string | null
          message_id?: string | null
          metadata?: Json
          rationale?: string | null
          sentiment?: string | null
          source?: Database["public"]["Enums"]["ai_label_source"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["severity"] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_labels_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_labels_labeled_by_fkey"
            columns: ["labeled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_labels_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      model_predictions: {
        Row: {
          confidence: number | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string
          explanation: Json
          feedback: Database["public"]["Enums"]["ai_feedback_value"] | null
          id: string
          incident_id: string | null
          input_hash: string
          input_summary: Json
          model_name: string
          model_version: string
          output: Json
          property_id: string | null
          reservation_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["ai_prediction_status"]
          task: Database["public"]["Enums"]["ai_model_task"]
          task_id: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type: string
          explanation?: Json
          feedback?: Database["public"]["Enums"]["ai_feedback_value"] | null
          id?: string
          incident_id?: string | null
          input_hash: string
          input_summary?: Json
          model_name: string
          model_version: string
          output?: Json
          property_id?: string | null
          reservation_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ai_prediction_status"]
          task: Database["public"]["Enums"]["ai_model_task"]
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string
          explanation?: Json
          feedback?: Database["public"]["Enums"]["ai_feedback_value"] | null
          id?: string
          incident_id?: string | null
          input_hash?: string
          input_summary?: Json
          model_name?: string
          model_version?: string
          output?: Json
          property_id?: string | null
          reservation_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ai_prediction_status"]
          task?: Database["public"]["Enums"]["ai_model_task"]
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_predictions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_predictions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_predictions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_predictions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_predictions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_predictions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_predictions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_push_tokens: {
        Row: {
          app_version: string | null
          created_at: string
          device_name: string | null
          expo_push_token: string
          id: string
          last_seen_at: string
          platform: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          expo_push_token: string
          id?: string
          last_seen_at?: string
          platform: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          expo_push_token?: string
          id?: string
          last_seen_at?: string
          platform?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_deliveries: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          expo_push_token: string
          expo_ticket_id: string | null
          id: string
          notification_id: string | null
          payload: Json
          profile_id: string
          sent_at: string
          status: string
          token_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expo_push_token: string
          expo_ticket_id?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json
          profile_id: string
          sent_at?: string
          status?: string
          token_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expo_push_token?: string
          expo_ticket_id?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json
          profile_id?: string
          sent_at?: string
          status?: string
          token_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_deliveries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_deliveries_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "mobile_push_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_events: {
        Row: {
          actor_profile_id: string | null
          actor_type: Database["public"]["Enums"]["ai_actor_type"]
          conversation_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_name: string
          id: string
          incident_id: string | null
          metadata: Json
          occurred_at: string
          property_id: string | null
          reservation_id: string | null
          source: string
          task_id: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          actor_type?: Database["public"]["Enums"]["ai_actor_type"]
          conversation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_name: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          occurred_at?: string
          property_id?: string | null
          reservation_id?: string | null
          source?: string
          task_id?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          actor_type?: Database["public"]["Enums"]["ai_actor_type"]
          conversation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_name?: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          occurred_at?: string
          property_id?: string | null
          reservation_id?: string | null
          source?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_accounts: {
        Row: {
          company_name: string | null
          created_at: string
          display_name: string
          id: string
          payout_notes: string | null
          profile_id: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          display_name: string
          id?: string
          payout_notes?: string | null
          profile_id?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          display_name?: string
          id?: string
          payout_notes?: string | null
          profile_id?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_statements: {
        Row: {
          cleaning_costs: number
          created_at: string
          gross_revenue: number
          id: string
          maintenance_costs: number
          net_payout: number
          owner_account_id: string
          period_end: string
          period_start: string
          platform_fees: number
          property_id: string | null
          status: Database["public"]["Enums"]["sync_status"]
          updated_at: string
        }
        Insert: {
          cleaning_costs?: number
          created_at?: string
          gross_revenue?: number
          id?: string
          maintenance_costs?: number
          net_payout?: number
          owner_account_id: string
          period_end: string
          period_start: string
          platform_fees?: number
          property_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
        }
        Update: {
          cleaning_costs?: number
          created_at?: string
          gross_revenue?: number
          id?: string
          maintenance_costs?: number
          net_payout?: number
          owner_account_id?: string
          period_end?: string
          period_start?: string
          platform_fees?: number
          property_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_statements_owner_account_id_fkey"
            columns: ["owner_account_id"]
            isOneToOne: false
            referencedRelation: "owner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_statements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          guest_id: string | null
          id: string
          metadata: Json
          paid_at: string | null
          provider: string
          provider_payment_id: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          guest_id?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_observations: {
        Row: {
          approved_price: number | null
          booking_pace: number | null
          conversion_status: string | null
          created_at: string
          currency: string
          current_price: number | null
          final_price: number | null
          id: string
          lead_time_days: number | null
          metadata: Json
          observed_for: string
          occupancy_rate: number | null
          property_id: string
          reservation_id: string | null
          source: string
          suggested_price: number | null
        }
        Insert: {
          approved_price?: number | null
          booking_pace?: number | null
          conversion_status?: string | null
          created_at?: string
          currency?: string
          current_price?: number | null
          final_price?: number | null
          id?: string
          lead_time_days?: number | null
          metadata?: Json
          observed_for: string
          occupancy_rate?: number | null
          property_id: string
          reservation_id?: string | null
          source?: string
          suggested_price?: number | null
        }
        Update: {
          approved_price?: number | null
          booking_pace?: number | null
          conversion_status?: string | null
          created_at?: string
          currency?: string
          current_price?: number | null
          final_price?: number | null
          id?: string
          lead_time_days?: number | null
          metadata?: Json
          observed_for?: string
          occupancy_rate?: number | null
          property_id?: string
          reservation_id?: string | null
          source?: string
          suggested_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_observations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_observations_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line: string
          amenities: Json
          base_price: number
          bathrooms: number
          bedrooms: number
          checkin_instructions: string | null
          city: string
          cleaning_fee: number
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          house_rules: string | null
          id: string
          internal_name: string | null
          latitude: number | null
          longitude: number | null
          max_guests: number
          name: string
          owner_account_id: string | null
          postal_code: string | null
          province: string | null
          status: Database["public"]["Enums"]["property_status"]
          updated_at: string
        }
        Insert: {
          address_line: string
          amenities?: Json
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          checkin_instructions?: string | null
          city: string
          cleaning_fee?: number
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          house_rules?: string | null
          id?: string
          internal_name?: string | null
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          name: string
          owner_account_id?: string | null
          postal_code?: string | null
          province?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
        }
        Update: {
          address_line?: string
          amenities?: Json
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          checkin_instructions?: string | null
          city?: string
          cleaning_fee?: number
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          house_rules?: string | null
          id?: string
          internal_name?: string | null
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          name?: string
          owner_account_id?: string | null
          postal_code?: string | null
          province?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_account_id_fkey"
            columns: ["owner_account_id"]
            isOneToOne: false
            referencedRelation: "owner_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listings: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          channel_url: string | null
          created_at: string
          external_listing_id: string | null
          id: string
          last_synced_at: string | null
          property_id: string
          public_slug: string | null
          status: Database["public"]["Enums"]["listing_status"]
          sync_enabled: boolean
          sync_notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel_type"]
          channel_url?: string | null
          created_at?: string
          external_listing_id?: string | null
          id?: string
          last_synced_at?: string | null
          property_id: string
          public_slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          sync_enabled?: boolean
          sync_notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_url?: string | null
          created_at?: string
          external_listing_id?: string | null
          id?: string
          last_synced_at?: string | null
          property_id?: string
          public_slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          sync_enabled?: boolean
          sync_notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_audit_memories: {
        Row: {
          area: Database["public"]["Enums"]["quality_audit_area"]
          component: string | null
          created_at: string
          description: string
          finding_hash: string
          first_seen_at: string
          id: string
          last_seen_at: string
          metadata: Json
          resolved_at: string | null
          route: string | null
          severity: Database["public"]["Enums"]["severity"]
          status: Database["public"]["Enums"]["quality_audit_status"]
          title: string
          updated_at: string
        }
        Insert: {
          area: Database["public"]["Enums"]["quality_audit_area"]
          component?: string | null
          created_at?: string
          description: string
          finding_hash: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          resolved_at?: string | null
          route?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          status?: Database["public"]["Enums"]["quality_audit_status"]
          title: string
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["quality_audit_area"]
          component?: string | null
          created_at?: string
          description?: string
          finding_hash?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          resolved_at?: string | null
          route?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          status?: Database["public"]["Enums"]["quality_audit_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservation_snapshots: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          check_in: string
          check_out: string
          created_at: string
          id: string
          lead_time_days: number | null
          metadata: Json
          nightly_rate: number | null
          nights_count: number | null
          payout_amount: number | null
          property_id: string
          reservation_id: string
          snapshot_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel_type"]
          check_in: string
          check_out: string
          created_at?: string
          id?: string
          lead_time_days?: number | null
          metadata?: Json
          nightly_rate?: number | null
          nights_count?: number | null
          payout_amount?: number | null
          property_id: string
          reservation_id: string
          snapshot_date?: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          check_in?: string
          check_out?: string
          created_at?: string
          id?: string
          lead_time_days?: number | null
          metadata?: Json
          nightly_rate?: number | null
          nights_count?: number | null
          payout_amount?: number | null
          property_id?: string
          reservation_id?: string
          snapshot_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_snapshots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_snapshots_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          check_in: string
          check_out: string
          cleaning_fee: number
          created_at: string
          currency: string
          external_reservation_id: string | null
          guest_id: string
          guests_count: number
          id: string
          nightly_rate: number
          notes: string | null
          payout_amount: number
          property_id: string
          security_deposit: number
          source_payload: Json
          status: Database["public"]["Enums"]["reservation_status"]
          taxes_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel_type"]
          check_in: string
          check_out: string
          cleaning_fee?: number
          created_at?: string
          currency?: string
          external_reservation_id?: string | null
          guest_id: string
          guests_count?: number
          id?: string
          nightly_rate?: number
          notes?: string | null
          payout_amount?: number
          property_id: string
          security_deposit?: number
          source_payload?: Json
          status?: Database["public"]["Enums"]["reservation_status"]
          taxes_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          check_in?: string
          check_out?: string
          cleaning_fee?: number
          created_at?: string
          currency?: string
          external_reservation_id?: string | null
          guest_id?: string
          guests_count?: number
          id?: string
          nightly_rate?: number
          notes?: string | null
          payout_amount?: number
          property_id?: string
          security_deposit?: number
          source_payload?: Json
          status?: Database["public"]["Enums"]["reservation_status"]
          taxes_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          label: string
          position: number
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          label: string
          position?: number
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          label?: string
          position?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_outcomes: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json
          outcome: string
          priority: Database["public"]["Enums"]["severity"] | null
          property_id: string
          reservation_id: string | null
          sla_due_at: string | null
          sla_minutes_delta: number | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          outcome?: string
          priority?: Database["public"]["Enums"]["severity"] | null
          property_id: string
          reservation_id?: string | null
          sla_due_at?: string | null
          sla_minutes_delta?: number | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          outcome?: string
          priority?: Database["public"]["Enums"]["severity"] | null
          property_id?: string
          reservation_id?: string | null
          sla_due_at?: string | null
          sla_minutes_delta?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_outcomes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_outcomes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_outcomes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_outcomes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          priority: Database["public"]["Enums"]["severity"]
          property_id: string
          reservation_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["severity"]
          property_id: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["severity"]
          property_id?: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_property: { Args: { property_id: string }; Returns: boolean }
      can_view_conversation: {
        Args: { conversation_id: string }
        Returns: boolean
      }
      can_view_reservation: {
        Args: { reservation_id: string }
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_operator: { Args: never; Returns: boolean }
    }
    Enums: {
      ai_actor_type: "user" | "system" | "automation" | "model"
      ai_feedback_value:
        | "accepted"
        | "edited"
        | "rejected"
        | "ignored"
        | "resolved"
        | "failed"
      ai_label_source: "human" | "rule" | "model" | "import"
      ai_model_task:
        | "message_priority"
        | "message_summary"
        | "task_priority"
        | "incident_risk"
        | "pricing_recommendation"
        | "occupancy_forecast"
        | "anomaly_detection"
        | "visual_audit"
        | "functional_audit"
        | "document_extraction"
        | "other"
      ai_prediction_status:
        | "draft"
        | "suggested"
        | "accepted"
        | "rejected"
        | "expired"
        | "superseded"
      automation_trigger:
        | "reservation_confirmed"
        | "checkin_24h"
        | "checkin_1h"
        | "checkout_time"
        | "cleaning_completed"
        | "message_unanswered"
        | "noise_alert"
        | "cancellation"
        | "low_review"
      channel_type:
        | "direct"
        | "airbnb"
        | "booking"
        | "vrbo"
        | "expedia"
        | "google_vacation_rentals"
        | "manual"
      conversation_status:
        | "open"
        | "pending_guest"
        | "pending_team"
        | "resolved"
        | "archived"
      incident_status:
        | "open"
        | "investigating"
        | "resolved"
        | "charged"
        | "cancelled"
      listing_status: "draft" | "published" | "paused" | "sync_error"
      message_channel:
        | "inbox"
        | "email"
        | "whatsapp"
        | "sms"
        | "airbnb"
        | "booking"
        | "vrbo"
      message_direction: "inbound" | "outbound" | "internal"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "refunded"
        | "failed"
        | "disputed"
      property_status: "draft" | "active" | "paused" | "archived"
      quality_audit_area:
        | "visual"
        | "functional"
        | "accessibility"
        | "performance"
        | "security"
        | "copy"
        | "other"
      quality_audit_status: "open" | "accepted" | "resolved" | "ignored"
      reservation_status:
        | "inquiry"
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      severity: "low" | "medium" | "high" | "critical"
      sync_status: "pending" | "synced" | "failed" | "ignored"
      task_status:
        | "open"
        | "scheduled"
        | "in_progress"
        | "blocked"
        | "done"
        | "cancelled"
      task_type:
        | "cleaning"
        | "maintenance"
        | "inspection"
        | "guest_request"
        | "admin"
      user_role: "admin" | "operator" | "owner" | "housekeeping" | "maintenance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_actor_type: ["user", "system", "automation", "model"],
      ai_feedback_value: [
        "accepted",
        "edited",
        "rejected",
        "ignored",
        "resolved",
        "failed",
      ],
      ai_label_source: ["human", "rule", "model", "import"],
      ai_model_task: [
        "message_priority",
        "message_summary",
        "task_priority",
        "incident_risk",
        "pricing_recommendation",
        "occupancy_forecast",
        "anomaly_detection",
        "visual_audit",
        "functional_audit",
        "document_extraction",
        "other",
      ],
      ai_prediction_status: [
        "draft",
        "suggested",
        "accepted",
        "rejected",
        "expired",
        "superseded",
      ],
      automation_trigger: [
        "reservation_confirmed",
        "checkin_24h",
        "checkin_1h",
        "checkout_time",
        "cleaning_completed",
        "message_unanswered",
        "noise_alert",
        "cancellation",
        "low_review",
      ],
      channel_type: [
        "direct",
        "airbnb",
        "booking",
        "vrbo",
        "expedia",
        "google_vacation_rentals",
        "manual",
      ],
      conversation_status: [
        "open",
        "pending_guest",
        "pending_team",
        "resolved",
        "archived",
      ],
      incident_status: [
        "open",
        "investigating",
        "resolved",
        "charged",
        "cancelled",
      ],
      listing_status: ["draft", "published", "paused", "sync_error"],
      message_channel: [
        "inbox",
        "email",
        "whatsapp",
        "sms",
        "airbnb",
        "booking",
        "vrbo",
      ],
      message_direction: ["inbound", "outbound", "internal"],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "refunded",
        "failed",
        "disputed",
      ],
      property_status: ["draft", "active", "paused", "archived"],
      quality_audit_area: [
        "visual",
        "functional",
        "accessibility",
        "performance",
        "security",
        "copy",
        "other",
      ],
      quality_audit_status: ["open", "accepted", "resolved", "ignored"],
      reservation_status: [
        "inquiry",
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      severity: ["low", "medium", "high", "critical"],
      sync_status: ["pending", "synced", "failed", "ignored"],
      task_status: [
        "open",
        "scheduled",
        "in_progress",
        "blocked",
        "done",
        "cancelled",
      ],
      task_type: [
        "cleaning",
        "maintenance",
        "inspection",
        "guest_request",
        "admin",
      ],
      user_role: ["admin", "operator", "owner", "housekeeping", "maintenance"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
