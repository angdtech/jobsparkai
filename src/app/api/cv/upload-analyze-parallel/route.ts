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
  const prompt = `Extract personal/contact information from this CV. Return JSON:
{
  "name": "Actual Name from CV",
  "email": null,
  "phone": null,
  "address": null,
  "linkedin": null,
  "website": null,
  "tagline": "Actual tagline if present"
}

CRITICAL: If a field is NOT found in the CV, set it to null. Do NOT make up placeholder values like "email@example.com" or "phone number". Use null instead.

CV Text:
${cvText.substring(0, 2000)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract personal info from CV. If field not found, use null - never use placeholder values. Return ONLY JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    service_tier: 'priority'
  })
  
  let content = response.choices[0].message.content || '{}'
  // Remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    const parsed = JSON.parse(content)
    console.log('✅ Personal Info parsed:', JSON.stringify(parsed, null, 2))
    return parsed
  } catch (error) {
    console.error('❌ Failed to parse personal info JSON:', error)
    console.error('Raw content:', content.substring(0, 500))
    // Return minimal valid object on parse failure
    return { name: 'Unknown', email: null, phone: null, address: null }
  }
}

async function parseWorkExperience(openai: OpenAI, cvText: string) {
  const prompt = `Extract work experience from this CV. Return JSON with work_experience array:
{
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "start_date": "MM/YYYY",
      "end_date": "MM/YYYY",
      "description_items": ["Bullet 1 EXACTLY as written", "Bullet 2 EXACTLY as written"]
    }
  ]
}

RULES:
1. Copy ALL bullet points EXACTLY word-for-word from CV
2. Do NOT summarize or paraphrase
3. RETURN ONLY THE JSON - no explanations

CV Text:
${cvText}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You extract work experience EXACTLY as written. Copy bullet points word-for-word. Return ONLY JSON, no explanations.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    service_tier: 'priority'
  })
  
  let content = response.choices[0].message.content || '[]'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    const parsed = JSON.parse(content)
    
    // Handle both array format and object format
    let workExperience = []
    if (Array.isArray(parsed)) {
      workExperience = parsed
    } else if (parsed.work_experience && Array.isArray(parsed.work_experience)) {
      workExperience = parsed.work_experience
    }
    
    console.log(`✅ Work Experience parsed: ${workExperience.length} jobs`)
    workExperience.forEach((job: any, i: number) => {
      console.log(`  ${i+1}. ${job.company} - ${job.title} (${job.description_items?.length || 0} bullets)`)
    })
    return workExperience
  } catch (error) {
    console.error('❌ Failed to parse work experience JSON:', error)
    console.error('Raw content (first 500 chars):', content.substring(0, 500))
    console.error('Raw content (last 500 chars):', content.substring(content.length - 500))
    // Return empty array on parse failure
    return []
  }
}

