import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  try {
    if (fileExtension === '.pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const pdfData = await pdfParse(buffer, { max: 0 })
      return pdfData.text
    } 
    else if (fileExtension === '.docx') {
      const mammoth = await import('mammoth')
      const rawResult = await mammoth.extractRawText({ buffer })
      return rawResult.value
    }
    else if (fileExtension === '.txt') {
      return buffer.toString('utf-8')
    }
    else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error: any) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text: ${error.message}`)
  }
}

// Extract work experience section text from CV
function extractWorkExperienceText(cvText: string): string {
  // Try to find work experience section
  const lines = cvText.split('\n')
  let startIdx = -1
  let endIdx = lines.length
  
  // Find where work experience starts
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim()
    if (line.includes('work') && (line.includes('experience') || line.includes('history') || line.includes('employment'))) {
      startIdx = i + 1
      console.log(`📍 Found work experience start at line ${i}: "${lines[i]}"`)
      break
    }
    if (line.match(/^(experience|employment|professional history)$/i)) {
      startIdx = i + 1
      console.log(`📍 Found work experience start at line ${i}: "${lines[i]}"`)
      break
    }
  }
  
  // Find where work experience ends (next major section)
  if (startIdx >= 0) {
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim()
      if (line.match(/^(education|skills|certifications|qualifications|training|projects|languages|references|interests|hobbies)$/i)) {
        endIdx = i
        console.log(`📍 Found work experience end at line ${i}: "${lines[i]}"`)
        break
      }
    }
  }
  
  // If we found the section, extract it
  if (startIdx >= 0) {
    const workExpLines = lines.slice(startIdx, endIdx)
    console.log(`📍 Extracted ${workExpLines.length} lines of work experience (from line ${startIdx} to ${endIdx})`)
    return workExpLines.join('\n')
  }
  
  // Fallback: return entire CV text if we can't find the section
  console.log('⚠️ Could not find work experience section, using entire CV text')
  return cvText
}

// Split work experience text into individual jobs
function splitWorkExperienceJobs(workExpText: string): string[] {
  const jobs: string[] = []
  const lines = workExpText.split('\n')
  let currentJob: string[] = []
  
  console.log(`\n🔍 Splitting ${lines.length} lines into individual jobs...`)
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) continue // Skip empty lines
    
    // Detect job headers by looking for date patterns like "February 2018 - Present" or "2018-2020"
    const hasDateRange = /\d{4}\s*-\s*(present|current|\d{4})|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(line)
    
    // Also look for company/role patterns with colons or "at"
    const hasCompanyPattern = /[A-Z][a-z]+.*(?::|at)\s*[A-Z]/.test(line)
    
    const isJobHeader = hasDateRange || hasCompanyPattern
    
    // If this looks like a new job header and we have content, save current job
    if (isJobHeader && currentJob.length > 0) {
      const jobText = currentJob.join('\n')
      console.log(`  ✓ Saved job (${currentJob.length} lines, ${jobText.length} chars)`)
      jobs.push(jobText)
      currentJob = [line]
    } else {
      currentJob.push(line)
    }
  }
  
  // Don't forget the last job
  if (currentJob.length > 0) {
    const jobText = currentJob.join('\n')
    console.log(`  ✓ Saved final job (${currentJob.length} lines, ${jobText.length} chars)`)
    jobs.push(jobText)
  }
  
  console.log(`\n📊 Split into ${jobs.length} jobs`)
  return jobs.filter(job => job.length > 50) // Filter out tiny fragments
}

async function parsePersonalInfo(openai: OpenAI, cvText: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract personal info only. Return valid JSON only.' },
      { role: 'user', content: `Extract ONLY personal/contact information from this CV. Return JSON:
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
${cvText.substring(0, 2000)}` }
    ],
    temperature: 0,
    max_tokens: 300
  })
  
  let content = response.choices[0].message.content || '{}'
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to parse personal info JSON:', error)
    return { name: 'Unknown', email: null, phone: null, address: null }
  }
}

async function parseSingleWorkExperience(openai: OpenAI, jobText: string, index: number) {
  console.log(`\n🤖 Starting AI parse for Job ${index + 1}...`)
  console.log(`📥 Input text length: ${jobText.length} chars`)
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract work experience. Include ALL bullet points. Return valid JSON only.' },
      { role: 'user', content: `Extract this single job experience. PRESERVE ALL bullet points exactly as they appear:

{
  "title": "Job Title",
  "company": "Company Name", 
  "start_date": "Start Date",
  "end_date": "End Date",
  "description_items": ["Each bullet point as separate item", "Include EVERY detail"]
}

Job Text:
${jobText}` }
    ],
    temperature: 0,
    max_tokens: 1500
  })
  
  let content = response.choices[0].message.content || '{}'
  console.log(`📤 AI Response for Job ${index + 1} length: ${content.length} chars`)
  console.log(`📤 AI Response for Job ${index + 1} preview (first 300 chars):`, content.substring(0, 300))
  
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    const parsed = JSON.parse(content)
    console.log(`✅ Successfully parsed Job ${index + 1}:`, {
      title: parsed.title,
      company: parsed.company,
      bulletCount: parsed.description_items?.length || 0
    })
    return parsed
  } catch (error: any) {
    console.error(`❌ Failed to parse work experience ${index + 1} JSON:`, error.message)
    console.error(`❌ Raw content that failed:`, content.substring(0, 500))
    return {
      title: 'Position',
      company: 'Company',
      start_date: 'Start',
      end_date: 'End',
      description_items: []
    }
  }
}

async function parseEducationAndSkills(openai: OpenAI, cvText: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract education and skills only. Return valid JSON only.' },
      { role: 'user', content: `Extract ONLY education and skills from this CV. Return JSON:
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
${cvText}` }
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
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract summary and additional sections. Return valid JSON only.' },
      { role: 'user', content: `Extract or generate a professional summary from this CV. Return JSON:
{
  "professional_summary": "Professional summary text",
  "certifications": [],
  "languages": [],
  "projects": [],
  "achievements": []
}

