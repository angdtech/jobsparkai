import { NextRequest, NextResponse } from 'next/server'
import { CVSessionManager } from '@/lib/database'
import { existsSync, readdirSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId
    
    // Get session data
    const session = await CVSessionManager.getSession(sessionId)
    
    // Check uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'cvs')
    const uploadsExist = existsSync(uploadsDir)
    const files = uploadsExist ? readdirSync(uploadsDir) : []
    
    // Check if file_path exists
    let filePathExists = false
    if (session?.file_path) {
      filePathExists = existsSync(session.file_path)
    }
    
    // Try to construct the expected file path
    let constructedPath = null
    let constructedExists = false
    if (session?.file_name) {
      const timestamp = session.created_at ? new Date(session.created_at).getTime() : Date.now()
      const fileExtension = path.extname(session.file_name)
      const fileName = `${sessionId}-${timestamp}${fileExtension}`
      constructedPath = path.join(process.cwd(), 'public', 'uploads', 'cvs', fileName)
      constructedExists = existsSync(constructedPath)
    }
    
    return NextResponse.json({
      sessionId,
      session,
      debug: {
        uploadsDir,
        uploadsExist,
        filesInUploads: files,
        filePathFromSession: session?.file_path || null,
        filePathExists,
        constructedPath,
        constructedExists,
        filesMatchingSession: files.filter(f => f.includes(sessionId))
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error.message }, { status: 500 })
  }
}