async function parseEducationAndSkills(openai: OpenAI, cvText: string) {
  const prompt = `Extract education and skills from this CV. Return JSON:
{
  "education": [{"degree": "Degree", "institution": "School", "start_date": "YYYY", "end_date": "YYYY", "description": ""}],
  "skills": [{"name": "Skill", "level": 85}]
}

RULES:
1. Extract ALL skills from CV (technical, tools, frameworks, soft skills)
2. List ONLY skills explicitly mentioned
3. RETURN ONLY JSON - no explanations

CV Text:
${cvText}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract education and skills from CV. Return ONLY JSON, no extra text.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    service_tier: 'priority'
  })
  
  let content = response.choices[0].message.content || '{}'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    const parsed = JSON.parse(content)
    
    // Handle both old categorized format and new flat array format
    let skillsArray = []
    if (Array.isArray(parsed.skills)) {
      skillsArray = parsed.skills
    } else if (parsed.skills && typeof parsed.skills === 'object') {
      // Convert categorized skills to flat array
      Object.values(parsed.skills).forEach((category: any) => {
        if (Array.isArray(category)) {
          skillsArray.push(...category)
        }
      })
    }
    
    console.log(`✅ Education & Skills parsed:`)
    console.log(`   Education: ${parsed.education?.length || 0} entries`)
    console.log(`   Skills: ${skillsArray.length} total (${skillsArray.slice(0, 10).map((s: any) => s.name).join(', ')}...)`)
    
    return { education: parsed.education || [], skills: skillsArray }
  } catch (error) {
    console.error('❌ Failed to parse education/skills JSON:', error)
    console.error('Raw content:', content.substring(0, 500))
    return { education: [], skills: [] }
  }
}

async function parseProfessionalSummary(openai: OpenAI, cvText: string) {
  const prompt = `Extract summary and additional sections from CV. Return JSON:
{
  "professional_summary": "Summary text as written",
  "certifications": [{"name": "Cert", "issuer": "Issuer", "date": "Date"}],
  "languages": [{"name": "Language", "proficiency": "Level"}],
  "projects": [{"name": "Project", "description": "Details"}],
  "achievements": ["Achievement 1", "Achievement 2"]
}

ACHIEVEMENTS RULES:
1. Look for "Achievements"/"Accomplishments"/"Highlights" sections first
2. If no section, extract quantifiable achievements from work experience (revenue, %, savings)
3. Copy EXACTLY as written
4. RETURN ONLY JSON - no explanations

CV Text:
${cvText}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract summary, achievements, certifications from CV. Return ONLY JSON, no extra text.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
    response_format: { type: "json_object" },
    service_tier: 'priority'
  })
  
  let content = response.choices[0].message.content || '{}'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    const parsed = JSON.parse(content)
    console.log(`✅ Summary & Extras parsed:`)
    console.log(`   Summary length: ${parsed.professional_summary?.length || 0} chars`)
    console.log(`   Certifications: ${parsed.certifications?.length || 0}`)
    console.log(`   Languages: ${parsed.languages?.length || 0}`)
    console.log(`   Projects: ${parsed.projects?.length || 0}`)
    console.log(`   Achievements: ${parsed.achievements?.length || 0}`)
    if (parsed.achievements?.length > 0) {
      console.log(`   📊 Achievements found:`)
      parsed.achievements.forEach((ach: string, i: number) => {
        console.log(`      ${i+1}. ${ach.substring(0, 80)}...`)
      })
    }
    return parsed
  } catch (error) {
    console.error('❌ Failed to parse summary JSON:', error)
    console.error('Raw content:', content.substring(0, 500))
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
      skills: educationSkills.skills || [],
      certifications: summaryExtras.certifications || [],
      languages: summaryExtras.languages || [],
      projects: summaryExtras.projects || [],
      achievements: summaryExtras.achievements || [],
      extracted_text: extractedText
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 FINAL COMBINED RESULTS')
    console.log('='.repeat(80))
    console.log('Personal Info:', JSON.stringify(parsedCV.personal_info, null, 2))
    console.log('Summary:', parsedCV.professional_summary?.substring(0, 100) + '...')
    console.log(`Work Experience: ${parsedCV.work_experience.length} jobs`)
    console.log(`Education: ${parsedCV.education.length} entries`)
    console.log(`Skills: ${parsedCV.skills.length} total`)
    console.log(`Certifications: ${parsedCV.certifications.length}`)
    console.log(`Languages: ${parsedCV.languages.length}`)
    console.log(`Projects: ${parsedCV.projects.length}`)
    console.log(`Achievements: ${parsedCV.achievements.length}`)
    console.log('='.repeat(80) + '\n')

    // STEP 5: Clean AI-generated placeholder values from personal info
    const cleanField = (value: string | null | undefined): string | null => {
      if (!value) return null
      const lower = value.toLowerCase().trim()
      // Remove AI-generated placeholders
      if (lower.includes('email@example') || lower.includes('your.email') || lower === 'email') return null
      if (lower === 'phone number' || lower === 'phone' || lower.includes('+1 (555)') || lower.includes('555-')) return null
      if (lower === 'location' || lower === 'your city' || lower === 'address') return null
      if (lower === 'linkedin url' || lower === 'url' || lower === 'linkedin.com/in/yourprofile') return null
      if (lower === 'website url' || lower === 'your-website.com') return null
      return value
    }
    
    const cleanedPersonalInfo = {
      name: parsedCV.personal_info?.name || 'Unknown',
      email: cleanField(parsedCV.personal_info?.email),
      phone: cleanField(parsedCV.personal_info?.phone),
      address: cleanField(parsedCV.personal_info?.address),
      linkedin: cleanField(parsedCV.personal_info?.linkedin),
      website: cleanField(parsedCV.personal_info?.website),
      tagline: parsedCV.personal_info?.tagline || null
    }
    
    console.log('🧹 Cleaned Personal Info:', JSON.stringify(cleanedPersonalInfo, null, 2))

    // STEP 6: Save to database
    const { data: sessionData } = await supabaseAdmin
      .from('auth_cv_sessions')
      .select('auth_user_id')
      .eq('session_id', sessionId)
      .maybeSingle()

    const cvContentData = {
      session_id: sessionId,
      auth_user_id: sessionData?.auth_user_id || null,
      full_name: cleanedPersonalInfo.name,
      email: cleanedPersonalInfo.email,
      phone: cleanedPersonalInfo.phone,
      location: cleanedPersonalInfo.address,
      linkedin_url: cleanedPersonalInfo.linkedin,
      website_url: cleanedPersonalInfo.website,
      tagline: cleanedPersonalInfo.tagline,
      professional_summary: parsedCV.professional_summary || null,
      work_experience: parsedCV.work_experience || [],
      education: parsedCV.education || [],
      skills: parsedCV.skills || [],
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
