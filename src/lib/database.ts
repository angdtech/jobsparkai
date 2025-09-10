import { supabase, supabaseAdmin } from './supabase'

// Database types based on your existing schema
export interface CVSession {
  id: number
  session_id: string
  file_name: string | null
  file_path?: string | null
  file_size?: number | null
  file_type?: string | null
  expires_at: string | null
  user_id: number | null // Original integer user_id from your existing schema
  auth_user_id?: string // New UUID field to link to Supabase auth
  is_paid?: boolean
  paid_at?: string | null
  payment_type?: string | null
  created_at: string
  updated_at: string
}

export interface CVFileStorage {
  id: string
  session_id: string
  user_id: number | null // Original integer user_id
  auth_user_id?: string // New UUID field
  original_filename: string
  firebase_storage_path: string
  firebase_download_url: string | null
  file_size: number | null
  file_type: string | null
  upload_status: string
  created_at: string
  updated_at: string
}

export interface CVATSAnalysis {
  id: string
  session_id: string
  user_id: number | null // Original integer user_id
  auth_user_id?: string // New UUID field
  overall_score: number
  file_extension: string | null
  file_format_score: number
  layout_score: number
  font_score: number
  content_structure_score: number
  rating: string
  rating_color: string
  issues: Record<string, any>[]
  recommendations: Record<string, any>[]
  strengths: Record<string, any>[]
  detailed_analysis: Record<string, any>
  text_length: number
  analyzed_at: string
  created_at: string
  updated_at: string
}

// CV Session Management
export class CVSessionManager {
  static async createSession(userId: string, fileName?: string): Promise<CVSession | null> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

      const insertData = {
        session_id: sessionId,
        auth_user_id: userId, // New auth system uses auth_user_id
        file_name: fileName || null,
        expires_at: expiresAt.toISOString()
      }

      console.log('Creating session with data:', insertData)

      const { data, error } = await supabase
        .from('auth_cv_sessions') // Use new table for new auth system
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating CV session:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('Error message:', error.message)
        console.error('Error code:', error.code)
        return null
      }

      return data as CVSession
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  }

  static async getUserSessions(userId: string): Promise<CVSession[]> {
    try {
      // Query new auth_cv_sessions table (safe from real data)
      const { data, error } = await supabase
        .from('auth_cv_sessions')
        .select('*')
        .eq('auth_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user sessions:', error)
        return []
      }

      return data as CVSession[]
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  }

  static async getSession(sessionId: string): Promise<CVSession | null> {
    try {
      // Use admin client to access sessions (including anonymous ones)
      const client = supabaseAdmin || supabase
      const { data, error } = await client
        .from('auth_cv_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
        return null
      }

      return data as CVSession
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  }

  static async updateSession(sessionId: string, updates: Partial<CVSession>): Promise<boolean> {
    try {
      // Use admin client to update sessions (including anonymous ones)
      const client = supabaseAdmin || supabase
      const { error } = await client
        .from('auth_cv_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error updating session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Use admin client to delete sessions (including anonymous ones)
      const client = supabaseAdmin || supabase
      
      // Delete the analysis first (foreign key constraint)
      await client
        .from('cv_ats_analysis')
        .delete()
        .eq('session_id', sessionId)

      // Delete the session
      const { error } = await client
        .from('auth_cv_sessions')
        .delete()
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error deleting session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error:', error)
      return false
    }
  }
}

// ATS Analysis Management
export class ATSAnalysisManager {
  static async createAnalysis(sessionId: string, userId: string | null, analysisData: Partial<CVATSAnalysis>): Promise<CVATSAnalysis | null> {
    try {
      // Use admin client to bypass RLS for anonymous sessions
      const client = supabaseAdmin || supabase
      const { data, error } = await client
        .from('cv_ats_analysis')
        .insert({
          session_id: sessionId,
          auth_user_id: userId,
          overall_score: analysisData.overall_score || 0,
          file_extension: analysisData.file_extension || null,
          file_format_score: analysisData.file_format_score || 0,
          layout_score: analysisData.layout_score || 0,
          font_score: analysisData.font_score || 0,
          content_structure_score: analysisData.content_structure_score || 0,
          rating: analysisData.rating || '',
          rating_color: analysisData.rating_color || '',
          issues: analysisData.issues || [],
          recommendations: analysisData.recommendations || [],
          strengths: analysisData.strengths || [],
          detailed_analysis: analysisData.detailed_analysis || {},
          text_length: analysisData.text_length || 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating ATS analysis:', error)
        return null
      }

      return data as CVATSAnalysis
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  }

  static async getAnalysis(sessionId: string): Promise<CVATSAnalysis | null> {
    try {
      // Use admin client to bypass RLS for anonymous sessions
      const client = supabaseAdmin || supabase
      const { data, error } = await client
        .from('cv_ats_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle no results gracefully

      if (error) {
        console.error('Error fetching ATS analysis:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          sessionId: sessionId
        })
        return null
      }

      // data will be null if no analysis found, which is expected
      if (!data) {
        console.log('No analysis found for session:', sessionId)
        return null
      }

      return data as CVATSAnalysis
    } catch (error) {
      console.error('Error:', error)
      return null
    }
  }
}