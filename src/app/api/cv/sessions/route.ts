import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('📥 Sessions API called')
  
  try {
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('❌ No authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted:', token.substring(0, 20) + '...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Invalid token: ' + authError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    const client = supabaseAdmin || supabase
    console.log('Using client:', supabaseAdmin ? 'admin' : 'regular')

    const { data: sessions, error: sessionsError } = await client
      .from('auth_cv_sessions')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: sessionsError.message }, { status: 500 })
    }

    console.log(`✅ Found ${sessions?.length || 0} sessions`)

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [], analyses: {} })
    }

    const { data: analyses, error: analysesError } = await client
      .from('cv_ats_analysis')
      .select('*')
      .in('session_id', sessions.map(s => s.session_id))

    if (analysesError) {
      console.error('⚠️  Error fetching analyses:', analysesError)
    } else {
      console.log(`✅ Found ${analyses?.length || 0} analyses`)
    }

    const analysisMap = (analyses || []).reduce((acc: any, analysis: any) => {
      acc[analysis.session_id] = analysis
      return acc
    }, {})

    return NextResponse.json({ 
      sessions,
      analyses: analysisMap
    })
  } catch (error) {
    console.error('❌ Error in sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
