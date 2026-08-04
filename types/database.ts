// Hand-written Phase 1 slice of the Supabase generated types.
// Once the project is linked, replace this with the real output of:
//   npx supabase gen types typescript --linked > types/database.ts
// Keeping it hand-written for now keeps Phase 1 dependency-free.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          industry:
            | 'clinic'
            | 'real_estate'
            | 'training_center'
            | 'instagram_store'
            | 'restaurant'
            | 'beauty_salon'
            | 'lawyer'
            | 'consultant'
            | 'other';
          owner_id: string;
          meta_pixel_id: string | null;
          plan: 'free' | 'starter' | 'growth' | 'pro';
          plan_expires_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          onboarding_dismissed_at: string | null;
          agents_view_all_leads: boolean;
          ga4_measurement_id: string | null;
          default_whatsapp_number: string | null;
          auto_assign_leads: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'meta_pixel_id' | 'plan' | 'plan_expires_at' | 'stripe_customer_id' | 'stripe_subscription_id' | 'onboarding_dismissed_at' | 'agents_view_all_leads' | 'ga4_measurement_id' | 'default_whatsapp_number' | 'auto_assign_leads'> & {
          id?: string;
          meta_pixel_id?: string | null;
          plan?: 'free' | 'starter' | 'growth' | 'pro';
          plan_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_dismissed_at?: string | null;
          agents_view_all_leads?: boolean;
          ga4_measurement_id?: string | null;
          default_whatsapp_number?: string | null;
          auto_assign_leads?: boolean;
        };
        Update: Partial<Database['public']['Tables']['workspaces']['Row']>;
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'agent';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspace_members']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['workspace_members']['Row']>;
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          source: string | null;
          campaign_id: string | null;
          status: 'new' | 'contacted' | 'interested' | 'negotiating' | 'won' | 'lost';
          assigned_to: string | null;
          notes: string | null;
          tags: string[];
          estimated_value: number | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_content: string | null;
          utm_term: string | null;
          custom_fields: Record<string, unknown>;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at' | 'tags' | 'estimated_value' | 'utm_source' | 'utm_medium' | 'utm_content' | 'utm_term' | 'custom_fields' | 'deleted_at'> & {
          id?: string;
          tags?: string[];
          estimated_value?: number | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          custom_fields?: Record<string, unknown>;
          deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          workspace_id: string;
          author_id: string;
          body: string;
          note_type: 'general' | 'call' | 'meeting' | 'email' | 'whatsapp';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_notes']['Row'], 'id' | 'created_at' | 'note_type'> & {
          id?: string;
          note_type?: 'general' | 'call' | 'meeting' | 'email' | 'whatsapp';
        };
        Update: Partial<Database['public']['Tables']['lead_notes']['Row']>;
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          workspace_id: string;
          actor_id: string | null;
          type: 'created' | 'status_changed' | 'assigned' | 'note_added' | 'follow_up_completed';
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_activities']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['lead_activities']['Row']>;
      };
      lead_follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          workspace_id: string;
          assigned_to: string | null;
          due_at: string;
          note: string | null;
          completed_at: string | null;
          notified_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_follow_ups']['Row'], 'id' | 'created_at' | 'notified_at'> & {
          id?: string;
          notified_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['lead_follow_ups']['Row']>;
      };
      landing_pages: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          slug: string;
          template: string;
          status: 'draft' | 'published';
          sections: unknown;
          whatsapp_number: string | null;
          meta_title: string | null;
          meta_description: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['landing_pages']['Row'],
          'id' | 'created_at' | 'updated_at' | 'published_at'
        > & { id?: string; published_at?: string | null };
        Update: Partial<Database['public']['Tables']['landing_pages']['Row']>;
      };
      landing_page_views: {
        Row: {
          id: string;
          landing_page_id: string;
          workspace_id: string;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['landing_page_views']['Row'], 'id' | 'created_at' | 'workspace_id'> & {
          id?: string;
          workspace_id?: string;
        };
        Update: Partial<Database['public']['Tables']['landing_page_views']['Row']>;
      };
      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          platform: 'facebook' | 'instagram' | 'tiktok' | 'snapchat' | 'google' | 'whatsapp' | 'other';
          utm_campaign: string;
          landing_page_id: string | null;
          status: 'draft' | 'active' | 'paused' | 'ended';
          budget: number | null;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Row']>;
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: 'owner' | 'admin' | 'agent';
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['workspace_invitations']['Row'],
          'id' | 'token' | 'expires_at' | 'accepted_at' | 'created_at'
        > & { id?: string; token?: string; expires_at?: string; accepted_at?: string | null };
        Update: Partial<Database['public']['Tables']['workspace_invitations']['Row']>;
      };
      workspace_activity_log: {
        Row: {
          id: string;
          workspace_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_label: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspace_activity_log']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['workspace_activity_log']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth_key: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['push_subscriptions']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Row']>;
      };
      notification_preferences: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          muted_types: string[];
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notification_preferences']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Row']>;
      };
      appointment_settings: {
        Row: {
          workspace_id: string;
          enabled: boolean;
          working_days: number[];
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          max_bookings_per_slot: number;
          holidays: string[];
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['appointment_settings']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['appointment_settings']['Row']>;
      };
      appointments: {
        Row: {
          id: string;
          workspace_id: string;
          customer_name: string;
          phone: string | null;
          email: string | null;
          appointment_date: string;
          start_time: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          source: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'status' | 'source'> & {
          id?: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          source?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Row']>;
      };
      orders: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string | null;
          product_name: string;
          price: number;
          currency: string;
          payment_method: string | null;
          status: 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'currency'> & {
          id?: string;
          status?: 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled';
          currency?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
      };
      testimonials: {
        Row: {
          id: string;
          workspace_id: string;
          customer_name: string;
          avatar_url: string | null;
          subtitle: string | null;
          rating: number;
          body: string;
          is_visible: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['testimonials']['Row'], 'id' | 'created_at' | 'rating' | 'is_visible' | 'display_order'> & {
          id?: string;
          rating?: number;
          is_visible?: boolean;
          display_order?: number;
        };
        Update: Partial<Database['public']['Tables']['testimonials']['Row']>;
      };
      automation_rules: {
        Row: {
          id: string;
          workspace_id: string;
          rule_type: 'lead_stale_reminder' | 'interested_followup' | 'campaign_tag' | 'inactivity_flag';
          enabled: boolean;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['automation_rules']['Row'], 'id' | 'created_at' | 'updated_at' | 'enabled' | 'config'> & {
          id?: string;
          enabled?: boolean;
          config?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['automation_rules']['Row']>;
      };
      automation_log: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string;
          rule_type: 'lead_stale_reminder' | 'interested_followup' | 'campaign_tag' | 'inactivity_flag';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['automation_log']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['automation_log']['Row']>;
      };
      user_guide_state: {
        Row: {
          user_id: string;
          guide_key: string;
          dismissed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_guide_state']['Row'], 'dismissed_at'> & {
          dismissed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_guide_state']['Row']>;
      };
      reminders: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          lead_id: string | null;
          task_id: string | null;
          campaign_id: string | null;
          reminder_type:
            | 'lead_followup'
            | 'call'
            | 'meeting'
            | 'task'
            | 'callback'
            | 'campaign'
            | 'sales_activity'
            | 'custom';
          title: string;
          description: string | null;
          scheduled_at: string;
          timezone: string;
          status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
          next_attempt_at: string;
          processed_at: string | null;
          sent_at: string | null;
          failed_at: string | null;
          retry_count: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['reminders']['Row'],
          | 'id' | 'created_at' | 'updated_at' | 'reminder_type' | 'timezone' | 'status'
          | 'next_attempt_at' | 'processed_at' | 'sent_at' | 'failed_at' | 'retry_count' | 'last_error'
          | 'lead_id' | 'task_id' | 'campaign_id' | 'description'
        > & {
          id?: string;
          reminder_type?: Database['public']['Tables']['reminders']['Row']['reminder_type'];
          timezone?: string;
          status?: Database['public']['Tables']['reminders']['Row']['status'];
          next_attempt_at?: string;
          lead_id?: string | null;
          task_id?: string | null;
          campaign_id?: string | null;
          description?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Row']>;
      };
      custom_field_definitions: {
        Row: {
          id: string;
          workspace_id: string;
          key: string;
          label: string;
          field_type: 'text' | 'number' | 'date' | 'select';
          options: string[];
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['custom_field_definitions']['Row'], 'id' | 'created_at' | 'field_type' | 'options' | 'display_order'> & {
          id?: string;
          field_type?: 'text' | 'number' | 'date' | 'select';
          options?: string[];
          display_order?: number;
        };
        Update: Partial<Database['public']['Tables']['custom_field_definitions']['Row']>;
      };
      lead_attachments: {
        Row: {
          id: string;
          lead_id: string;
          workspace_id: string;
          uploaded_by: string | null;
          file_path: string;
          file_name: string;
          file_size: number;
          content_type: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_attachments']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['lead_attachments']['Row']>;
      };
      error_log: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          message: string;
          stack: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['error_log']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['error_log']['Row']>;
      };
      push_delivery_log: {
        Row: {
          id: string;
          notification_id: string | null;
          subscription_id: string | null;
          success: boolean;
          status_code: number | null;
          error: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['push_delivery_log']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['push_delivery_log']['Row']>;
      };
    };
    Views: {
      campaign_stats: {
        Row: {
          campaign_id: string;
          workspace_id: string;
          leads_count: number;
          won_count: number;
          views_count: number;
        };
      };
      leads_daily_counts: {
        Row: {
          workspace_id: string;
          day: string;
          leads_count: number;
          won_count: number;
        };
      };
      page_views_daily_counts: {
        Row: {
          workspace_id: string;
          day: string;
          views_count: number;
        };
      };
      campaign_daily_leads_counts: {
        Row: {
          workspace_id: string;
          campaign_id: string;
          day: string;
          leads_count: number;
        };
      };
      order_stats: {
        Row: {
          workspace_id: string;
          total_orders: number;
          total_sales: number;
          revenue: number;
        };
      };
    };
    Functions: {
      submit_lead_from_landing_page: {
        Args: {
          p_landing_page_id: string;
          p_full_name: string;
          p_phone?: string | null;
          p_email?: string | null;
          p_utm_source?: string | null;
          p_utm_medium?: string | null;
          p_utm_campaign?: string | null;
          p_utm_content?: string | null;
          p_utm_term?: string | null;
        };
        Returns: string;
      };
      check_and_log_form_rate_limit: {
        Args: { p_landing_page_id: string; p_ip_hash: string };
        Returns: boolean;
      };
      get_public_pixel_id: {
        Args: { p_landing_page_id: string };
        Returns: string | null;
      };
      get_public_ga4_id: {
        Args: { p_landing_page_id: string };
        Returns: string | null;
      };
      get_public_workspace_plan: {
        Args: { p_landing_page_id: string };
        Returns: 'free' | 'starter' | 'growth' | 'pro' | null;
      };
      get_invitation_by_token: {
        Args: { p_token: string };
        Returns: { workspace_name: string; role: 'owner' | 'admin' | 'agent'; email: string; valid: boolean }[];
      };
      accept_workspace_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
      check_plan_expiry_notification: {
        Args: { p_workspace_id: string };
        Returns: undefined;
      };
      find_duplicate_lead: {
        Args: { p_workspace_id: string; p_phone: string | null; p_email: string | null };
        Returns: { id: string; full_name: string; status: string }[];
      };
      get_public_appointment_settings: {
        Args: { p_landing_page_id: string };
        Returns: {
          enabled: boolean;
          working_days: number[];
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          max_bookings_per_slot: number;
          holidays: string[];
        }[];
      };
      get_public_booked_slots: {
        Args: { p_landing_page_id: string; p_date: string };
        Returns: { start_time: string; taken_count: number }[];
      };
      book_appointment_slot: {
        Args: {
          p_landing_page_id: string;
          p_date: string;
          p_start_time: string;
          p_customer_name: string;
          p_phone: string | null;
          p_email: string | null;
        };
        Returns: string;
      };
      run_workspace_automations: {
        Args: { p_workspace_id: string };
        Returns: undefined;
      };
      process_due_reminders: {
        Args: { p_batch_size?: number };
        Returns: { reminder_id: string; outcome: string }[];
      };
      process_due_follow_ups: {
        Args: { p_batch_size?: number };
        Returns: { follow_up_id: string; outcome: string }[];
      };
      soft_delete_lead: {
        Args: { p_lead_id: string };
        Returns: undefined;
      };
      list_deleted_leads: {
        Args: { p_workspace_id: string };
        Returns: Database['public']['Tables']['leads']['Row'][];
      };
      restore_lead: {
        Args: { p_lead_id: string };
        Returns: undefined;
      };
      purge_lead: {
        Args: { p_lead_id: string };
        Returns: undefined;
      };
      merge_leads: {
        Args: { p_primary_lead_id: string; p_duplicate_lead_id: string };
        Returns: undefined;
      };
      find_duplicate_lead_pairs: {
        Args: { p_workspace_id: string };
        Returns: {
          primary_id: string;
          primary_name: string;
          duplicate_id: string;
          duplicate_name: string;
          matched_on: string;
        }[];
      };
    };
  };
}
