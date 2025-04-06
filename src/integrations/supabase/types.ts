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
      appointments: {
        Row: {
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string | null
          therapist_id: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string | null
          therapist_id: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          therapist_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing: {
        Row: {
          amount: number
          appointment_id: string | null
          claim_id: string | null
          client_id: string
          created_at: string
          id: string
          insurance_provider: string | null
          status: string | null
          submitted_date: string | null
          therapist_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          claim_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          insurance_provider?: string | null
          status?: string | null
          submitted_date?: string | null
          therapist_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          claim_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          insurance_provider?: string | null
          status?: string | null
          submitted_date?: string | null
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invitations: {
        Row: {
          client_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_code: string
          status: string
          therapist_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_code: string
          status?: string
          therapist_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          status?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          consent_date: string | null
          consent_version: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          encryption_key_id: string | null
          first_name: string
          id: string
          last_name: string
          phi_data: Json | null
          phone: string | null
          status: string | null
          therapist_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          consent_date?: string | null
          consent_version?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          encryption_key_id?: string | null
          first_name: string
          id?: string
          last_name: string
          phi_data?: Json | null
          phone?: string | null
          status?: string | null
          therapist_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          consent_date?: string | null
          consent_version?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          encryption_key_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phi_data?: Json | null
          phone?: string | null
          status?: string | null
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_access_logs_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "session_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          appointment_id: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          is_private: boolean | null
          therapist_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          therapist_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_profiles: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          license_number: string | null
          profile_image_url: string | null
          specialty: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          license_number?: string | null
          profile_image_url?: string | null
          specialty?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          license_number?: string | null
          profile_image_url?: string | null
          specialty?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
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
      accept_client_invitation: {
        Args: {
          invite_code_param: string
          user_id_param: string
        }
        Returns: Json
      }
      add_role_to_user: {
        Args: {
          user_id_param: string
          role_name: string
        }
        Returns: string
      }
      create_client_invitation: {
        Args: {
          therapist_id_param: string
          client_id_param: string
          email_param: string
        }
        Returns: Json
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_roles: {
        Args: {
          user_id_param: string
        }
        Returns: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      send_client_invitation_email: {
        Args: {
          invite_id: string
        }
        Returns: Json
      }
      user_has_role: {
        Args: {
          user_id_param: string
          role_name: string
        }
        Returns: boolean
      }
      verify_invite_code: {
        Args: {
          invite_code_param: string
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
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
