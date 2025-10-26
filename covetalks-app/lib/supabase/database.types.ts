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
      members: {
        Row: {
          id: string
          email: string
          name: string | null
          member_type: 'Speaker' | 'Organization' | null
          bio: string | null
          location: string | null
          phone: string | null
          website: string | null
          specialties: string[] | null
          profile_image_url: string | null
          average_rating: number | null
          total_reviews: number
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          member_type?: 'Speaker' | 'Organization' | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          specialties?: string[] | null
          profile_image_url?: string | null
          average_rating?: number | null
          total_reviews?: number
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          member_type?: 'Speaker' | 'Organization' | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          specialties?: string[] | null
          profile_image_url?: string | null
          average_rating?: number | null
          total_reviews?: number
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          organization_type: string | null
          website: string | null
          description: string | null
          location: string | null
          logo_url: string | null
          preferred_topics: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          organization_type?: string | null
          website?: string | null
          description?: string | null
          location?: string | null
          logo_url?: string | null
          preferred_topics?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          organization_type?: string | null
          website?: string | null
          description?: string | null
          location?: string | null
          logo_url?: string | null
          preferred_topics?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          member_id: string
          role: 'Owner' | 'Admin' | 'Member'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          member_id: string
          role?: 'Owner' | 'Admin' | 'Member'
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          member_id?: string
          role?: 'Owner' | 'Admin' | 'Member'
          created_at?: string
        }
      }
      speaking_opportunities: {
        Row: {
          id: string
          posted_by: string
          organization_id: string | null
          title: string
          description: string | null
          event_date: string | null
          event_format: 'In-Person' | 'Virtual' | 'Hybrid' | null
          location: string | null
          audience_size: number | null
          audience_type: string | null
          duration: number | null
          compensation_amount: number | null
          travel_covered: boolean
          accommodation_covered: boolean
          additional_benefits: string | null
          topics: string[] | null
          requirements: string | null
          experience_level: string | null
          application_deadline: string | null
          status: 'Open' | 'Closed' | 'Filled' | 'Draft'
          application_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          posted_by: string
          organization_id?: string | null
          title: string
          description?: string | null
          event_date?: string | null
          event_format?: 'In-Person' | 'Virtual' | 'Hybrid' | null
          location?: string | null
          audience_size?: number | null
          audience_type?: string | null
          duration?: number | null
          compensation_amount?: number | null
          travel_covered?: boolean
          accommodation_covered?: boolean
          additional_benefits?: string | null
          topics?: string[] | null
          requirements?: string | null
          experience_level?: string | null
          application_deadline?: string | null
          status?: 'Open' | 'Closed' | 'Filled' | 'Draft'
          application_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          posted_by?: string
          organization_id?: string | null
          title?: string
          description?: string | null
          event_date?: string | null
          event_format?: 'In-Person' | 'Virtual' | 'Hybrid' | null
          location?: string | null
          audience_size?: number | null
          audience_type?: string | null
          duration?: number | null
          compensation_amount?: number | null
          travel_covered?: boolean
          accommodation_covered?: boolean
          additional_benefits?: string | null
          topics?: string[] | null
          requirements?: string | null
          experience_level?: string | null
          application_deadline?: string | null
          status?: 'Open' | 'Closed' | 'Filled' | 'Draft'
          application_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          opportunity_id: string
          speaker_id: string
          cover_letter: string | null
          requested_fee: number | null
          status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'
          reviewed_by: string | null
          reviewed_at: string | null
          review_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          speaker_id: string
          cover_letter?: string | null
          requested_fee?: number | null
          status?: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          speaker_id?: string
          cover_letter?: string | null
          requested_fee?: number | null
          status?: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string
          message: string
          opportunity_id: string | null
          status: 'unread' | 'read' | 'archived'
          read_at: string | null
          created_at: string
          updated_at: string
          parent_message_id: string | null
          thread_id: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          subject: string
          message: string
          opportunity_id?: string | null
          status?: 'unread' | 'read' | 'archived'
          read_at?: string | null
          created_at?: string
          updated_at?: string
          parent_message_id?: string | null
          thread_id?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string
          message?: string
          opportunity_id?: string | null
          status?: 'unread' | 'read' | 'archived'
          read_at?: string | null
          created_at?: string
          updated_at?: string
          parent_message_id?: string | null
          thread_id?: string | null
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
