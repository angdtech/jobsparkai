import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

// Initialize OpenAI client only when needed to avoid build-time errors
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Enhanced text extraction function
async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  try {
    if (fileExtension === '.pdf') {
      // Use pdf-parse with enhanced options for better extraction
      const pdfParse = (await import('pdf-parse')).default
      const fs = await import('fs')
      
      const dataBuffer = await fs.promises.readFile(filePath)
      
      // Enhanced PDF parsing options
      const options = {
        // Normalize whitespace and page breaks
        normalizeWhitespace: false,
        // Disable max pages limit to ensure all pages are processed
        max: 0,
        // Include more verbose parsing
        version: 'v1.10.1'
      }
      
      const pdfData = await pdfParse(dataBuffer, options)
      
      console.log('📄 PDF extraction results:', {
        totalPages: pdfData.numpages,
        textLength: pdfData.text.length,
        infoTitle: pdfData.info?.Title,
        firstPageSample: pdfData.text.substring(0, 200) + '...'
      })
      
      // Ensure we got substantial content
      if (pdfData.text.length < 500) {
        console.warn('⚠️ PDF extraction resulted in very short text, may be incomplete')
      }
      
      return pdfData.text
    } 
    else if (fileExtension === '.docx') {
      // Enhanced DOCX extraction
      const mammoth = await import('mammoth')
      
      // Use convertToHtml to preserve more structure, then strip HTML
      const htmlResult = await mammoth.convertToHtml({ path: filePath })
      const rawResult = await mammoth.extractRawText({ path: filePath })
      
      console.log('📄 DOCX extraction results:', {
        rawTextLength: rawResult.value.length,
        htmlLength: htmlResult.value.length,
        warnings: htmlResult.messages?.length || 0,
        sample: rawResult.value.substring(0, 200) + '...'
      })
      
      // Use raw text but log any issues
      if (htmlResult.messages && htmlResult.messages.length > 0) {
        console.log('DOCX extraction warnings:', htmlResult.messages)
      }
      
      return rawResult.value
    }
    else if (fileExtension === '.txt') {
      const fsPromises = require('fs').promises
      const content = await fsPromises.readFile(filePath, 'utf-8')
      
      console.log('📄 TXT extraction results:', {
        textLength: content.length,
        sample: content.substring(0, 200) + '...'
      })
      
      return content
    }
    else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text: ${error.message}`)
  }
}

// Simple AI-based parsing using GPT-4o-mini
async function parseCV(extractedText: string, sessionId: string) {
  console.log('🤖 Starting simple AI parsing with gpt-4o-mini, text length:', extractedText.length)
  
  // Save raw text to file for debugging with session ID
  const path = await import('path')
  const { writeFile } = await import('fs/promises')
  const outputPath = path.join(process.cwd(), 'public', `raw-cv-text-${sessionId}.txt`)
  await writeFile(outputPath, extractedText, 'utf-8')
  console.log('📝 Raw CV text saved to:', outputPath)
  
  const prompt = `Extract data from this CV text and return JSON. CRITICAL: PRESERVE the original formatting exactly as it appears:

- If the original has bullet points (•, -, *, etc.), extract each bullet as a separate item
- If the original has paragraphs, extract each paragraph as a separate item  
- If there's spacing between sections, preserve that structure
- Include ALL details, achievements, and bullet points - do not summarize or combine
- CATEGORIZE SKILLS: Organize skills into relevant categories:
  * programming_languages: JavaScript, Python, Java, C#, etc.
  * tools_software: Photoshop, Microsoft Office, Jira, Confluence, etc.
  * frameworks_libraries: React, Angular, Laravel, Spring, etc.
  * databases: MySQL, PostgreSQL, MongoDB, etc.
  * other: Project Management, Agile, Leadership, etc.

${extractedText}

Return JSON:
{
  "personal_info": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number", 
    "address": "location",
    "linkedin": "linkedin url",
    "tagline": "Professional tagline or value proposition - examples: 'Product Manager | AI & Mobile Apps | Agile Delivery Expert' or 'Senior Developer specializing in React & Node.js with 5+ years experience' (extract if present, otherwise suggest one based on experience)"
  },
  "professional_summary": "Professional summary",
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "start_date": "Start Date",
      "end_date": "End Date",
      "description_items": [
        "Each bullet point or paragraph as a separate item",
        "Preserve original spacing and formatting",
        "Include every single detail from the original"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "institution": "School",
      "start_date": "Start",
      "end_date": "End",
      "description": "Details"
    }
  ],
  "skills": {
    "programming_languages": [{"name": "JavaScript", "level": 85}],
    "tools_software": [{"name": "Photoshop", "level": 80}],
    "frameworks_libraries": [{"name": "React", "level": 90}],
    "databases": [{"name": "MySQL", "level": 75}],
    "other": [{"name": "Project Management", "level": 80}]
  }
}`

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the correct model name
      messages: [
        { role: 'system', content: 'Extract ALL CV data. Include every detail, bullet point, and achievement. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0
    })
    
    const result = response.choices[0].message.content
    console.log('🤖 AI parsing completed, result length:', result?.length || 0)
    
    if (!result) {
      throw new Error('No response from OpenAI')
    }
    
    // Save AI response to file for debugging with session ID
    const aiOutputPath = path.join(process.cwd(), 'public', `ai-parsed-cv-${sessionId}.txt`)
    await writeFile(aiOutputPath, result, 'utf-8')
    console.log('📝 AI response saved to:', aiOutputPath)
    
    // Clean and parse JSON with error recovery
    let cleanResult = result.trim()
    if (cleanResult.startsWith('```json')) {
      cleanResult = cleanResult.replace(/```json\n?/, '').replace(/\n?```$/, '')
    }
    
    // Try to fix common JSON issues
    let parsedResult
    try {
      parsedResult = JSON.parse(cleanResult)
      console.log('✅ JSON parsed successfully on first try')
    } catch (firstError) {
      console.log('⚠️ First JSON parse failed, attempting advanced recovery...')
      console.log('⚠️ JSON error:', firstError.message)
      console.log('⚠️ JSON length:', cleanResult.length)
      console.log('⚠️ Last 100 chars:', cleanResult.slice(-100))
      
      // Advanced JSON recovery: try multiple strategies
      let fixedJson = cleanResult
      let recovered = false
      
      // Strategy 1: Remove trailing comma and incomplete entries
      fixedJson = cleanResult.replace(/,\s*$/, '') // Remove trailing comma
      
      // Strategy 2: Try to close incomplete structures
      const openBraces = (cleanResult.match(/{/g) || []).length
      const closeBraces = (cleanResult.match(/}/g) || []).length
      const openBrackets = (cleanResult.match(/\[/g) || []).length
      const closeBrackets = (cleanResult.match(/]/g) || []).length
      
      console.log('🔧 Structure analysis:', {
        openBraces, closeBraces, openBrackets, closeBrackets,
        needBraces: openBraces - closeBraces,
        needBrackets: openBrackets - closeBrackets
      })
      
      // Add missing closing brackets and braces
      const missingBrackets = openBrackets - closeBrackets
      const missingBraces = openBraces - closeBraces
      
      for (let i = 0; i < missingBrackets; i++) {
        fixedJson += ']'
      }
      for (let i = 0; i < missingBraces; i++) {
        fixedJson += '}'
      }
      
      try {
        parsedResult = JSON.parse(fixedJson)
        console.log('✅ JSON parsed successfully after structure recovery')
        recovered = true
      } catch (secondError) {
        console.log('⚠️ Structure recovery failed, trying truncation...')
        
        // Strategy 3: Truncate to last valid closing brace
        const lastBraceIndex = cleanResult.lastIndexOf('}')
        
        if (lastBraceIndex > 0) {
          fixedJson = cleanResult.substring(0, lastBraceIndex + 1)
          console.log('🔧 Truncated JSON to last complete brace at position:', lastBraceIndex)
          
          try {
            parsedResult = JSON.parse(fixedJson)
            console.log('✅ JSON parsed successfully after truncation')
            recovered = true
          } catch (thirdError) {
            console.log('❌ All recovery strategies failed')
            console.log('❌ Original error:', firstError.message)
            console.log('❌ Structure error:', secondError.message)
            console.log('❌ Truncation error:', thirdError.message)
            throw firstError
          }
        } else {
          throw firstError
        }
      }
    }
    
    // Add logging and extracted text
    console.log('📊 Parsing results:', {
      name: parsedResult.personal_info?.name || 'Missing',
      workExperience: parsedResult.work_experience?.length || 0,
      education: parsedResult.education?.length || 0,
      skills: parsedResult.skills?.length || 0,
      responseLength: result.length
    })
    
    // Add the original extracted text for reference
    parsedResult.extracted_text = extractedText
    
    return parsedResult
  } catch (error) {
    console.error('❌ FATAL: AI parsing failed completely')
    console.error('❌ Error type:', error.constructor.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Full stack trace:', error.stack)
    
    // NO FALLBACK - throw the actual error
    throw new Error(`AI CV parsing failed: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  // Enable detailed error reporting (like PHP error_reporting(E_ALL))
  const DEBUG_MODE = true
  const startTime = Date.now()
  
  try {
    console.log('🚀 Upload API called at:', new Date().toISOString())
    console.log('📊 Request details:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    })
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
      .maybeSingle()

    if (checkError) {
      console.error('Session check error:', checkError)
      return NextResponse.json({ 
        error: 'Database error checking session',
        details: checkError.message,
        sessionId: sessionId
      }, { status: 500 })
    }

    if (!existingSession) {
      console.error('Session not found in database:', sessionId)
      return NextResponse.json({ 
        error: 'Session not found',
        details: 'The session ID does not exist in the database',
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
    
    let extractedText = null // Declare outside try block for proper scope
    
    try {
      // Step 1: Extract text from file
      console.log('📄 Extracting text from file...')
      extractedText = await extractTextFromFile(filePath, file.name)
      
      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the file')
      }
      
      console.log('✅ Text extracted successfully, length:', extractedText.length)
      
      // Step 2: Parse extracted text with AI
      console.log('🤖 Parsing CV data with AI...')
      console.log('📏 Input text length:', extractedText.length)
      console.log('📝 First 200 chars:', extractedText.substring(0, 200))
      
      const extractionResult = await parseCV(extractedText, sessionId)
      
      console.log('🔍 FULL Extraction result received:', {
        hasError: !!extractionResult.error,
        errorValue: extractionResult.error,
        hasPersonalInfo: !!extractionResult.personal_info,
        personalInfoName: extractionResult.personal_info?.name,
        workExpCount: extractionResult.work_experience?.length,
        isFromFallback: extractionResult.personal_info?.name === 'Unknown',
        allKeys: Object.keys(extractionResult),
        resultType: typeof extractionResult,
        fallbackReason: extractionResult.fallback_reason
      })
      
      console.log('📋 Personal info details:', extractionResult.personal_info)
      console.log('💼 Work experience sample:', extractionResult.work_experience?.[0])

      console.log('Extraction result:', { 
        hasError: !!extractionResult.error,
        hasPersonalInfo: !!extractionResult.personal_info,
        workExperienceCount: extractionResult.work_experience?.length || 0,
        skillsCount: extractionResult.skills?.length || 0
      })
      
      // Add extracted text to result
      extractionResult.extracted_text = extractedText

      // Save extracted CV content to database
      console.log('🚪 Checking database save condition:', {
        hasNoError: !extractionResult.error,
        hasPersonalInfo: !!extractionResult.personal_info,
        willSaveToDatabase: !extractionResult.error && extractionResult.personal_info
      })
      
      if (!extractionResult.error && extractionResult.personal_info) {
        console.log('✅ CONDITION MET - Saving extracted CV content to database...')
        
        // Get the session owner to set auth_user_id properly
        const { data: sessionData, error: sessionError } = await supabaseAdmin
          .from('auth_cv_sessions')
          .select('auth_user_id')
          .eq('session_id', sessionId)
          .maybeSingle()
        
        if (sessionError) {
          console.error('❌ Failed to get session owner:', sessionError)
          // Continue without setting auth_user_id for anonymous sessions
        }
        
        console.log('📊 Session lookup result:', {
          sessionId: sessionId,
          sessionFound: !!sessionData,
          authUserId: sessionData?.auth_user_id || 'none'
        })

        // Parse the extracted data and save to cv_content table
        console.log('🔍 Checking extraction result structure:', {
          hasPersonalInfo: !!extractionResult.personal_info,
          hasWorkExperience: !!extractionResult.work_experience,
          workExpCount: extractionResult.work_experience?.length || 0,
          name: extractionResult.personal_info?.name,
          summary: extractionResult.professional_summary?.substring(0, 100)
        })

        const cvContentData = {
          session_id: sessionId,
          auth_user_id: sessionData?.auth_user_id || null,
          full_name: extractionResult.personal_info?.name || 'Unknown',
          email: extractionResult.personal_info?.email || null,
          phone: extractionResult.personal_info?.phone || null,
          location: extractionResult.personal_info?.address || null,
          linkedin_url: extractionResult.personal_info?.linkedin || null,
          website_url: extractionResult.personal_info?.website || null,
          professional_summary: extractionResult.professional_summary || null,
          work_experience: extractionResult.work_experience || [],
          education: extractionResult.education || [],
          skills: extractionResult.skills || [],
          certifications: extractionResult.certifications || [],
          languages: extractionResult.languages || [],
          projects: extractionResult.projects || [],
          achievements: extractionResult.achievements || [],
          extracted_from_file: fileName,
          extraction_method: 'ai_parsed'
        }

        console.log('🗃️ CV content data to save:', {
          session_id: cvContentData.session_id,
          full_name: cvContentData.full_name,
          summary_length: cvContentData.professional_summary?.length || 0,
          work_experience_count: cvContentData.work_experience.length,
          skills_count: cvContentData.skills.length,
          auth_user_id: cvContentData.auth_user_id
        })

        console.log('🔧 Full data object keys:', Object.keys(cvContentData))
        console.log('📊 Sample work experience:', cvContentData.work_experience?.[0])

        // Simple INSERT - one CV per session
        console.log('💾 Attempting database INSERT...')
        const { data: savedData, error: cvError } = await supabaseAdmin
          .from('cv_content')
          .insert(cvContentData)
          
        console.log('🔍 Database INSERT result:')
        console.log('   - Error:', cvError)
        console.log('   - Success:', !cvError)
        console.log('   - Data returned:', !!savedData)
        console.log('   - Saved record count:', savedData?.length || 0)

        if (cvError) {
          console.error('❌ Failed to save CV content to database:', cvError)
          console.error('Error details:', JSON.stringify(cvError, null, 2))
        } else {
          console.log('✅ Successfully saved CV content to database')
          console.log('Saved data:', savedData)
        }
      } else {
        console.log('❌ Extraction failed or no content extracted')
        console.log('Error details:', {
          hasError: extractionResult.error,
          hasPersonalInfo: !!extractionResult.personal_info,
          fallbackReason: extractionResult.fallback_reason,
          extractionResultKeys: Object.keys(extractionResult)
        })
      }

      return NextResponse.json({
        success: true,
        file_name: fileName,
        file_path: filePath,
        file_url: `/uploads/cvs/${fileName}`,
        size: file.size,
        type: file.type,
        extracted_content: !extractionResult.error,
        extraction_result: extractionResult
      })

    } catch (extractError) {
      console.error('❌ FATAL: CV extraction/parsing failed')
      console.error('❌ Error type:', extractError.constructor.name)
      console.error('❌ Error message:', extractError.message)
      console.error('❌ Full stack trace:', extractError.stack)
      
      // Return detailed error instead of hiding it
      return NextResponse.json({
        success: false,
        error: 'CV extraction/parsing failed',
        error_type: extractError.constructor.name,
        error_message: extractError.message,
        error_stack: extractError.stack,
        file_name: fileName,
        session_id: sessionId,
        debug_info: {
          extraction_step: 'AI parsing',
          text_length: extractedText?.length || 0,
          ai_response_saved: true // Check ai-parsed-cv.txt file
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ FATAL: Upload failed at top level')
    console.error('❌ Error type:', error.constructor.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Full stack trace:', error.stack)
    
    // Return detailed error instead of generic "Upload failed"
    return NextResponse.json({
      success: false,
      error: 'Upload failed at top level',
      error_type: error.constructor.name,
      error_message: error.message,
      error_stack: error.stack,
      debug_info: {
        step: 'top-level catch',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}