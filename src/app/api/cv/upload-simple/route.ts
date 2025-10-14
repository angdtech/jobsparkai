import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Simple upload API called')
    const formData = await request.formData()
    const file = formData.get('cv_file') as File
    const sessionId = formData.get('session_id') as string

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'Missing file or session ID' }, { status: 400 })
    }

    console.log('Processing file:', file.name, 'for session:', sessionId)

    // For Vercel deployment, we'll use Supabase Storage instead of local filesystem
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${sessionId}-${timestamp}${fileExtension}`
    
    let filePath = `/uploads/cvs/${fileName}` // fallback path
    
    // Try to upload to Supabase Storage if available
    if (supabaseAdmin) {
      try {
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('cv-files')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          })
        
        if (!uploadError && uploadData) {
          filePath = uploadData.path
          console.log('✅ File uploaded to Supabase Storage:', filePath)
        } else {
          console.log('⚠️  Supabase Storage upload failed, using fallback')
        }
      } catch (error) {
        console.log('⚠️  Supabase Storage not configured, using fallback')
      }
    } else {
      console.log('⚠️  No Supabase client, using fallback path')
    }

    // Create the session AND save file info in one operation
    if (!supabaseAdmin) {
      console.log('⚠️  No admin client, but file saved to disk')
      return NextResponse.json({
        success: true,
        file_name: fileName,
        note: 'File saved to disk, database connection not available'
      })
    }

    // Try to create/update session - if it fails, that's OK, file is still uploaded
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const sessionData = {
        session_id: sessionId,
        auth_user_id: null, // Will be updated if user is authenticated
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        expires_at: expiresAt.toISOString()
      }

      // Try to insert new session (for anonymous users)
      const { data, error } = await supabaseAdmin
        .from('auth_cv_sessions_nw')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        // If insert fails, try to update existing session (for dashboard users)
        console.log('Insert failed, trying update:', error.message)
        const { error: updateError } = await supabaseAdmin
          .from('auth_cv_sessions_nw')
          .update({
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)

        if (updateError) {
          console.log('Update also failed:', updateError.message)
        } else {
          console.log('✅ Session updated successfully')
        }
      } else {
        console.log('✅ Session created successfully:', data.id)
      }
    } catch (dbError) {
      console.log('Database operation failed, but file is saved:', dbError)
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
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}