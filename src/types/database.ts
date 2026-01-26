export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      email_threads: {
        Row: {
          id: string
          conversation_id: string
          subject: string | null
          first_sender_email: string | null
          assigned_folder_path: string | null
          assigned_folder_id: string | null
          assignment_source: 'ai_decision' | 'user_correction' | 'thread_inheritance' | 'backfill'
          email_count: number
          last_email_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          subject?: string | null
          first_sender_email?: string | null
          assigned_folder_path?: string | null
          assigned_folder_id?: string | null
          assignment_source?: 'ai_decision' | 'user_correction' | 'thread_inheritance' | 'backfill'
          email_count?: number
          last_email_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          subject?: string | null
          first_sender_email?: string | null
          assigned_folder_path?: string | null
          assigned_folder_id?: string | null
          assignment_source?: 'ai_decision' | 'user_correction' | 'thread_inheritance' | 'backfill'
          email_count?: number
          last_email_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_decisions: {
        Row: {
          id: string
          outlook_message_id: string | null
          conversation_id: string | null
          subject: string | null
          sender_email: string | null
          ai_action: string | null
          ai_folder_path: string | null
          ai_category: string | null
          ai_urgency: string | null
          ai_assignee: string | null
          ai_should_reply: boolean | null
          ai_reply_skip_reason: string | null
          final_folder_path: string | null
          final_action: string | null
          was_corrected: boolean
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          outlook_message_id?: string | null
          conversation_id?: string | null
          subject?: string | null
          sender_email?: string | null
          ai_action?: string | null
          ai_folder_path?: string | null
          ai_category?: string | null
          ai_urgency?: string | null
          ai_assignee?: string | null
          ai_should_reply?: boolean | null
          ai_reply_skip_reason?: string | null
          final_folder_path?: string | null
          final_action?: string | null
          was_corrected?: boolean
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          outlook_message_id?: string | null
          conversation_id?: string | null
          subject?: string | null
          sender_email?: string | null
          ai_action?: string | null
          ai_folder_path?: string | null
          ai_category?: string | null
          ai_urgency?: string | null
          ai_assignee?: string | null
          ai_should_reply?: boolean | null
          ai_reply_skip_reason?: string | null
          final_folder_path?: string | null
          final_action?: string | null
          was_corrected?: boolean
          embedding?: number[] | null
          created_at?: string
        }
      }
      email_corrections: {
        Row: {
          id: string
          decision_id: string
          original_folder_path: string
          corrected_folder_path: string
          embedding: number[] | null
          learning_weight: number
          created_at: string
        }
        Insert: {
          id?: string
          decision_id: string
          original_folder_path: string
          corrected_folder_path: string
          embedding?: number[] | null
          learning_weight?: number
          created_at?: string
        }
        Update: {
          id?: string
          decision_id?: string
          original_folder_path?: string
          corrected_folder_path?: string
          embedding?: number[] | null
          learning_weight?: number
          created_at?: string
        }
      }
      email_analytics: {
        Row: {
          id: string
          timestamp: string
          workflow_name: string
          workflow_execution_id: string | null
          node_name: string | null
          operation_type: string | null
          outlook_message_id: string | null
          subject: string | null
          sender_email: string | null
          duration_ms: number | null
          start_time: string | null
          end_time: string | null
          model_used: string | null
          input_tokens: number | null
          output_tokens: number | null
          total_tokens: number | null
          estimated_cost_usd: number | null
          status: 'success' | 'error' | 'skipped' | 'retry'
          error_code: string | null
          error_message: string | null
          error_stack: string | null
          ai_decision: Json | null
          final_outcome: Json | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          timestamp?: string
          workflow_name: string
          workflow_execution_id?: string | null
          node_name?: string | null
          operation_type?: string | null
          outlook_message_id?: string | null
          subject?: string | null
          sender_email?: string | null
          duration_ms?: number | null
          start_time?: string | null
          end_time?: string | null
          model_used?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_tokens?: number | null
          estimated_cost_usd?: number | null
          status?: 'success' | 'error' | 'skipped' | 'retry'
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          ai_decision?: Json | null
          final_outcome?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          timestamp?: string
          workflow_name?: string
          workflow_execution_id?: string | null
          node_name?: string | null
          operation_type?: string | null
          outlook_message_id?: string | null
          subject?: string | null
          sender_email?: string | null
          duration_ms?: number | null
          start_time?: string | null
          end_time?: string | null
          model_used?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_tokens?: number | null
          estimated_cost_usd?: number | null
          status?: 'success' | 'error' | 'skipped' | 'retry'
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          ai_decision?: Json | null
          final_outcome?: Json | null
          metadata?: Json | null
        }
      }
      email_system_config: {
        Row: {
          id: string
          config_key: string
          config_value: string
          config_type: string
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          config_key: string
          config_value: string
          config_type?: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: string
          config_type?: string
          description?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_similar_decisions: {
        Args: {
          query_embedding: number[]
          similarity_threshold: number
          max_results: number
        }
        Returns: {
          id: string
          subject: string
          sender_email: string
          final_folder_path: string
          similarity: number
        }[]
      }
      find_similar_corrections: {
        Args: {
          query_embedding: number[]
          similarity_threshold: number
          max_results: number
        }
        Returns: {
          id: string
          corrected_folder_path: string
          learning_weight: number
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
