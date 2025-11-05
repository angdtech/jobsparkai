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
  user_id: number | null // Integer field matching actual database schema
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

      // Use admin client to bypass RLS for session creation
      const client = supabaseAdmin || supabase
      const { data, error } = await client
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
      // Query new auth_cv_sessions table using admin client
      const client = supabaseAdmin || supabase
      const { data, error } = await client
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
      
      console.log(`🗑️ Attempting to delete session: ${sessionId}`)
      
      // Delete all related data first (to avoid foreign key constraints)
      // Delete from cv_ats_analysis
      const { error: analysisError } = await client
        .from('cv_ats_analysis')
        .delete()
        .eq('session_id', sessionId)
        
      if (analysisError) {
        console.error('Error deleting analysis data:', analysisError)
        // Continue anyway, as this table might not have data for this session
      } else {
        console.log('✅ Successfully deleted analysis data')
      }
      
      // Delete from cv_content  
      const { error: contentError } = await client
        .from('cv_content')
        .delete()
        .eq('session_id', sessionId)
        
      if (contentError) {
        console.error('Error deleting content data:', contentError)
        // Continue anyway, as this table might not have data for this session
      } else {
        console.log('✅ Successfully deleted content data')
      }
      
      // Delete the main session
      const { error: sessionError } = await client
        .from('auth_cv_sessions')
        .delete()
        .eq('session_id', sessionId)

      if (sessionError) {
        console.error('Error deleting session:', sessionError)
        return false
      }
      
      console.log('✅ Successfully deleted session')
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
      console.log('📝 ATSAnalysisManager.createAnalysis called with:', { sessionId, userId })
      
      // Use admin client to bypass RLS policies temporarily while we debug
      const client = supabaseAdmin || supabase
      console.log('📝 Using admin client to bypass RLS policies for analysis insert')
      
      const insertData = {
        session_id: sessionId,
        user_id: null, // cv_ats_analysis uses user_id (integer), not auth_user_id
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
        // Note: analyzed_at, created_at, updated_at will be auto-set by database defaults
      }
      
      console.log('📝 Inserting data:', insertData)
      
      const { data, error } = await client
        .from('cv_ats_analysis')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return null
      }

      console.log('✅ Analysis saved successfully:', data)
      return data as CVATSAnalysis
    } catch (error) {
      console.error('❌ Exception in createAnalysis:', error)
      return null
    }
  }

  static async getAnalysis(sessionId: string): Promise<CVATSAnalysis | null> {
    try {
      console.log('📝 ATSAnalysisManager.getAnalysis called for session:', sessionId)
      
      // Use admin client to bypass RLS for analysis fetching, fallback to regular client
      const client = supabaseAdmin || supabase
      console.log('📝 Supabase clients status:', {
        admin: !!supabaseAdmin,
        regular: !!supabase,
        using: supabaseAdmin ? 'admin' : 'regular'
      })
      
      if (!client) {
        console.error('❌ No Supabase client available')
        return null
      }
      
      const { data, error } = await client
        .from('cv_ats_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle no results gracefully

      if (error) {
        console.error('Error fetching ATS analysis:', error, 'for session:', sessionId)
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