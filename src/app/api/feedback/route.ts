import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, type, title, description } = await request.json()

    if (!userId || !email || !type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['improvement', 'bug'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: userId,
        email,
        type,
        title,
        description,
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving feedback:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
