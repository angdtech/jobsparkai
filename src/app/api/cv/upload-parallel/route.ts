import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  if (fileExtension === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const fs = await import('fs')
    const dataBuffer = await fs.promises.readFile(filePath)
    const pdfData = await pdfParse(dataBuffer)
    return pdfData.text
  } else if (fileExtension === '.docx') {
    const mammoth = await import('mammoth')
    const rawResult = await mammoth.extractRawText({ path: filePath })
    return rawResult.value
  } else if (fileExtension === '.txt') {
    const fs = require('fs').promises
    return await fs.readFile(filePath, 'utf-8')
  }
  
  throw new Error(`Unsupported file type: ${fileExtension}`)
}

async function parseCVParallel(extractedText: string, sessionId: string) {
  console.log('🚀 Starting PARALLEL AI parsing, text length:', extractedText.length)
  
  const openai = getOpenAIClient()
  
  const timeout = (ms: number) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`AI API timeout after ${ms}ms`)), ms)
  )
  
  try {
    console.log('⏱️ Starting 4 parallel API calls with 120s timeout...')
    const startTime = Date.now()
    
    const results = await Promise.race([
      Promise.all([
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Extract personal info and professional summary from this CV. Return only valid JSON:\n\n${extractedText}\n\nReturn JSON:\n{"personal_info":{"name":"","email":"","phone":"","address":"","linkedin":"","tagline":""},"professional_summary":""}`
          }]
        }),
        
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Extract work experience from this CV. Include EVERY bullet point:\n\n${extractedText}\n\nReturn JSON:\n{"work_experience":[{"title":"","company":"","start_date":"","end_date":"","description_items":[]}]}`
          }]
        }),
        
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Extract education from this CV:\n\n${extractedText}\n\nReturn JSON:\n{"education":[{"degree":"","institution":"","start_date":"","end_date":"","description":""}]}`
          }]
        }),
        
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Extract skills from this CV:\n\n${extractedText}\n\nReturn JSON:\n{"skills":{"programming_languages":[],"tools_software":[],"frameworks_libraries":[],"databases":[],"other":[]}}`
          }]
        })
      ]),
      timeout(120000) // 120 second timeout
    ]) as any[]

    const [personalResult, workResult, educationResult, skillsResult] = results
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`✅ All parallel API calls completed in ${duration}s`)

    const parseJSON = (result: any, label: string) => {
      const content = result.choices[0].message.content?.trim() || '{}'
      const clean = content.replace(/```json\n?/, '').replace(/\n?```$/, '')
      try {
        const parsed = JSON.parse(clean)
        console.log(`✅ ${label} parsed successfully`)
        return parsed
      } catch (error) {
        console.error(`❌ Failed to parse ${label}:`, error)
        throw new Error(`Failed to parse ${label} from AI response`)
      }
    }

    const personal = parseJSON(personalResult, 'Personal Info')
    const work = parseJSON(workResult, 'Work Experience')
    const education = parseJSON(educationResult, 'Education')
    const skills = parseJSON(skillsResult, 'Skills')

    return {
      personal_info: personal.personal_info || {},
      professional_summary: personal.professional_summary || '',
      work_experience: work.work_experience || [],
      education: education.education || [],
      skills: skills.skills || {}
    }
  } catch (error: any) {
    console.error('❌ AI parsing error:', error)
    throw new Error(`AI parsing failed: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PARALLEL Upload API called')
    
    const formData = await request.formData()
    const file = formData.get('cv_file') as File
    const sessionId = formData.get('session_id') as string

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'Missing file or session ID' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cvs')
    const filePath = path.join(uploadDir, `${sessionId}-${Date.now()}${path.extname(file.name)}`)
    
    await writeFile(filePath, buffer)
    console.log('📁 File saved:', filePath)

    const session = await supabaseAdmin
      ?.from('auth_cv_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (!session?.data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    await supabaseAdmin
      ?.from('auth_cv_sessions')
      .update({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    const extractedText = await extractTextFromFile(filePath, file.name)
    console.log('📄 Text extracted, length:', extractedText.length)

    const parsedData = await parseCVParallel(extractedText, sessionId)
    console.log('✅ CV parsed successfully')

    const contentData = {
      session_id: sessionId,
      auth_user_id: session.data.auth_user_id,
      full_name: parsedData.personal_info?.name || '',
      email: parsedData.personal_info?.email || '',
      phone: parsedData.personal_info?.phone || '',
      location: parsedData.personal_info?.address || '',
      linkedin_url: parsedData.personal_info?.linkedin || null,
      website_url: parsedData.personal_info?.website || null,
      professional_summary: parsedData.professional_summary || '',
      work_experience: parsedData.work_experience || [],
      education: parsedData.education || [],
      skills: parsedData.skills || {},
      certifications: [],
      languages: [],
      projects: [],
      achievements: [],
      extracted_from_file: file.name,
      extraction_method: 'openai-parallel'
    }

    const { data: insertedData, error: dbError } = await supabaseAdmin
      ?.from('cv_content')
      .insert(contentData)
      .select()
      .single() || { data: null, error: null }

    if (dbError) {
      console.error('❌ Database insert error:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      })
      throw new Error(`Database error: ${dbError.message} (${dbError.code})`)
    }

    if (!insertedData) {
      throw new Error('Database insert succeeded but no data returned')
    }

    console.log('✅ Successfully saved to database:', {
      name: contentData.full_name,
      workExpCount: contentData.work_experience?.length || 0,
      educationCount: contentData.education?.length || 0
    })

    return NextResponse.json({ 
      success: true,
      sessionId,
      message: 'CV processed successfully with parallel parsing',
      data: {
        name: contentData.full_name,
        workExperience: contentData.work_experience?.length || 0,
        education: contentData.education?.length || 0
      }
    })
  } catch (error: any) {
    console.error('❌ Upload error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    })
    
    return NextResponse.json({ 
      error: error.message,
      errorType: error.constructor.name,
      details: 'Check server logs for full error details'
    }, { status: 500 })
  }
}
