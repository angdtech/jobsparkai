import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    const formData = await request.formData()
    const file = formData.get('cv_file') as File
    const sessionId = formData.get('session_id') as string

    console.log('File:', file?.name, 'Session:', sessionId)

    if (!file) {
      console.error('No file in request')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!sessionId) {
      console.error('No session ID in request')
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'cvs')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${sessionId}-${timestamp}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log('File saved to disk:', filePath)

    // Update the session with file info
    console.log('Updating session:', sessionId, 'with file info:', file.name, filePath)
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database admin access not configured' }, { status: 500 })
    }

    const { error: dbError } = await supabaseAdmin
      .from('auth_cv_sessions')
      .update({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save file info' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file_name: fileName,
      file_path: filePath,
      file_url: `/uploads/cvs/${fileName}`,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}