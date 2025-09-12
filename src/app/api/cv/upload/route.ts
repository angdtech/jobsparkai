import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Text extraction function
async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  try {
    if (fileExtension === '.pdf') {
      // Use pdf-parse with workaround for test file issue
      const pdfParse = (await import('pdf-parse')).default
      const fs = await import('fs')
      
      const dataBuffer = await fs.promises.readFile(filePath)
      const pdfData = await pdfParse(dataBuffer)
      return pdfData.text
    } 
    else if (fileExtension === '.docx') {
      // Dynamic import for mammoth
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ path: filePath })
      return result.value
    }
    else if (fileExtension === '.txt') {
      const fsPromises = require('fs').promises
      return await fsPromises.readFile(filePath, 'utf-8')
    }
    else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text: ${error.message}`)
  }
}

// OpenAI formatting function
async function formatCVData(extractedText: string) {
  const prompt = `Extract CV data from this text and return JSON in this exact format:
{
  "personal_info": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "address": "location",
    "linkedin": "linkedin url",
    "github": "github url",
    "website": "website url"
  },
  "professional_summary": "Brief professional summary",
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "start_date": "Start Date",
      "end_date": "End Date", 
      "description": "Job description"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "start_date": "Start Date",
      "end_date": "End Date",
      "description": "Additional details"
    }
  ],
  "skills": [{"name": "Skill Name", "level": 80}]
}

CV Text:
${extractedText}

Return only valid JSON:`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a CV parser. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    })
    
    const result = response.choices[0].message.content
    return JSON.parse(result)
  } catch (error) {
    console.error('OpenAI formatting failed:', error)
    // Return basic structure with raw text
    return {
      personal_info: { name: "Extracted from CV" },
      professional_summary: extractedText.substring(0, 500),
      work_experience: [],
      education: [],
      skills: []
    }
  }
}

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

    // First check if the session exists
    console.log('Checking if session exists:', sessionId)
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database admin access not configured' }, { status: 500 })
    }

    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('auth_cv_sessions')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .single()

    if (checkError) {
      console.error('Session check error:', checkError)
      return NextResponse.json({ 
        error: 'Session not found',
        details: checkError.message,
        sessionId: sessionId
      }, { status: 404 })
    }

    console.log('Session found:', existingSession)
    console.log('Updating session with file info:', file.name, filePath)

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
      console.error('Database error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        sessionId: sessionId
      })
      return NextResponse.json({ 
        error: 'Failed to save file info',
        details: dbError.message,
        sessionId: sessionId
      }, { status: 500 })
    }

    // Extract CV content immediately after upload using Next.js
    console.log('🔍 Starting CV extraction process...')
    console.log('File path:', filePath)
    console.log('Session ID:', sessionId)
    
    try {
      // Step 1: Extract text from file
      console.log('📄 Extracting text from file...')
      const extractedText = await extractTextFromFile(filePath, file.name)
      
      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the file')
      }
      
      console.log('✅ Text extracted successfully, length:', extractedText.length)
      
      // Step 2: Format extracted text with OpenAI
      console.log('🤖 Formatting CV data with OpenAI...')
      const extractionResult = await formatCVData(extractedText)

      console.log('Extraction result:', { 
        hasError: !!extractionResult.error,
        hasPersonalInfo: !!extractionResult.personal_info,
        workExperienceCount: extractionResult.work_experience?.length || 0,
        skillsCount: extractionResult.skills?.length || 0
      })
      
      // Add extracted text to result
      extractionResult.extracted_text = extractedText

      // Step 2: Run ATS Analysis on the extracted content
      console.log('🧠 Running ATS analysis on extracted content...')
      let analysisResult = null
      
      try {
        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cv/analyze-test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            cv_data: {
              extractedText: extractedText,
              full_content: extractionResult,
              file_type: file.type,
              session_id: sessionId
            }
          }),
        })
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          analysisResult = analysisData.analysis
          console.log('✅ ATS analysis completed successfully')
        } else {
          console.error('❌ ATS analysis failed:', await analysisResponse.text())
        }
      } catch (analysisError) {
        console.error('❌ ATS analysis error:', analysisError)
      }

      // Save extracted CV content to database
      if (!extractionResult.error && extractionResult.extracted_text) {
        console.log('💾 Saving extracted CV content to database...')
        
        // Get the session owner to set auth_user_id properly
        const { data: sessionData, error: sessionError } = await supabaseAdmin
          .from('auth_cv_sessions')
          .select('auth_user_id')
          .eq('session_id', sessionId)
          .single()
        
        if (sessionError) {
          console.error('❌ Failed to get session owner:', sessionError)
          // Continue without setting auth_user_id for anonymous sessions
        }

        // Parse the extracted data and save to cv_content table
        const cvContentData = {
          session_id: sessionId,
          auth_user_id: sessionData?.auth_user_id || null, // Set to null for anonymous sessions
          full_name: extractionResult.personal_info?.name || 'Unknown',
          email: extractionResult.personal_info?.email || null,
          phone: extractionResult.personal_info?.phone || null,
          location: extractionResult.personal_info?.address || null,
          professional_summary: extractionResult.professional_summary || extractionResult.extracted_text?.substring(0, 500) || null,
          work_experience: extractionResult.work_experience || [],
          education: extractionResult.education || [],
          skills: extractionResult.skills || [],  // Skills already combined with tools and levels in parser
          certifications: extractionResult.certifications || [],
          languages: extractionResult.languages || [],
          extracted_from_file: fileName,
          extraction_method: 'nextjs_direct'
        }

        console.log('CV content data to save:', {
          session_id: cvContentData.session_id,
          full_name: cvContentData.full_name,
          summary_length: cvContentData.professional_summary?.length || 0,
          work_experience_count: cvContentData.work_experience.length,
          skills_count: cvContentData.skills.length
        })

        // Delete existing content for this session first, then insert new
        const { error: deleteError } = await supabaseAdmin
          .from('cv_content')
          .delete()
          .eq('session_id', sessionId)
        
        if (deleteError) {
          console.log('Delete existing content error (expected for new sessions):', deleteError.message)
        }

        // Insert new content
        const { data: savedData, error: cvError } = await supabaseAdmin
          .from('cv_content')
          .insert(cvContentData)
          .select()
          
        console.log('Database insert attempt - cvError:', cvError)
        console.log('Database insert attempt - savedData:', savedData)

        if (cvError) {
          console.error('❌ Failed to save CV content to database:', cvError)
          console.error('Error details:', JSON.stringify(cvError, null, 2))
        } else {
          console.log('✅ Successfully saved CV content to database')
          console.log('Saved data:', savedData)
        }
      } else {
        console.log('❌ Extraction failed or no content extracted')
        console.log('Error:', extractionResult.error)
      }

      return NextResponse.json({
        success: true,
        file_name: fileName,
        file_path: filePath,
        file_url: `/uploads/cvs/${fileName}`,
        size: file.size,
        type: file.type,
        extracted_content: !extractionResult.error,
        extraction_result: extractionResult,
        analysis_completed: !!analysisResult,
        analysis_result: analysisResult,
        issues_found: analysisResult?.issues?.length || 0,
        rating: analysisResult?.rating || 'Analyzing...'
      })

    } catch (extractError) {
      console.error('CV extraction error:', extractError)
      // Still return success for file upload even if extraction fails
      return NextResponse.json({
        success: true,
        file_name: fileName,
        file_path: filePath,
        file_url: `/uploads/cvs/${fileName}`,
        size: file.size,
        type: file.type,
        extracted_content: false,
        extraction_error: extractError instanceof Error ? extractError.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}