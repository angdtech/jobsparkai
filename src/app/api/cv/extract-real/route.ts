import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }
    
    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get the session to find the uploaded file
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('auth_cv_sessions_nw')
      .select('*')
      .eq('session_id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // For now, we'll extract some mock data and call OpenAI
    // In a real implementation, you'd read the actual uploaded file
    const mockExtractedText = `
AUSTIN BRONSON
4710 Bus Boulevard, Flintstone, GA 30725
phone: +(1) 2345 555
email: contact@yourdomain.com

EXPERIENCE

SALES FORCE TEAM LEADER (2006 - NOW)
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.

SALES MANAGER (2003 - 2006)
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

SALESPERSON (1999 - 2003)
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in.

EDUCATION

HIGH SCHOOL OF DESIGN (1996 - 1999)
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

SCHOOL 2 (1994 - 1996)
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

SKILLS
Graphic Design
Web Development
Lorem Ipsum
Dolor sit amet
Consectetur elit
`

    // Call the data extraction API
    const extractResponse = await fetch(`${request.nextUrl.origin}/api/cv/extract-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session_id,
        extractedText: mockExtractedText
      })
    })

    if (!extractResponse.ok) {
      throw new Error('Failed to extract data with OpenAI')
    }

    const extractedData = await extractResponse.json()

    return NextResponse.json({
      success: true,
      cv_data: { extractedText: mockExtractedText },
      data: extractedData.data,
      cvContentId: extractedData.cvContentId
    })

  } catch (error) {
    console.error('CV extraction error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract CV data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}