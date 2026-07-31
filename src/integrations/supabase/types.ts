export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity: string;
          branch_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json;
          user_id: string | null;
        };
        Insert: {
          activity: string;
          branch_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          user_id?: string | null;
        };
        Update: {
          activity?: string;
          branch_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          branch_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json;
          user_id: string | null;
        };
        Insert: {
          action: string;
          branch_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          branch_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: {
          city: string | null;
          code: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          phone: string | null;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          code: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          phone?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          code?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          phone?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      call_logs: {
        Row: {
          branch_id: string | null;
          call_status_id: string | null;
          called_at: string;
          called_by: string;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          duration_seconds: number;
          id: string;
          is_connected: boolean;
          loan_id: string | null;
          next_followup_date: string | null;
          next_followup_time: string | null;
          ptp_amount: number | null;
          ptp_date: string | null;
          purpose: string | null;
          remark: string | null;
          talked_with: string | null;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          call_status_id?: string | null;
          called_at?: string;
          called_by: string;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          duration_seconds?: number;
          id?: string;
          is_connected?: boolean;
          loan_id?: string | null;
          next_followup_date?: string | null;
          next_followup_time?: string | null;
          ptp_amount?: number | null;
          ptp_date?: string | null;
          purpose?: string | null;
          remark?: string | null;
          talked_with?: string | null;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          call_status_id?: string | null;
          called_at?: string;
          called_by?: string;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          duration_seconds?: number;
          id?: string;
          is_connected?: boolean;
          loan_id?: string | null;
          next_followup_date?: string | null;
          next_followup_time?: string | null;
          ptp_amount?: number | null;
          ptp_date?: string | null;
          purpose?: string | null;
          remark?: string | null;
          talked_with?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_logs_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_call_status_id_fkey";
            columns: ["call_status_id"];
            isOneToOne: false;
            referencedRelation: "call_status";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_called_by_fkey";
            columns: ["called_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "call_logs_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
        ];
      };
      call_status: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_active: boolean;
          is_connected: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_connected?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_connected?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address_line: string | null;
          alternate_phone: string | null;
          assigned_to: string | null;
          branch_id: string | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          customer_code: string;
          deleted_at: string | null;
          email: string | null;
          full_name: string;
          id: string;
          kyc_id: string | null;
          notes: string | null;
          phone: string;
          pincode: string | null;
          recovery_status: Database["public"]["Enums"]["recovery_status"];
          state: string | null;
          updated_at: string;
        };
        Insert: {
          address_line?: string | null;
          alternate_phone?: string | null;
          assigned_to?: string | null;
          branch_id?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_code: string;
          deleted_at?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          kyc_id?: string | null;
          notes?: string | null;
          phone: string;
          pincode?: string | null;
          recovery_status?: Database["public"]["Enums"]["recovery_status"];
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line?: string | null;
          alternate_phone?: string | null;
          assigned_to?: string | null;
          branch_id?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_code?: string;
          deleted_at?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          kyc_id?: string | null;
          notes?: string | null;
          phone?: string;
          pincode?: string | null;
          recovery_status?: Database["public"]["Enums"]["recovery_status"];
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customers_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      followups: {
        Row: {
          assigned_to: string;
          branch_id: string | null;
          call_log_id: string | null;
          completed_at: string | null;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          id: string;
          notes: string | null;
          priority: Database["public"]["Enums"]["priority_level"];
          scheduled_date: string;
          scheduled_time: string | null;
          status: Database["public"]["Enums"]["followup_status"];
          updated_at: string;
        };
        Insert: {
          assigned_to: string;
          branch_id?: string | null;
          call_log_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          id?: string;
          notes?: string | null;
          priority?: Database["public"]["Enums"]["priority_level"];
          scheduled_date: string;
          scheduled_time?: string | null;
          status?: Database["public"]["Enums"]["followup_status"];
          updated_at?: string;
        };
        Update: {
          assigned_to?: string;
          branch_id?: string | null;
          call_log_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          id?: string;
          notes?: string | null;
          priority?: Database["public"]["Enums"]["priority_level"];
          scheduled_date?: string;
          scheduled_time?: string | null;
          status?: Database["public"]["Enums"]["followup_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "followups_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_call_log_id_fkey";
            columns: ["call_log_id"];
            isOneToOne: false;
            referencedRelation: "call_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      holidays: {
        Row: {
          branch_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          holiday_date: string;
          id: string;
          is_recurring: boolean;
          name: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          holiday_date: string;
          id?: string;
          is_recurring?: boolean;
          name: string;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          holiday_date?: string;
          id?: string;
          is_recurring?: boolean;
          name?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "holidays_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      import_batches: {
        Row: {
          branch_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          entity_type: string;
          errors: Json;
          failed_rows: number;
          file_name: string;
          id: string;
          success_rows: number;
          total_rows: number;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          entity_type: string;
          errors?: Json;
          failed_rows?: number;
          file_name: string;
          id?: string;
          success_rows?: number;
          total_rows?: number;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          entity_type?: string;
          errors?: Json;
          failed_rows?: number;
          file_name?: string;
          id?: string;
          success_rows?: number;
          total_rows?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_batches_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      loans: {
        Row: {
          branch_id: string | null;
          created_at: string;
          customer_id: string;
          days_past_due: number;
          deleted_at: string | null;
          disbursed_on: string | null;
          emi_amount: number;
          id: string;
          interest_rate: number | null;
          loan_number: string;
          next_due_date: string | null;
          outstanding_amount: number;
          overdue_amount: number;
          principal_amount: number;
          product_name: string | null;
          status: Database["public"]["Enums"]["loan_status"];
          tenure_months: number | null;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          customer_id: string;
          days_past_due?: number;
          deleted_at?: string | null;
          disbursed_on?: string | null;
          emi_amount?: number;
          id?: string;
          interest_rate?: number | null;
          loan_number: string;
          next_due_date?: string | null;
          outstanding_amount?: number;
          overdue_amount?: number;
          principal_amount?: number;
          product_name?: string | null;
          status?: Database["public"]["Enums"]["loan_status"];
          tenure_months?: number | null;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          customer_id?: string;
          days_past_due?: number;
          deleted_at?: string | null;
          disbursed_on?: string | null;
          emi_amount?: number;
          id?: string;
          interest_rate?: number | null;
          loan_number?: string;
          next_due_date?: string | null;
          outstanding_amount?: number;
          overdue_amount?: number;
          principal_amount?: number;
          product_name?: string | null;
          status?: Database["public"]["Enums"]["loan_status"];
          tenure_months?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loans_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loans_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      master_items: {
        Row: {
          branch_id: string | null;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_system: boolean;
          label: string;
          sort_order: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          label: string;
          sort_order?: number;
          type: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          label?: string;
          sort_order?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "master_items_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_templates: {
        Row: {
          body: string;
          branch_id: string | null;
          channel: string;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          body: string;
          branch_id?: string | null;
          channel: string;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string;
          branch_id?: string | null;
          channel?: string;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_templates_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_read: boolean;
          link: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          branch_id: string | null;
          collected_by: string | null;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          id: string;
          loan_id: string;
          mode: string | null;
          paid_on: string;
          reference_no: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          branch_id?: string | null;
          collected_by?: string | null;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          id?: string;
          loan_id: string;
          mode?: string | null;
          paid_on?: string;
          reference_no?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          branch_id?: string | null;
          collected_by?: string | null;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          id?: string;
          loan_id?: string;
          mode?: string | null;
          paid_on?: string;
          reference_no?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_collected_by_fkey";
            columns: ["collected_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          branch_id: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string | null;
          employee_code: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          branch_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string | null;
          employee_code?: string | null;
          full_name?: string;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          branch_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string | null;
          employee_code?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      remarks: {
        Row: {
          author_id: string;
          body: string;
          branch_id: string | null;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          branch_id?: string | null;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          branch_id?: string | null;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "remarks_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "remarks_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "remarks_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          allowed: boolean;
          branch_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          allowed?: boolean;
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          permission: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          allowed?: boolean;
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          permission?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      working_hours: {
        Row: {
          branch_id: string | null;
          created_at: string;
          created_by: string | null;
          day_of_week: number;
          deleted_at: string | null;
          end_time: string;
          id: string;
          is_working_day: boolean;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          day_of_week: number;
          deleted_at?: string | null;
          end_time?: string;
          id?: string;
          is_working_day?: boolean;
          start_time?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          day_of_week?: number;
          deleted_at?: string | null;
          end_time?: string;
          id?: string;
          is_working_day?: boolean;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "working_hours_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_set_user_roles: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _user_id: string;
        };
        Returns: undefined;
      };
      assign_customers: {
        Args: { _assigned_to: string; _customer_ids: string[] };
        Returns: number;
      };
      can_access_branch: { Args: { _branch_id: string }; Returns: boolean };
      current_branch_id: { Args: never; Returns: string };
      has_permission: {
        Args: { _permission: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      import_customers: {
        Args: { _branch_id: string; _file_name: string; _rows: Json };
        Returns: Json;
      };
      import_loans: { Args: { _file_name: string; _rows: Json }; Returns: Json };
      is_admin: { Args: never; Returns: boolean };
      mark_broken_promise: {
        Args: { _customer_id: string; _note: string };
        Returns: undefined;
      };
      record_payment: {
        Args: {
          _amount: number;
          _branch_id: string;
          _customer_id: string;
          _loan_id: string;
          _mark_paid: boolean;
          _mode: string;
          _paid_on: string;
          _reference_no: string;
        };
        Returns: string;
      };
      recovery_bucket_customer_ids: {
        Args: { _bucket: string };
        Returns: {
          customer_id: string;
          in_bucket: boolean;
        }[];
      };
      recovery_queue_page: {
        Args: {
          _assigned_to?: string;
          _branch_id?: string;
          _bucket?: string;
          _limit?: number;
          _loan_search?: string;
          _offset?: number;
          _search?: string;
          _status?: string;
        };
        Returns: {
          assignee_id: string;
          assignee_name: string;
          branch_id: string;
          branch_name: string;
          customer_code: string;
          full_name: string;
          id: string;
          is_broken_promise: boolean;
          last_call_at: string;
          loan_numbers: string[];
          max_dpd: number;
          outstanding: number;
          overdue: number;
          phone: string;
          ptp_amount: number;
          ptp_date: string;
          recovery_status: Database["public"]["Enums"]["recovery_status"];
          total_count: number;
        }[];
      };
      transfer_customers_branch: {
        Args: { _branch_id: string; _customer_ids: string[] };
        Returns: number;
      };
    };
    Enums: {
      app_role: "super_admin" | "branch_manager" | "recovery_executive";
      followup_status: "pending" | "completed" | "missed" | "cancelled";
      loan_status: "active" | "overdue" | "npa" | "closed" | "settled";
      priority_level: "low" | "medium" | "high" | "urgent";
      recovery_status:
        | "new"
        | "in_progress"
        | "ptp"
        | "partially_paid"
        | "paid"
        | "non_contactable"
        | "legal"
        | "written_off";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "branch_manager", "recovery_executive"],
      followup_status: ["pending", "completed", "missed", "cancelled"],
      loan_status: ["active", "overdue", "npa", "closed", "settled"],
      priority_level: ["low", "medium", "high", "urgent"],
      recovery_status: [
        "new",
        "in_progress",
        "ptp",
        "partially_paid",
        "paid",
        "non_contactable",
        "legal",
        "written_off",
      ],
    },
  },
} as const;
