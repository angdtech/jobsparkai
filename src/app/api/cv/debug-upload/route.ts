import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Check session data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('auth_cv_sessions_nw')
      .select('*')
      .eq('session_id', sessionId)
      .single()
    
    // Check content data
    const { data: content, error: contentError } = await supabaseAdmin
      .from('cv_content_nw')
      .select('*')
      .eq('session_id', sessionId)
      .single()
    
    return NextResponse.json({
      session_exists: !sessionError,
      session_data: session,
      session_error: sessionError?.message,
      content_exists: !contentError,
      content_data: content ? {
        full_name: content.full_name,
        work_experience_count: content.work_experience?.length || 0,
        education_count: content.education?.length || 0,
        skills_count: content.skills?.length || 0
      } : null,
      content_error: contentError?.message
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}