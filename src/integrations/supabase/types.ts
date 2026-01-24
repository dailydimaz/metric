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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_aggregation_watermark: {
        Row: {
          last_aggregated_at: string
          site_id: string
          updated_at: string
        }
        Insert: {
          last_aggregated_at?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          last_aggregated_at?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_aggregation_watermark_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_devices_hourly: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          hour_timestamp: string
          id: string
          os: string | null
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          hour_timestamp: string
          id?: string
          os?: string | null
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          hour_timestamp?: string
          id?: string
          os?: string | null
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_devices_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_geo_hourly: {
        Row: {
          city: string | null
          country: string
          created_at: string
          hour_timestamp: string
          id: string
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string
          hour_timestamp: string
          id?: string
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          hour_timestamp?: string
          id?: string
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_geo_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_hourly: {
        Row: {
          bounces: number
          created_at: string
          hour_timestamp: string
          id: string
          pageviews: number
          sessions: number
          site_id: string
          total_session_duration: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          bounces?: number
          created_at?: string
          hour_timestamp: string
          id?: string
          pageviews?: number
          sessions?: number
          site_id: string
          total_session_duration?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          bounces?: number
          created_at?: string
          hour_timestamp?: string
          id?: string
          pageviews?: number
          sessions?: number
          site_id?: string
          total_session_duration?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_languages_hourly: {
        Row: {
          created_at: string
          hour_timestamp: string
          id: string
          language: string
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          created_at?: string
          hour_timestamp: string
          id?: string
          language: string
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          created_at?: string
          hour_timestamp?: string
          id?: string
          language?: string
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_languages_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_pages_hourly: {
        Row: {
          created_at: string
          hour_timestamp: string
          id: string
          pageviews: number
          site_id: string
          unique_visitors: number
          url: string
        }
        Insert: {
          created_at?: string
          hour_timestamp: string
          id?: string
          pageviews?: number
          site_id: string
          unique_visitors?: number
          url: string
        }
        Update: {
          created_at?: string
          hour_timestamp?: string
          id?: string
          pageviews?: number
          site_id?: string
          unique_visitors?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_pages_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_referrers_hourly: {
        Row: {
          created_at: string
          hour_timestamp: string
          id: string
          referrer: string
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          created_at?: string
          hour_timestamp: string
          id?: string
          referrer: string
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          created_at?: string
          hour_timestamp?: string
          id?: string
          referrer?: string
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_referrers_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_dashboards: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          layout: Json
          name: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout?: Json
          name: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout?: Json
          name?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      events_default: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_partitioned: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m01: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m02: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m03: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m04: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m05: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m06: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m07: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m08: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m09: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m10: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m11: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m12: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m01: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m02: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m03: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m04: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m05: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m06: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      funnels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          site_id: string
          steps: Json
          time_window_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          site_id: string
          steps?: Json
          time_window_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          site_id?: string
          steps?: Json
          time_window_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      geoip_blocks: {
        Row: {
          geoname_id: number | null
          network: unknown
        }
        Insert: {
          geoname_id?: number | null
          network: unknown
        }
        Update: {
          geoname_id?: number | null
          network?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "geoip_blocks_geoname_id_fkey"
            columns: ["geoname_id"]
            isOneToOne: false
            referencedRelation: "geoip_locations"
            referencedColumns: ["geoname_id"]
          },
        ]
      }
      geoip_locations: {
        Row: {
          city_name: string | null
          country_code: string
          country_name: string | null
          geoname_id: number
        }
        Insert: {
          city_name?: string | null
          country_code: string
          country_name?: string | null
          geoname_id: number
        }
        Update: {
          city_name?: string | null
          country_code?: string
          country_name?: string | null
          geoname_id?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          event_name: string
          id: string
          match_type: string
          name: string
          site_id: string
          updated_at: string
          url_match: string | null
        }
        Insert: {
          created_at?: string
          event_name?: string
          id?: string
          match_type?: string
          name: string
          site_id: string
          updated_at?: string
          url_match?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          match_type?: string
          name?: string
          site_id?: string
          updated_at?: string
          url_match?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_stats: {
        Row: {
          clicks: number
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number
          keyword: string
          position: number | null
          site_id: string
          url: string | null
        }
        Insert: {
          clicks?: number
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number
          keyword: string
          position?: number | null
          site_id: string
          url?: string | null
        }
        Update: {
          clicks?: number
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number
          keyword?: string
          position?: number | null
          site_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_stats_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_records: number | null
          file_name: string
          file_size: number
          id: string
          processed_records: number | null
          site_id: string
          started_at: string | null
          status: string
          total_records: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_records?: number | null
          file_name: string
          file_size?: number
          id?: string
          processed_records?: number | null
          site_id: string
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_records?: number | null
          file_name?: string
          file_size?: number
          id?: string
          processed_records?: number | null
          site_id?: string
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          created_at: string
          date_range: Json
          description: string | null
          filters: Json
          id: string
          is_public: boolean
          name: string
          share_token: string | null
          site_id: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          date_range?: Json
          description?: string | null
          filters?: Json
          id?: string
          is_public?: boolean
          name: string
          share_token?: string | null
          site_id: string
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          date_range?: Json
          description?: string | null
          filters?: Json
          id?: string
          is_public?: boolean
          name?: string
          share_token?: string | null
          site_id?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "insights_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          metadata: Json | null
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          original_url: string
          site_id: string
          slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          original_url: string
          site_id: string
          slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          original_url?: string
          site_id?: string
          slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          marketing_emails: boolean | null
          updated_at: string
          weekly_digest: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          marketing_emails?: boolean | null
          updated_at?: string
          weekly_digest?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          marketing_emails?: boolean | null
          updated_at?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      public_dashboard_attempts: {
        Row: {
          attempts: number | null
          created_at: string
          id: string
          last_attempt: string | null
          locked_until: string | null
          share_token: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
          share_token: string
        }
        Update: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
          share_token?: string
        }
        Relationships: []
      }
      public_dashboards: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          password_hash: string | null
          share_token: string
          show_devices: boolean
          show_geo: boolean
          show_pageviews: boolean
          show_referrers: boolean
          show_top_pages: boolean
          show_visitors: boolean
          site_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          password_hash?: string | null
          share_token?: string
          show_devices?: boolean
          show_geo?: boolean
          show_pageviews?: boolean
          show_referrers?: boolean
          show_top_pages?: boolean
          show_visitors?: boolean
          site_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          password_hash?: string | null
          share_token?: string
          show_devices?: boolean
          show_geo?: boolean
          show_pageviews?: boolean
          show_referrers?: boolean
          show_top_pages?: boolean
          show_visitors?: boolean
          site_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_dashboards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          created_at: string
          description: string | null
          filters: Json
          id: string
          is_default: boolean
          name: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          discount_codes: Json | null
          id: string
          line_items: Json | null
          order_created_at: string | null
          order_number: string | null
          shipping_total: number | null
          shopify_order_id: string
          site_id: string
          status: string
          tax_total: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          discount_codes?: Json | null
          id?: string
          line_items?: Json | null
          order_created_at?: string | null
          order_number?: string | null
          shipping_total?: number | null
          shopify_order_id: string
          site_id: string
          status?: string
          tax_total?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          discount_codes?: Json | null
          id?: string
          line_items?: Json | null
          order_created_at?: string | null
          order_number?: string | null
          shipping_total?: number | null
          shopify_order_id?: string
          site_id?: string
          status?: string
          tax_total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
          timezone: string | null
          tracking_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          timezone?: string | null
          tracking_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          timezone?: string | null
          tracking_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slack_integrations: {
        Row: {
          channel_name: string | null
          created_at: string
          id: string
          is_active: boolean
          notify_on: Json
          site_id: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_on?: Json
          site_id: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_on?: Json
          site_id?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          site_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: string
          site_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          site_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string
          events_count: number
          id: string
          month: string
          sites_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events_count?: number
          id?: string
          month: string
          sites_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          events_count?: number
          id?: string
          month?: string
          sites_count?: number
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
      aggregate_analytics_data:
        | { Args: never; Returns: undefined }
        | {
            Args: { _batch_size?: number }
            Returns: {
              events_processed: number
              hours_aggregated: number
              sites_processed: number
            }[]
          }
      create_future_partitions: { Args: never; Returns: undefined }
      get_attribution_stats: {
        Args: {
          _attribution_model?: string
          _end_date: string
          _goal_event?: string
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_city_stats:
        | {
            Args: {
              _end_date: string
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              city: string
              country: string
              percentage: number
              visits: number
            }[]
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              city: string
              country: string
              percentage: number
              visits: number
            }[]
          }
      get_device_stats:
        | {
            Args: { _end_date: string; _site_id: string; _start_date: string }
            Returns: Json
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _site_id: string
              _start_date: string
            }
            Returns: Json
          }
      get_funnel_stats: {
        Args: { _end_date: string; _funnel_id: string; _start_date: string }
        Returns: {
          conversion_rate: number
          drop_off_rate: number
          step_index: number
          step_name: string
          visitors: number
        }[]
      }
      get_geo_stats:
        | {
            Args: {
              _end_date: string
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              country: string
              percentage: number
              visits: number
            }[]
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              country: string
              percentage: number
              visits: number
            }[]
          }
      get_goal_stats: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: {
          average_order_value: number
          conversion_rate: number
          conversions: number
          event_name: string
          goal_id: string
          goal_name: string
          match_type: string
          revenue_property: string
          target_value: number
          total_revenue: number
          total_visitors: number
          url_match: string
        }[]
      }
      get_language_stats:
        | {
            Args: {
              _end_date: string
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              language: string
              percentage: number
              visits: number
            }[]
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              language: string
              percentage: number
              visits: number
            }[]
          }
      get_public_dashboard_stats:
        | {
            Args: {
              _end_date: string
              _password?: string
              _share_token: string
              _start_date: string
            }
            Returns: Json
          }
        | {
            Args: {
              _end_date: string
              _share_token: string
              _start_date: string
            }
            Returns: Json
          }
        | {
            Args: {
              _end_date: string
              _password?: string
              _share_token: string
              _start_date: string
            }
            Returns: Json
          }
      get_retention_cohorts: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: Json
      }
      get_retention_trend: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: {
          day: number
          rate: number
          retained: number
        }[]
      }
      get_shared_insight: {
        Args: { _share_token: string }
        Returns: {
          date_range: Json
          description: string
          filters: Json
          id: string
          name: string
          site_id: string
          widgets: Json
        }[]
      }
      get_site_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _prev_end_date: string
          _prev_start_date: string
          _site_id: string
          _start_date: string
        }
        Returns: {
          avg_session_duration: number
          bounce_rate: number
          pageviews_change: number
          total_pageviews: number
          unique_visitors: number
          visitors_change: number
        }[]
      }
      get_team_member_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_timeseries_stats:
        | {
            Args: {
              _end_date: string
              _prev_end_date: string
              _prev_start_date: string
              _site_id: string
              _start_date: string
            }
            Returns: {
              date: string
              pageviews: number
              prev_pageviews: number
              prev_visitors: number
              visitors: number
            }[]
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _prev_end_date: string
              _prev_start_date: string
              _site_id: string
              _start_date: string
            }
            Returns: {
              date: string
              pageviews: number
              prev_pageviews: number
              prev_visitors: number
              visitors: number
            }[]
          }
      get_top_pages:
        | {
            Args: {
              _end_date: string
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              pageviews: number
              unique_visitors: number
              url: string
            }[]
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              pageviews: number
              unique_visitors: number
              url: string
            }[]
          }
      get_top_referrers:
        | {
            Args: {
              _end_date: string
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              percentage: number
              referrer: string
              visits: number
            }[]
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: {
              percentage: number
              referrer: string
              visits: number
            }[]
          }
      get_user_journeys: {
        Args: {
          _end_date: string
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_utm_stats:
        | {
            Args: {
              _end_date: string
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: Json
          }
        | {
            Args: {
              _end_date: string
              _filters?: Json
              _limit?: number
              _site_id: string
              _start_date: string
            }
            Returns: Json
          }
      has_team_role: {
        Args: { _min_role: string; _site_id: string }
        Returns: boolean
      }
      hash_password: { Args: { _password: string }; Returns: string }
      is_site_owner: { Args: { _site_id: string }; Returns: boolean }
      is_team_member_of_same_site: {
        Args: { _profile_user_id: string }
        Returns: boolean
      }
      lookup_geoip: {
        Args: { ip_address: string }
        Returns: {
          city: string
          country: string
        }[]
      }
    }
    Enums: {
      integration_provider:
        | "google_analytics"
        | "shopify"
        | "google_search_console"
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
      integration_provider: [
        "google_analytics",
        "shopify",
        "google_search_console",
      ],
    },
  },
} as const
