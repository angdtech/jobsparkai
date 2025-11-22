import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  try {
    if (fileExtension === '.pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const fs = await import('fs')
      const dataBuffer = await fs.promises.readFile(filePath)
      const pdfData = await pdfParse(dataBuffer)
      return pdfData.text
    } 
    else if (fileExtension === '.docx') {
      const mammoth = await import('mammoth')
      const rawResult = await mammoth.extractRawText({ path: filePath })
      return rawResult.value
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

// PARALLEL PARSING: Split into 5 focused AI calls
async function parsePersonalInfo(openai: OpenAI, cvText: string) {
  const prompt = `Extract ONLY personal/contact information from this CV. Return JSON:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "address": "location",
  "linkedin": "linkedin url",
  "website": "website url",
  "tagline": "Professional tagline based on experience"
}

CV Text:
${cvText.substring(0, 2000)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract personal info only. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    max_tokens: 300
  })
  
  let content = response.choices[0].message.content || '{}'
  // Remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse personal info JSON:', error)
    // Return minimal valid object on parse failure
    return { name: 'Unknown', email: null, phone: null, address: null }
  }
}

async function parseWorkExperience(openai: OpenAI, cvText: string) {
  const prompt = `Extract ONLY work experience from this CV. Return JSON array with ALL bullet points EXACTLY as written:
[
  {
    "title": "Job Title",
    "company": "Company Name", 
    "start_date": "Start Date",
    "end_date": "End Date",
    "description_items": ["Bullet point 1 EXACTLY as written", "Bullet point 2 EXACTLY as written"]
  }
]

CRITICAL: Extract ALL bullet points EXACTLY as they appear in the CV. Do NOT summarize, do NOT paraphrase, do NOT make up content.
Copy the exact wording from the CV text.

CV Text:
${cvText}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract work experience EXACTLY as written. Do NOT summarize or paraphrase. Return valid JSON array only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    max_tokens: 8000
  })
  
  let content = response.choices[0].message.content || '[]'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse work experience JSON:', error)
    console.error('Raw content (first 500 chars):', content.substring(0, 500))
    console.error('Raw content (last 500 chars):', content.substring(content.length - 500))
    // Return empty array on parse failure
    return []
  }
}

async function parseEducationAndSkills(openai: OpenAI, cvText: string) {
  const prompt = `Extract ONLY education and skills from this CV. Return JSON:
{
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
}

CV Text:
${cvText}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract education and skills only. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    max_tokens: 1000
  })
  
  let content = response.choices[0].message.content || '{}'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse education/skills JSON:', error)
    return { education: [], skills: {} }
  }
}

async function parseProfessionalSummary(openai: OpenAI, cvText: string) {
  const prompt = `Extract or generate a professional summary from this CV. Return JSON:
{
  "professional_summary": "Professional summary text",
  "certifications": [],
  "languages": [],
  "projects": [],
  "achievements": []
}

CV Text:
${cvText.substring(0, 3000)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract summary and additional sections. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    max_tokens: 800
  })
  
  let content = response.choices[0].message.content || '{}'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse summary JSON:', error)
    return { professional_summary: '', certifications: [], languages: [], projects: [], achievements: [] }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 PARALLEL Upload + Parsing started:', new Date().toISOString())
  
  try {
    const formData = await request.formData()
    const file = formData.get('cv_file') as File
    const sessionId = formData.get('session_id') as string

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'File and session ID required' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // STEP 1: Save file to disk (fast, ~100ms)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'cvs')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${sessionId}-${timestamp}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    console.log('✅ File saved:', Date.now() - startTime, 'ms')

    // STEP 2: Extract text from file (fast, 1-3s)
    const extractedText = await extractTextFromFile(filePath, file.name)
    console.log('✅ Text extracted:', Date.now() - startTime, 'ms, length:', extractedText.length)

    if (!extractedText.trim() || extractedText.length < 50) {
      throw new Error('No text could be extracted from the file')
    }

    // STEP 3: PARALLEL CV PARSING - 4 AI calls at once!
    console.log('🚀 Starting 4 parallel parsing calls...')
    const openai = getOpenAIClient()
    
    const [
      personalInfo,
      workExperience,
      educationSkills,
      summaryExtras
    ] = await Promise.all([
      parsePersonalInfo(openai, extractedText),
      parseWorkExperience(openai, extractedText),
      parseEducationAndSkills(openai, extractedText),
      parseProfessionalSummary(openai, extractedText)
    ])
    
    console.log('✅ 4 parallel parsing calls completed:', Date.now() - startTime, 'ms')

    // STEP 4: Combine parsing results
    const parsedCV = {
      personal_info: personalInfo,
      professional_summary: summaryExtras.professional_summary || '',
      work_experience: workExperience || [],
      education: educationSkills.education || [],
      skills: educationSkills.skills || {},
      certifications: summaryExtras.certifications || [],
      languages: summaryExtras.languages || [],
      projects: summaryExtras.projects || [],
      achievements: summaryExtras.achievements || [],
      extracted_text: extractedText
    }

    // STEP 5: Save to database
    const { data: sessionData } = await supabaseAdmin
      .from('auth_cv_sessions')
      .select('auth_user_id')
      .eq('session_id', sessionId)
      .maybeSingle()

    const cvContentData = {
      session_id: sessionId,
      auth_user_id: sessionData?.auth_user_id || null,
      full_name: parsedCV.personal_info?.name || 'Unknown',
      email: parsedCV.personal_info?.email || null,
      phone: parsedCV.personal_info?.phone || null,
      location: parsedCV.personal_info?.address || null,
      linkedin_url: parsedCV.personal_info?.linkedin || null,
      website_url: parsedCV.personal_info?.website || null,
      professional_summary: parsedCV.professional_summary || null,
      work_experience: parsedCV.work_experience || [],
      education: parsedCV.education || [],
      skills: parsedCV.skills || {},
      certifications: parsedCV.certifications || [],
      languages: parsedCV.languages || [],
      projects: parsedCV.projects || [],
      achievements: parsedCV.achievements || [],
      extracted_from_file: fileName,
      extraction_method: 'parallel_ai'
    }

    // Parallel DB saves - just session and content
    await Promise.all([
      supabaseAdmin.from('auth_cv_sessions').update({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString()
      }).eq('session_id', sessionId),
      
      supabaseAdmin.from('cv_content').insert(cvContentData)
    ])

    const totalTime = Date.now() - startTime
    console.log('🎉 CV PARSED in', totalTime, 'ms')

    return NextResponse.json({
      success: true,
      file_name: fileName,
      file_path: filePath,
      extraction_result: parsedCV,
      extracted_content: true,
      timing: {
        total_ms: totalTime,
        total_seconds: Math.round(totalTime / 1000),
        parallel_calls: 4
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timing: { total_ms: Date.now() - startTime }
    }, { status: 500 })
  }
}
