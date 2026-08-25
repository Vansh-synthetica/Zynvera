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
      institutions: {
        Row: {
          id: string
          name: string
          short_name: string
          type: string
          city: string
          country: string
          students: number
          teachers: number
          campuses: number
          programmes: number
          approved: boolean
          status: string
          focus: string | null
          logo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          type: string
          city: string
          country: string
          students?: number
          teachers?: number
          campuses?: number
          programmes?: number
          approved?: boolean
          status?: string
          focus?: string | null
          logo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          type?: string
          city?: string
          country?: string
          students?: number
          teachers?: number
          campuses?: number
          programmes?: number
          approved?: boolean
          status?: string
          focus?: string | null
          logo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campuses: {
        Row: {
          id: string
          institution_id: string
          name: string
          address: string
          city: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          address: string
          city: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          address?: string
          city?: string
          created_at?: string
        }
      }
      academic_terms: {
        Row: {
          id: string
          institution_id: string
          name: string
          start_date: string
          end_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          start_date: string
          end_date: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
        }
      }
      programmes: {
        Row: {
          id: string
          institution_id: string
          name: string
          department: string
          level: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          department: string
          level: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          department?: string
          level?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          avatar: string | null
          role: string
          institution_id: string | null
          department: string | null
          phone: string | null
          bio: string | null
          join_date: string
          family_code: string | null
          verification_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar?: string | null
          role: string
          institution_id?: string | null
          department?: string | null
          phone?: string | null
          bio?: string | null
          join_date?: string
          family_code?: string | null
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar?: string | null
          role?: string
          institution_id?: string | null
          department?: string | null
          phone?: string | null
          bio?: string | null
          join_date?: string
          family_code?: string | null
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          institution_id: string
          term_id: string
          programme_id: string | null
          teacher_id: string
          code: string
          title: string
          description: string | null
          status: string
          color: string
          max_students: number
          enrolled_students: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          term_id: string
          programme_id?: string | null
          teacher_id: string
          code: string
          title: string
          description?: string | null
          status?: string
          color?: string
          max_students?: number
          enrolled_students?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          term_id?: string
          programme_id?: string | null
          teacher_id?: string
          code?: string
          title?: string
          description?: string | null
          status?: string
          color?: string
          max_students?: number
          enrolled_students?: number
          created_at?: string
          updated_at?: string
        }
      }
      course_enrolments: {
        Row: {
          id: string
          course_id: string
          user_id: string
          enrolled_at: string
          status: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          enrolled_at?: string
          status?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          enrolled_at?: string
          status?: string
        }
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          order_index: number
          completed: boolean
          locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order_index?: number
          completed?: boolean
          locked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order_index?: number
          completed?: boolean
          locked?: boolean
          created_at?: string
        }
      }
      course_lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          type: string
          duration: string | null
          order_index: number
          completed: boolean
          locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          type: string
          duration?: string | null
          order_index?: number
          completed?: boolean
          locked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          type?: string
          duration?: string | null
          order_index?: number
          completed?: boolean
          locked?: boolean
          created_at?: string
        }
      }
      course_resources: {
        Row: {
          id: string
          course_id: string
          title: string
          type: string
          url: string
          size: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          type: string
          url: string
          size?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          type?: string
          url?: string
          size?: string | null
          uploaded_at?: string
        }
      }
      syllabus_items: {
        Row: {
          id: string
          course_id: string
          week: number
          topic: string
          activities: Json
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          week: number
          topic: string
          activities?: Json
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          week?: number
          topic?: string
          activities?: Json
          created_at?: string
        }
      }
      grade_weights: {
        Row: {
          id: string
          course_id: string
          category: string
          weight: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          category: string
          weight: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          category?: string
          weight?: number
          created_at?: string
        }
      }
      class_sections: {
        Row: {
          id: string
          course_id: string
          name: string
          room: string | null
          day: string | null
          start_time: string | null
          end_time: string | null
          meeting_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          room?: string | null
          day?: string | null
          start_time?: string | null
          end_time?: string | null
          meeting_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          room?: string | null
          day?: string | null
          start_time?: string | null
          end_time?: string | null
          meeting_url?: string | null
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          instructions: string | null
          due_date: string | null
          published_at: string | null
          status: string
          max_score: number
          submission_type: string
          late_policy: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          instructions?: string | null
          due_date?: string | null
          published_at?: string | null
          status?: string
          max_score?: number
          submission_type?: string
          late_policy?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          instructions?: string | null
          due_date?: string | null
          published_at?: string | null
          status?: string
          max_score?: number
          submission_type?: string
          late_policy?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignment_attachments: {
        Row: {
          id: string
          assignment_id: string
          name: string
          type: string
          size: string | null
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          name: string
          type: string
          size?: string | null
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          name?: string
          type?: string
          size?: string | null
          url?: string
          created_at?: string
        }
      }
      rubric_items: {
        Row: {
          id: string
          assignment_id: string
          criterion: string
          description: string | null
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          criterion: string
          description?: string | null
          max_score: number
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          criterion?: string
          description?: string | null
          max_score?: number
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          status: string
          score: number | null
          feedback: string | null
          content: string | null
          submitted_at: string | null
          graded_at: string | null
          graded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          status?: string
          score?: number | null
          feedback?: string | null
          content?: string | null
          submitted_at?: string | null
          graded_at?: string | null
          graded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          status?: string
          score?: number | null
          feedback?: string | null
          content?: string | null
          submitted_at?: string | null
          graded_at?: string | null
          graded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submission_history: {
        Row: {
          id: string
          submission_id: string
          status: string
          score: number | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          status: string
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          status?: string
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          course_id: string
          title: string
          type: string
          description: string | null
          start_date: string | null
          end_date: string | null
          duration: number | null
          max_score: number
          max_attempts: number
          status: string
          instructions: string | null
          allowed_resources: Json
          shuffle_questions: boolean
          show_answers: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          type: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          duration?: number | null
          max_score?: number
          max_attempts?: number
          status?: string
          instructions?: string | null
          allowed_resources?: Json
          shuffle_questions?: boolean
          show_answers?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          type?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          duration?: number | null
          max_score?: number
          max_attempts?: number
          status?: string
          instructions?: string | null
          allowed_resources?: Json
          shuffle_questions?: boolean
          show_answers?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assessment_questions: {
        Row: {
          id: string
          assessment_id: string
          type: string
          text: string
          options: Json
          correct_answer: string | null
          points: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          type: string
          text: string
          options?: Json
          correct_answer?: string | null
          points?: number
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          type?: string
          text?: string
          options?: Json
          correct_answer?: string | null
          points?: number
          order_index?: number
          created_at?: string
        }
      }
      assessment_submissions: {
        Row: {
          id: string
          assessment_id: string
          user_id: string
          answers: Json
          score: number | null
          started_at: string
          submitted_at: string | null
          attempt_number: number
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          user_id: string
          answers?: Json
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          attempt_number?: number
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          user_id?: string
          answers?: Json
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          attempt_number?: number
          created_at?: string
        }
      }
      grade_entries: {
        Row: {
          id: string
          course_id: string
          user_id: string
          assessment_name: string
          assessment_type: string | null
          score: number
          max_score: number
          weight: number
          category: string | null
          date: string
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          assessment_name: string
          assessment_type?: string | null
          score: number
          max_score: number
          weight?: number
          category?: string | null
          date?: string
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          assessment_name?: string
          assessment_type?: string | null
          score?: number
          max_score?: number
          weight?: number
          category?: string | null
          date?: string
          feedback?: string | null
          created_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          class_section_id: string
          user_id: string
          date: string
          status: string
          time_in: string | null
          time_out: string | null
          note: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          class_section_id: string
          user_id: string
          date: string
          status: string
          time_in?: string | null
          time_out?: string | null
          note?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          class_section_id?: string
          user_id?: string
          date?: string
          status?: string
          time_in?: string | null
          time_out?: string | null
          note?: string | null
          recorded_by?: string | null
          created_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          institution_id: string | null
          course_id: string | null
          user_id: string | null
          title: string
          description: string | null
          type: string
          date: string
          start_time: string | null
          end_time: string | null
          location: string | null
          meeting_url: string | null
          is_all_day: boolean
          recurring: boolean
          recurring_pattern: string | null
          reminder: boolean
          reminder_minutes: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          course_id?: string | null
          user_id?: string | null
          title: string
          description?: string | null
          type: string
          date: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          meeting_url?: string | null
          is_all_day?: boolean
          recurring?: boolean
          recurring_pattern?: string | null
          reminder?: boolean
          reminder_minutes?: number
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string | null
          course_id?: string | null
          user_id?: string | null
          title?: string
          description?: string | null
          type?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          meeting_url?: string | null
          is_all_day?: boolean
          recurring?: boolean
          recurring_pattern?: string | null
          reminder?: boolean
          reminder_minutes?: number
          color?: string
          created_at?: string
        }
      }
      timetable_slots: {
        Row: {
          id: string
          course_id: string
          class_section_id: string | null
          user_id: string
          day: string
          start_time: string
          end_time: string
          room: string | null
          type: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          class_section_id?: string | null
          user_id: string
          day: string
          start_time: string
          end_time: string
          room?: string | null
          type?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          class_section_id?: string | null
          user_id?: string
          day?: string
          start_time?: string
          end_time?: string
          room?: string | null
          type?: string
          color?: string
          created_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          course_id: string | null
          host_id: string
          title: string
          description: string | null
          platform: string
          meeting_url: string | null
          scheduled_at: string
          duration: number
          status: string
          recording_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          host_id: string
          title: string
          description?: string | null
          platform: string
          meeting_url?: string | null
          scheduled_at: string
          duration?: number
          status?: string
          recording_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          host_id?: string
          title?: string
          description?: string | null
          platform?: string
          meeting_url?: string | null
          scheduled_at?: string
          duration?: number
          status?: string
          recording_available?: boolean
          created_at?: string
        }
      }
      meeting_attendees: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          status: string
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          status?: string
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          status?: string
          joined_at?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          institution_id: string | null
          course_id: string | null
          author_id: string
          title: string
          content: string
          priority: string
          pinned: boolean
          published_at: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          course_id?: string | null
          author_id: string
          title: string
          content: string
          priority?: string
          pinned?: boolean
          published_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string | null
          course_id?: string | null
          author_id?: string
          title?: string
          content?: string
          priority?: string
          pinned?: boolean
          published_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          course_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          course_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          course_id?: string | null
          created_at?: string
        }
      }
      discussions: {
        Row: {
          id: string
          course_id: string
          author_id: string
          title: string
          content: string
          pinned: boolean
          locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          author_id: string
          title: string
          content: string
          pinned?: boolean
          locked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          author_id?: string
          title?: string
          content?: string
          pinned?: boolean
          locked?: boolean
          created_at?: string
        }
      }
      discussion_replies: {
        Row: {
          id: string
          discussion_id: string
          author_id: string
          content: string
          likes: number
          created_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          author_id: string
          content: string
          likes?: number
          created_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          author_id?: string
          content?: string
          likes?: number
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          category: string
          read: boolean
          action_url: string | null
          source: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          category: string
          read?: boolean
          action_url?: string | null
          source?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          category?: string
          read?: boolean
          action_url?: string | null
          source?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      verification_requests: {
        Row: {
          id: string
          user_id: string
          role: string
          institution_id: string
          status: string
          documents: Json
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          institution_id: string
          status?: string
          documents?: Json
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          institution_id?: string
          status?: string
          documents?: Json
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
      }
      institution_requests: {
        Row: {
          id: string
          institution_name: string
          institution_type: string
          contact_name: string
          contact_email: string
          contact_phone: string | null
          city: string
          country: string
          website: string | null
          estimated_students: number | null
          message: string | null
          status: string
          submitted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_name: string
          institution_type: string
          contact_name: string
          contact_email: string
          contact_phone?: string | null
          city: string
          country: string
          website?: string | null
          estimated_students?: number | null
          message?: string | null
          status?: string
          submitted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_name?: string
          institution_type?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string | null
          city?: string
          country?: string
          website?: string | null
          estimated_students?: number | null
          message?: string | null
          status?: string
          submitted_at?: string
          created_at?: string
        }
      }
      rubrics: {
        Row: {
          id: string
          course_id: string | null
          title: string
          description: string | null
          points_possible: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          title: string
          description?: string | null
          points_possible?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          title?: string
          description?: string | null
          points_possible?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rubric_criteria: {
        Row: {
          id: string
          rubric_id: string
          description: string
          long_description: string | null
          points: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          rubric_id: string
          description: string
          long_description?: string | null
          points?: number
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          rubric_id?: string
          description?: string
          long_description?: string | null
          points?: number
          order_index?: number
          created_at?: string
        }
      }
      rubric_ratings: {
        Row: {
          id: string
          criterion_id: string
          label: string
          description: string | null
          points: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          criterion_id: string
          label: string
          description?: string | null
          points?: number
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          criterion_id?: string
          label?: string
          description?: string | null
          points?: number
          order_index?: number
          created_at?: string
        }
      }
      rubric_assessments: {
        Row: {
          id: string
          rubric_id: string
          submission_id: string | null
          user_id: string
          assessor_id: string
          total_score: number
          comments: string | null
          assessed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          rubric_id: string
          submission_id?: string | null
          user_id: string
          assessor_id: string
          total_score?: number
          comments?: string | null
          assessed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          rubric_id?: string
          submission_id?: string | null
          user_id?: string
          assessor_id?: string
          total_score?: number
          comments?: string | null
          assessed_at?: string
          created_at?: string
        }
      }
      rubric_assessment_ratings: {
        Row: {
          id: string
          assessment_id: string
          criterion_id: string
          rating_id: string | null
          points: number | null
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          criterion_id: string
          rating_id?: string | null
          points?: number | null
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          criterion_id?: string
          rating_id?: string | null
          points?: number | null
          comments?: string | null
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          institution_id: string
          name: string
          code: string | null
          head_id: string | null
          budget: number | null
          description: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          code?: string | null
          head_id?: string | null
          budget?: number | null
          description?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          code?: string | null
          head_id?: string | null
          budget?: number | null
          description?: string | null
          status?: string
          created_at?: string
        }
      }
      finance_transactions: {
        Row: {
          id: string
          institution_id: string
          type: string
          category: string
          amount: number
          description: string | null
          tx_date: string
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          type: string
          category: string
          amount: number
          description?: string | null
          tx_date?: string
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          type?: string
          category?: string
          amount?: number
          description?: string | null
          tx_date?: string
          recorded_by?: string | null
          created_at?: string
        }
      }
      finance_budgets: {
        Row: {
          id: string
          institution_id: string
          category: string
          fiscal_year: string
          budgeted_amount: number
        }
        Insert: {
          id?: string
          institution_id: string
          category: string
          fiscal_year: string
          budgeted_amount: number
        }
        Update: {
          id?: string
          institution_id?: string
          category?: string
          fiscal_year?: string
          budgeted_amount?: number
        }
      }
      institution_alerts: {
        Row: {
          id: string
          institution_id: string
          severity: string
          title: string
          message: string
          source: string | null
          status: string
          created_by: string | null
          acknowledged_at: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          severity?: string
          title: string
          message: string
          source?: string | null
          status?: string
          created_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          severity?: string
          title?: string
          message?: string
          source?: string | null
          status?: string
          created_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      parent_links: {
        Row: {
          id: string
          institution_id: string
          parent_user_id: string
          student_user_id: string
          relationship: string
          status: string
          requested_at: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          parent_user_id: string
          student_user_id: string
          relationship?: string
          status?: string
          requested_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          parent_user_id?: string
          student_user_id?: string
          relationship?: string
          status?: string
          requested_at?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
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
