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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          grade: string | null
          id: string
          status: string
          student_id: string
          submitted_at: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          grade?: string | null
          id?: string
          status?: string
          student_id: string
          submitted_at?: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          grade?: string | null
          id?: string
          status?: string
          student_id?: string
          submitted_at?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          batch_id: string | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          external_link: string | null
          id: string
          instructor_id: string | null
          pdf_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          batch_id?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          external_link?: string | null
          id?: string
          instructor_id?: string | null
          pdf_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          batch_id?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          external_link?: string | null
          id?: string
          instructor_id?: string | null
          pdf_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_enrollments: {
        Row: {
          batch_id: string
          enrolled_at: string | null
          enrolled_by: string | null
          id: string
          student_id: string
        }
        Insert: {
          batch_id: string
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          student_id: string
        }
        Update: {
          batch_id?: string
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_code: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          is_manually_active: boolean
          max_students: number | null
          name: string
          program_id: string | null
          semester: number | null
          start_date: string | null
        }
        Insert: {
          batch_code?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          is_manually_active?: boolean
          max_students?: number | null
          name: string
          program_id?: string | null
          semester?: number | null
          start_date?: string | null
        }
        Update: {
          batch_code?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          is_manually_active?: boolean
          max_students?: number | null
          name?: string
          program_id?: string | null
          semester?: number | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          total_semesters: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          total_semesters?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          total_semesters?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          awarded_at: string
          certificate_url: string | null
          course_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          certificate_url?: string | null
          course_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          certificate_url?: string | null
          course_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_log_confirmations: {
        Row: {
          class_log_id: string
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_log_id: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_log_id?: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_log_confirmations_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      class_logs: {
        Row: {
          created_at: string
          curriculum_section_id: string | null
          date: string
          id: string
          instructor_id: string
          notes: string | null
          schedule_id: string | null
          status: string
          topic_covered: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_section_id?: string | null
          date?: string
          id?: string
          instructor_id: string
          notes?: string | null
          schedule_id?: string | null
          status?: string
          topic_covered: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_section_id?: string | null
          date?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          schedule_id?: string | null
          status?: string
          topic_covered?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_logs_curriculum_section_id_fkey"
            columns: ["curriculum_section_id"]
            isOneToOne: false
            referencedRelation: "curriculum_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reviews: {
        Row: {
          course_id: string
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          course_id: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          course_id?: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          used_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          content_text: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean
          lesson_type: string
          module_id: string
          pdf_url: string | null
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean
          lesson_type?: string
          module_id: string
          pdf_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_text?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean
          lesson_type?: string
          module_id?: string
          pdf_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          hours: number | null
          id: string
          sort_order: number
          teaching_outcomes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          hours?: number | null
          id?: string
          sort_order?: number
          teaching_outcomes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          hours?: number | null
          id?: string
          sort_order?: number
          teaching_outcomes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_outcomes: {
        Row: {
          co_number: number
          created_at: string
          curriculum_module_id: string
          description: string
          hours: number | null
          id: string
          rbt_levels: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          co_number: number
          created_at?: string
          curriculum_module_id: string
          description: string
          hours?: number | null
          id?: string
          rbt_levels?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          co_number?: number
          created_at?: string
          curriculum_module_id?: string
          description?: string
          hours?: number | null
          id?: string
          rbt_levels?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_outcomes_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          category: string | null
          category_id: string | null
          course_outcomes: string[] | null
          course_type: string | null
          created_at: string
          description: string | null
          discount_price: number | null
          duration: string | null
          id: string
          image_url: string | null
          instructor_id: string | null
          instructor_name: string | null
          level: string | null
          preview_video_url: string | null
          price: number
          program_id: string | null
          slug: string | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          category_id?: string | null
          course_outcomes?: string[] | null
          course_type?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          level?: string | null
          preview_video_url?: string | null
          price?: number
          program_id?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          category_id?: string | null
          course_outcomes?: string[] | null
          course_type?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          level?: string | null
          preview_video_url?: string | null
          price?: number
          program_id?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_modules: {
        Row: {
          assessment_cie_marks: number | null
          assessment_see_marks: number | null
          batch_id: string | null
          cie_exam_hours: string | null
          course_code: string
          course_objectives: string[] | null
          created_at: string
          created_by: string | null
          credits: number | null
          description: string | null
          exam_hours: string | null
          exam_type: string | null
          hours: number | null
          id: string
          instructor_id: string | null
          module_name: string
          pedagogy: string | null
          periods: number | null
          prerequisites: string | null
          program_id: string | null
          references_list: string[] | null
          see_exam_hours: string | null
          semester: number
          sort_order: number
          subject_name: string
          teaching_hours: number | null
          updated_at: string
        }
        Insert: {
          assessment_cie_marks?: number | null
          assessment_see_marks?: number | null
          batch_id?: string | null
          cie_exam_hours?: string | null
          course_code: string
          course_objectives?: string[] | null
          created_at?: string
          created_by?: string | null
          credits?: number | null
          description?: string | null
          exam_hours?: string | null
          exam_type?: string | null
          hours?: number | null
          id?: string
          instructor_id?: string | null
          module_name: string
          pedagogy?: string | null
          periods?: number | null
          prerequisites?: string | null
          program_id?: string | null
          references_list?: string[] | null
          see_exam_hours?: string | null
          semester: number
          sort_order?: number
          subject_name: string
          teaching_hours?: number | null
          updated_at?: string
        }
        Update: {
          assessment_cie_marks?: number | null
          assessment_see_marks?: number | null
          batch_id?: string | null
          cie_exam_hours?: string | null
          course_code?: string
          course_objectives?: string[] | null
          created_at?: string
          created_by?: string | null
          credits?: number | null
          description?: string | null
          exam_hours?: string | null
          exam_type?: string | null
          hours?: number | null
          id?: string
          instructor_id?: string | null
          module_name?: string
          pedagogy?: string | null
          periods?: number | null
          prerequisites?: string | null
          program_id?: string | null
          references_list?: string[] | null
          see_exam_hours?: string | null
          semester?: number
          sort_order?: number
          subject_name?: string
          teaching_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_modules_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_section_links: {
        Row: {
          created_at: string
          id: string
          label: string | null
          section_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          section_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          section_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_section_links_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "curriculum_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_sections: {
        Row: {
          audio_url: string | null
          co_mapping: string | null
          content_type: string
          created_at: string
          created_by: string | null
          hours_allocated: number | null
          id: string
          module_id: string
          pdf_url: string | null
          rbt_levels: string | null
          sort_order: number
          teaching_methodology: string | null
          text_content: string | null
          title: string
          topic_id: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          audio_url?: string | null
          co_mapping?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          hours_allocated?: number | null
          id?: string
          module_id: string
          pdf_url?: string | null
          rbt_levels?: string | null
          sort_order?: number
          teaching_methodology?: string | null
          text_content?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          audio_url?: string | null
          co_mapping?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          hours_allocated?: number | null
          id?: string
          module_id?: string
          pdf_url?: string | null
          rbt_levels?: string | null
          sort_order?: number
          teaching_methodology?: string | null
          text_content?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_sections_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_sections_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress: number
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          approval_status: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_internal: boolean
          location: string | null
          map_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_internal?: boolean
          location?: string | null
          map_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_internal?: boolean
          location?: string | null
          map_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          batch_id: string | null
          categories: Json | null
          category: string | null
          id: string
          instructor_id: string | null
          is_anonymous: boolean | null
          message: string
          rating: number | null
          read_by_admin: boolean
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          batch_id?: string | null
          categories?: Json | null
          category?: string | null
          id?: string
          instructor_id?: string | null
          is_anonymous?: boolean | null
          message: string
          rating?: number | null
          read_by_admin?: boolean
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          batch_id?: string | null
          categories?: Json | null
          category?: string | null
          id?: string
          instructor_id?: string | null
          is_anonymous?: boolean | null
          message?: string
          rating?: number | null
          read_by_admin?: boolean
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_responses: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          message: string
          responder_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          message: string
          responder_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          message?: string
          responder_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          experience_required: string | null
          id: string
          is_active: boolean
          location: string | null
          qualification: string | null
          requirements: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          experience_required?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          qualification?: string | null
          requirements?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          experience_required?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          qualification?: string | null
          requirements?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lesson_plan_entries: {
        Row: {
          actual_date: string | null
          co_mapping: string | null
          created_at: string
          curriculum_section_id: string | null
          faculty_remarks: string | null
          id: string
          lecture_number: number
          lesson_plan_id: string
          module_number: number | null
          rbt_level: string | null
          sort_order: number | null
          topic_title: string | null
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          co_mapping?: string | null
          created_at?: string
          curriculum_section_id?: string | null
          faculty_remarks?: string | null
          id?: string
          lecture_number: number
          lesson_plan_id: string
          module_number?: number | null
          rbt_level?: string | null
          sort_order?: number | null
          topic_title?: string | null
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          co_mapping?: string | null
          created_at?: string
          curriculum_section_id?: string | null
          faculty_remarks?: string | null
          id?: string
          lecture_number?: number
          lesson_plan_id?: string
          module_number?: number | null
          rbt_level?: string | null
          sort_order?: number | null
          topic_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_entries_curriculum_section_id_fkey"
            columns: ["curriculum_section_id"]
            isOneToOne: false
            referencedRelation: "curriculum_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_entries_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          academic_semester: string | null
          contact_hours_per_week: number | null
          content_delivery_methods: string | null
          created_at: string
          curriculum_module_id: string
          id: string
          instructor_id: string
          is_published: boolean | null
          section: string | null
          total_periods: number | null
          updated_at: string
        }
        Insert: {
          academic_semester?: string | null
          contact_hours_per_week?: number | null
          content_delivery_methods?: string | null
          created_at?: string
          curriculum_module_id: string
          id?: string
          instructor_id: string
          is_published?: boolean | null
          section?: string | null
          total_periods?: number | null
          updated_at?: string
        }
        Update: {
          academic_semester?: string | null
          contact_hours_per_week?: number | null
          content_delivery_methods?: string | null
          created_at?: string
          curriculum_module_id?: string
          id?: string
          instructor_id?: string
          is_published?: boolean | null
          section?: string | null
          total_periods?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          last_position_sec: number | null
          lesson_id: string
          progress_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          last_position_sec?: number | null
          lesson_id: string
          progress_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          last_position_sec?: number | null
          lesson_id?: string
          progress_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          audience_type: string | null
          batch_id: string | null
          class_type: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string
          meeting_link: string
          meeting_platform: string | null
          scheduled_at: string
          status: string | null
          title: string
        }
        Insert: {
          audience_type?: string | null
          batch_id?: string | null
          class_type?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id: string
          meeting_link: string
          meeting_platform?: string | null
          scheduled_at: string
          status?: string | null
          title: string
        }
        Update: {
          audience_type?: string | null
          batch_id?: string | null
          class_type?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string
          meeting_link?: string
          meeting_platform?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_classes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          coupon_id: string | null
          course_id: string
          created_at: string
          currency: string
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          coupon_id?: string | null
          course_id: string
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coupon_id?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          requested_changes: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          requested_changes: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          requested_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aadhar_number: string | null
          address: string | null
          admin_label: string | null
          avatar_url: string | null
          bio: string | null
          blood_group: string | null
          city: string | null
          course_name: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          designation: string | null
          display_name: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          enrollment_id: string | null
          family_notes: string | null
          father_email: string | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          gender: string | null
          id: string
          instructor_type: string | null
          is_verified: boolean
          kyc_document_number: string | null
          kyc_document_type: string | null
          kyc_document_url: string | null
          meet_link: string | null
          mother_email: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_phone: string | null
          pan_number: string | null
          passport_number: string | null
          phone: string | null
          pincode: string | null
          qualifications: string | null
          roll_number: string | null
          specialization: string | null
          state: string | null
          updated_at: string
          user_id: string
          year_of_commencement: number | null
          years_of_experience: number | null
          zoom_link: string | null
        }
        Insert: {
          aadhar_number?: string | null
          address?: string | null
          admin_label?: string | null
          avatar_url?: string | null
          bio?: string | null
          blood_group?: string | null
          city?: string | null
          course_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          enrollment_id?: string | null
          family_notes?: string | null
          father_email?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string | null
          id?: string
          instructor_type?: string | null
          is_verified?: boolean
          kyc_document_number?: string | null
          kyc_document_type?: string | null
          kyc_document_url?: string | null
          meet_link?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          pan_number?: string | null
          passport_number?: string | null
          phone?: string | null
          pincode?: string | null
          qualifications?: string | null
          roll_number?: string | null
          specialization?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          year_of_commencement?: number | null
          years_of_experience?: number | null
          zoom_link?: string | null
        }
        Update: {
          aadhar_number?: string | null
          address?: string | null
          admin_label?: string | null
          avatar_url?: string | null
          bio?: string | null
          blood_group?: string | null
          city?: string | null
          course_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          enrollment_id?: string | null
          family_notes?: string | null
          father_email?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string | null
          id?: string
          instructor_type?: string | null
          is_verified?: boolean
          kyc_document_number?: string | null
          kyc_document_type?: string | null
          kyc_document_url?: string | null
          meet_link?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          pan_number?: string | null
          passport_number?: string | null
          phone?: string | null
          pincode?: string | null
          qualifications?: string | null
          roll_number?: string | null
          specialization?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          year_of_commencement?: number | null
          years_of_experience?: number | null
          zoom_link?: string | null
        }
        Relationships: []
      }
      program_inquiries: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          program_name: string
          program_slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          program_name: string
          program_slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          program_name?: string
          program_slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          batch_id: string | null
          course_id: string | null
          created_at: string
          curriculum_module_id: string | null
          end_time: string
          event_title: string
          event_type: string
          id: string
          instructor_id: string | null
          location: string | null
          paper_code: string | null
          recurrence_type: string | null
          schedule_type: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          curriculum_module_id?: string | null
          end_time: string
          event_title: string
          event_type?: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          paper_code?: string | null
          recurrence_type?: string | null
          schedule_type?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          curriculum_module_id?: string | null
          end_time?: string
          event_title?: string
          event_type?: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          paper_code?: string | null
          recurrence_type?: string | null
          schedule_type?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          batch_id: string
          cie_marks: number | null
          created_at: string
          curriculum_module_id: string
          id: string
          remarks: string | null
          see_marks: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          cie_marks?: number | null
          created_at?: string
          curriculum_module_id: string
          id?: string
          remarks?: string | null
          see_marks?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          cie_marks?: number | null
          created_at?: string
          curriculum_module_id?: string
          id?: string
          remarks?: string | null
          see_marks?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      student_projects: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          student_id: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          student_id: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          student_id?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subject_allocations: {
        Row: {
          academic_year: string
          created_at: string
          curriculum_module_id: string
          id: string
          instructor_id: string
          semester: number
        }
        Insert: {
          academic_year: string
          created_at?: string
          curriculum_module_id: string
          id?: string
          instructor_id: string
          semester: number
        }
        Update: {
          academic_year?: string
          created_at?: string
          curriculum_module_id?: string
          id?: string
          instructor_id?: string
          semester?: number
        }
        Relationships: [
          {
            foreignKeyName: "subject_allocations_curriculum_module_id_fkey"
            columns: ["curriculum_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          area_of_interest: string | null
          availability: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area_of_interest?: string | null
          availability?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area_of_interest?: string | null
          availability?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_or_admin: { Args: { _user_id: string }; Returns: boolean }
      validate_coupon: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          id: string
          valid_until: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student" | "instructor" | "super_admin"
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
      app_role: ["admin", "student", "instructor", "super_admin"],
    },
  },
} as const
