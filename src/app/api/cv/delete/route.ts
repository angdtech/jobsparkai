import { NextRequest, NextResponse } from 'next/server'
import { CVSessionManager } from '@/lib/database'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ API: Attempting to delete session: ${sessionId}`)
    
    const success = await CVSessionManager.deleteSession(sessionId)
    
    if (success) {
      console.log(`✅ API: Successfully deleted session: ${sessionId}`)
      return NextResponse.json({ success: true })
    } else {
      console.log(`❌ API: Failed to delete session: ${sessionId}`)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ API: Delete session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}