CV Text:
${cvText.substring(0, 3000)}` }
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
  console.log('🚀 PROGRESSIVE Upload + Parsing started:', new Date().toISOString())
  
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

    // STEP 1: Upload to Supabase Storage
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${sessionId}-${timestamp}${fileExtension}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('cv-uploads')
      .upload(`cvs/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }
    
    const filePath = uploadData.path
    console.log('✅ File uploaded to Supabase:', Date.now() - startTime, 'ms')

    // STEP 2: Extract text from buffer
    const extractedText = await extractTextFromBuffer(buffer, file.name)
    console.log('✅ Text extracted:', Date.now() - startTime, 'ms, length:', extractedText.length)

    if (!extractedText.trim() || extractedText.length < 50) {
      throw new Error('No text could be extracted from the file')
    }

    // STEP 3: Extract work experience section and split into individual jobs
    const workExpText = extractWorkExperienceText(extractedText)
    console.log('📄 Work experience section text length:', workExpText.length)
    console.log('📄 Work experience section preview (first 500 chars):', workExpText.substring(0, 500))
    
    const jobTexts = splitWorkExperienceJobs(workExpText)
    console.log(`📊 Found ${jobTexts.length} potential jobs in work experience section`)
    jobTexts.forEach((jobText, i) => {
      console.log(`\n📌 Job ${i + 1} text (first 200 chars):`, jobText.substring(0, 200))
      console.log(`📌 Job ${i + 1} full length:`, jobText.length)
    })

    // STEP 4: PARALLEL PARSING - All sections + each job separately!
    console.log(`🚀 Starting ${3 + jobTexts.length} parallel parsing calls...`)
    const openai = getOpenAIClient()
    
    const [
      personalInfo,
      educationSkills,
      summaryExtras,
      ...workExperienceJobs
    ] = await Promise.all([
      parsePersonalInfo(openai, extractedText),
      parseEducationAndSkills(openai, extractedText),
      parseProfessionalSummary(openai, extractedText),
      ...jobTexts.map((jobText, index) => parseSingleWorkExperience(openai, jobText, index))
    ])
    
    console.log(`✅ ${3 + jobTexts.length} parallel parsing calls completed:`, Date.now() - startTime, 'ms')

    // STEP 5: Combine parsing results
    console.log('\n📊 Raw parsing results:')
    console.log('  - Personal info:', personalInfo)
    console.log('  - Summary:', summaryExtras.professional_summary?.substring(0, 100))
    console.log('  - Work experience jobs array length:', workExperienceJobs.length)
    workExperienceJobs.forEach((job, i) => {
      console.log(`  - Job ${i + 1}:`, {
        title: job.title,
        company: job.company,
        hasTitle: !!job.title,
        hasCompany: !!job.company,
        descriptionItems: job.description_items?.length || 0
      })
    })
    
    const filteredJobs = workExperienceJobs.filter(job => job.title && job.company)
    console.log(`\n🔍 Filtering jobs: ${workExperienceJobs.length} total → ${filteredJobs.length} with title & company`)
    
    const parsedCV = {
      personal_info: personalInfo,
      professional_summary: summaryExtras.professional_summary || '',
      work_experience: filteredJobs,
      education: educationSkills.education || [],
      skills: educationSkills.skills || {},
      certifications: summaryExtras.certifications || [],
      languages: summaryExtras.languages || [],
      projects: summaryExtras.projects || [],
      achievements: summaryExtras.achievements || [],
      extracted_text: extractedText
    }

    console.log('\n📊 Final parsed CV summary:', {
      name: parsedCV.personal_info?.name,
      jobTextsFound: jobTexts.length,
      jobsParsed: workExperienceJobs.length,
      jobsWithData: parsedCV.work_experience.length,
      educationCount: parsedCV.education.length,
      skillsCategories: Object.keys(parsedCV.skills).length
    })

    // STEP 6: Save to database
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
      extraction_method: 'progressive_parallel'
    }

    // Parallel DB saves
    console.log('\n💾 Saving to database...')
    console.log('CV content data being saved:', {
      session_id: cvContentData.session_id,
      full_name: cvContentData.full_name,
      work_experience_count: cvContentData.work_experience.length,
      work_experience_preview: cvContentData.work_experience.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        bullets: exp.description_items?.length || 0
      }))
    })
    
    const [sessionUpdate, contentInsert] = await Promise.all([
      supabaseAdmin.from('auth_cv_sessions').update({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString()
      }).eq('session_id', sessionId),
      
      supabaseAdmin.from('cv_content').insert(cvContentData)
    ])
    
    console.log('💾 Session update result:', sessionUpdate.error || 'SUCCESS')
    console.log('💾 Content insert result:', contentInsert.error || 'SUCCESS')

    const totalTime = Date.now() - startTime
    console.log('\n🎉 CV PARSED PROGRESSIVELY in', totalTime, 'ms')
    console.log('🎉 Total jobs saved to DB:', cvContentData.work_experience.length)

    return NextResponse.json({
      success: true,
      file_name: fileName,
      file_path: filePath,
      extraction_result: parsedCV,
      extracted_content: true,
      timing: {
        total_ms: totalTime,
        total_seconds: Math.round(totalTime / 1000),
        parallel_calls: 3 + jobTexts.length,
        jobs_parsed: parsedCV.work_experience.length
      }
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timing: { total_ms: Date.now() - startTime }
    }, { status: 500 })
  }
}
