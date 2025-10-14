import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { session_id, file_name } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Create session for anonymous user by inserting directly
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    const insertData = {
      session_id: session_id,
      auth_user_id: null, // Allow anonymous sessions
      file_name: file_name || null,
      expires_at: expiresAt.toISOString()
    }

    console.log('Creating anonymous session with data:', insertData)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database admin access not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('auth_cv_sessions_nw')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session_id: session_id,
      session: data
    })

  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Session creation failed' }, { status: 500 })
  }
}