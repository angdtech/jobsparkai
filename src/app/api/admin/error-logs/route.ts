import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')
    const severity = request.nextUrl.searchParams.get('severity')
    const resolved = request.nextUrl.searchParams.get('resolved')

    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true')
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      logs: data,
      total: count,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error logs', details: error.message },
      { status: 500 }
    )
  }
}
