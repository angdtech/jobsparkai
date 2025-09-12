import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }
  
  try {
    // Check cv_ats_analysis table
    const { data: atsData, error: atsError } = await supabaseAdmin
      .from('cv_ats_analysis')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()
    
    // Check cv_content table 
    const { data: contentData, error: contentError } = await supabaseAdmin
      .from('cv_content')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()
      
    // Check auth_cv_sessions table
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('auth_cv_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()
    
    return NextResponse.json({
      session_id: sessionId,
      ats_analysis: {
        data: atsData,
        error: atsError
      },
      cv_content: {
        data: contentData,
        error: contentError
      },
      session_info: {
        data: sessionData,
        error: sessionError
      }
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}