import { NextRequest, NextResponse } from 'next/server'
import { CVSessionManager } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get session data
    const session = await CVSessionManager.getSession(session_id)
    
    if (!session || !session.file_name) {
      return NextResponse.json({ error: 'Session not found or no file uploaded' }, { status: 404 })
    }

    console.log('Mock extracting content for session:', session_id, 'file:', session.file_name)

    // Return mock CV data for testing
    const mockCvData = {
      file_type: session.file_name?.split('.').pop() || 'pdf',
      content: `Mock extracted content from ${session.file_name}`,
      sections: {
        personal_info: {
          name: "Test User",
          email: "test@example.com",
          phone: "+1234567890"
        },
        experience: [
          {
            title: "Software Developer",
            company: "Tech Corp",
            duration: "2020-2024",
            description: "Developed web applications using React and Node.js"
          }
        ],
        skills: ["JavaScript", "React", "Node.js", "Python"],
        education: [
          {
            degree: "Computer Science",
            institution: "University of Tech",
            year: "2020"
          }
        ]
      },
      total_words: 150,
      readability_score: 85
    }

    return NextResponse.json({
      success: true,
      cv_data: mockCvData,
      extraction_method: 'mock_for_testing'
    })

  } catch (error) {
    console.error('Mock extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to process CV',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}