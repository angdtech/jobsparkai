import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify admin user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { contentKey, title, content } = await request.json()

    if (!contentKey || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('site_content')
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('content_key', contentKey)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Failed to update content', details: error.message },
      { status: 500 }
    )
  }
}
