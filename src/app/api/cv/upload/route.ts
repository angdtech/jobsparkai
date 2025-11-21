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

// Enhanced text extraction function - returns array of page texts for parallel processing
async function extractTextFromFile(filePath: string, fileName: string): Promise<{fullText: string, pages: string[]}> {
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
        version: 'v1.10.1',
        // Get page text separately for parallel processing
        pagerender: async (pageData) => {
          const renderOptions = {
            normalizeWhitespace: false,
            disableCombineTextItems: false
          }
          return pageData.getTextContent(renderOptions).then((textContent) => {
            return textContent.items.map((item: any) => item.str).join(' ')
          })
        }
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
      
      // Split full text by page breaks (pdf-parse uses form feed character)
      const pages = pdfData.text.split('\f').filter(p => p.trim().length > 0)
      
      console.log('📄 Extracted', pages.length, 'pages from PDF')
      
      return { fullText: pdfData.text, pages }
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
      
      const text = rawResult.value
      // Split into "pages" - roughly 2000 chars per page
      const pages = []
      const charsPerPage = 2000
      for (let i = 0; i < text.length; i += charsPerPage) {
        pages.push(text.substring(i, i + charsPerPage))
      }
      
      return { fullText: text, pages }
    }
    else if (fileExtension === '.txt') {
      const fsPromises = require('fs').promises
      const content = await fsPromises.readFile(filePath, 'utf-8')
      
      console.log('📄 TXT extraction results:', {
        textLength: content.length,
        sample: content.substring(0, 200) + '...'
      })
      
      // Split into "pages" - roughly 2000 chars per page
      const pages = []
      const charsPerPage = 2000
      for (let i = 0; i < content.length; i += charsPerPage) {
        pages.push(content.substring(i, i + charsPerPage))
      }
      
      return { fullText: content, pages }
    }
    else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text: ${error.message}`)
  }
}

// Fast single-prompt AI parsing (use 3-stage for better accuracy if needed)
async function parseCV(extractedText: string, pages: string[], sessionId: string) {
  console.log('🤖 Starting FAST single-prompt AI parsing for speed')
  
  const path = await import('path')
  const { writeFile } = await import('fs/promises')
  const outputPath = path.join(process.cwd(), 'public', `raw-cv-text-${sessionId}.txt`)
  await writeFile(outputPath, extractedText, 'utf-8')
  console.log('📝 Raw CV text saved to:', outputPath)
  
  // Use fast fallback parser for speed (3-stage commented out below)
  return await parseCVFallback(extractedText, sessionId)
}

// 3-STAGE VERSION (commented out for speed - uncomment if you need better accuracy)
async function parseCV_3Stage(extractedText: string, pages: string[], sessionId: string) {
  console.log('🤖 Starting 3-STAGE CHAINED PROMPT AI parsing')
  
  const path = await import('path')
  const { writeFile } = await import('fs/promises')
  const outputPath = path.join(process.cwd(), 'public', `raw-cv-text-${sessionId}.txt`)
  await writeFile(outputPath, extractedText, 'utf-8')
  console.log('📝 Raw CV text saved to:', outputPath)
  
  const openai = getOpenAIClient()
  const totalStart = Date.now()
  
  try {
    // STAGE 1: Extract exact section headings
    console.log('⚡ Stage 1: Extracting exact section headings...')
    const stage1Start = Date.now()
    
    const stage1Response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a CV expert. Extract section headings exactly as they appear in the CV.' },
        { role: 'user', content: `Scan this CV and extract the EXACT section headings as they appear.

CV Text:
${extractedText}

Return the headings EXACTLY as written (preserve caps, spacing, punctuation).

Return ONLY valid JSON:
{
  "headings": [
    {"type": "personal_info", "heading": "name from top of CV"},
    {"type": "summary", "heading": "SUMMARY or PROFILE heading"},
    {"type": "achievements", "heading": "KEY ACHIEVEMENTS heading"},
    {"type": "experience", "heading": "PROFESSIONAL EXPERIENCE heading"},
    {"type": "education", "heading": "EDUCATION heading"},
    {"type": "skills", "heading": "SKILLS heading"}
  ]
}` }
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
      service_tier: 'default'
    })
    
    const stage1Time = Date.now() - stage1Start
    const headingsData = JSON.parse(stage1Response.choices[0].message.content || '{}')
    console.log(`✅ Stage 1 completed in ${stage1Time}ms`)
    console.log(`📊 Found headings:`, headingsData.headings?.map((h: any) => h.heading))
    
    // Save headings
    await writeFile(
      path.join(process.cwd(), 'public', `stage1-headings-${sessionId}.json`),
      JSON.stringify(headingsData, null, 2),
      'utf-8'
    )
    
    // STAGE 2: Extract raw text for each section (parallel)
    console.log('⚡ Stage 2: Extracting raw text for each section in parallel...')
    const stage2Start = Date.now()
    
    const stage2Promises = (headingsData.headings || []).map((heading: any) => {
      return openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'Extract exact text under the specified heading.' },
          { role: 'user', content: `Extract ALL text under the heading "${heading.heading}" in this CV.

CV Text:
${extractedText}

Return ONLY the exact text under this heading, up to the next heading. Do not summarize.

Return ONLY valid JSON:
{
  "section_type": "${heading.type}",
  "heading": "${heading.heading}",
  "raw_text": "exact text here"
}` }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
        service_tier: 'default'
      }).then(response => JSON.parse(response.choices[0].message.content || '{}'))
    })
    
    const stage2Results = await Promise.allSettled(stage2Promises)
    const stage2Time = Date.now() - stage2Start
    console.log(`✅ Stage 2 completed in ${stage2Time}ms`)
    
    // Collect raw text sections
    const rawSections: any[] = []
    for (const result of stage2Results) {
      if (result.status === 'fulfilled') {
        rawSections.push(result.value)
        const textLength = result.value.raw_text?.length || 0
        console.log(`✅ Extracted raw text for: ${result.value.heading} (${textLength} chars)`)
        if (result.value.section_type === 'experience') {
          console.log(`📝 EXPERIENCE RAW TEXT PREVIEW (first 500 chars):`, result.value.raw_text?.substring(0, 500))
        }
      }
    }
    
    // Save raw sections
    await writeFile(
      path.join(process.cwd(), 'public', `stage2-raw-sections-${sessionId}.json`),
      JSON.stringify(rawSections, null, 2),
      'utf-8'
    )
    
    // STAGE 3: Parse raw text into structured format (parallel)
    console.log('⚡ Stage 3: Parsing raw text into structured format in parallel...')
    const stage3Start = Date.now()
    
    const stage3Promises = rawSections.map((section) => {
      let parsePrompt = ''
      
      if (section.section_type === 'personal_info') {
        parsePrompt = `Parse personal information from this heading and text:

Heading: ${section.heading}
Text: ${section.raw_text}

Extract the name from the heading. The heading often contains "NAME, CREDENTIALS | Tagline".
Extract the tagline (professional title) from after the "|" symbol in the heading if present.
Extract contact details (email, phone, linkedin, etc.) from the text.

Return ONLY valid JSON:
{"name": "", "email": "", "phone": "", "address": "", "linkedin": "", "website": "", "tagline": ""}`
      } else if (section.section_type === 'summary') {
        parsePrompt = `Parse this summary text:

${section.raw_text}

Return ONLY valid JSON:
{"professional_summary": "text here"}`
      } else if (section.section_type === 'achievements') {
        parsePrompt = `Parse ALL achievements from this text into an array. Each achievement is a separate statement.

Text:
${section.raw_text}

Split this into individual achievements. Look for natural sentence boundaries or topic changes.

Return ONLY valid JSON:
{"key_achievements": ["achievement 1", "achievement 2", "achievement 3", "achievement 4"]}`
      } else if (section.section_type === 'experience') {
        parsePrompt = `Parse EVERY SINGLE job/position from this work experience section. DO NOT SKIP ANY JOBS, even brief ones.

Text:
${section.raw_text}

Extract ALL jobs chronologically. Each job should have:
- title (job position)
- company (company/organization name)
- start_date and end_date (dates as written)
- description_items (array of responsibilities/achievements for that role)

IMPORTANT: Return ALL jobs found, not just recent ones. Include every position mentioned.

Return ONLY valid JSON:
{"work_experience": [{"title": "", "company": "", "start_date": "", "end_date": "", "description_items": []}]}`
      } else if (section.section_type === 'education') {
        parsePrompt = `Parse ALL education from this text:

${section.raw_text}

Return ONLY valid JSON:
{"education": [{"degree": "", "institution": "", "start_date": "", "end_date": "", "description": ""}]}`
      } else if (section.section_type === 'skills') {
        parsePrompt = `Parse ONLY skills explicitly listed (DO NOT invent):

${section.raw_text}

Return ONLY valid JSON:
{"skills": [{"name": "", "level": 80}]}`
      } else {
        return Promise.resolve({ section_type: section.section_type, data: {} })
      }
      
      return openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'Parse CV section into structured JSON. Return only valid JSON.' },
          { role: 'user', content: parsePrompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
        service_tier: 'default'
      }).then(response => ({
        section_type: section.section_type,
        data: JSON.parse(response.choices[0].message.content || '{}')
      }))
    })
    
    const stage3Results = await Promise.allSettled(stage3Promises)
    const stage3Time = Date.now() - stage3Start
    console.log(`✅ Stage 3 completed in ${stage3Time}ms`)
    
    // Merge all parsed results
    let mergedData: any = {
      personal_info: {},
      professional_summary: '',
      key_achievements: [],
      work_experience: [],
      education: [],
      skills: [],
      extracted_text: extractedText
    }
    
    for (const result of stage3Results) {
      if (result.status === 'fulfilled') {
        const { section_type, data } = result.value
        console.log(`✅ Parsed section: ${section_type}`)
        
        if (section_type === 'personal_info') {
          mergedData.personal_info = data
        } else if (section_type === 'summary') {
          mergedData.professional_summary = data.professional_summary || ''
        } else if (section_type === 'achievements') {
          mergedData.key_achievements = data.key_achievements || []
        } else if (section_type === 'experience') {
          mergedData.work_experience = data.work_experience || []
        } else if (section_type === 'education') {
          mergedData.education = data.education || []
        } else if (section_type === 'skills') {
          mergedData.skills = data.skills || []
        }
      }
    }
    
    const totalTime = Date.now() - totalStart
    console.log(`🎉 Total processing time: ${totalTime}ms (Stage 1: ${stage1Time}ms, Stage 2: ${stage2Time}ms, Stage 3: ${stage3Time}ms)`)
    console.log(`📊 Final totals:`, {
      name: mergedData.personal_info?.name || 'Unknown',
      jobs: mergedData.work_experience?.length || 0,
      skills: mergedData.skills?.length || 0,
      achievements: mergedData.key_achievements?.length || 0,
      education: mergedData.education?.length || 0
    })
    
    console.log('📋 DETAILED EXTRACTION RESULTS:')
    console.log('👤 Personal Info:', JSON.stringify(mergedData.personal_info, null, 2))
    console.log('💼 Work Experience (count: ' + (mergedData.work_experience?.length || 0) + '):', JSON.stringify(mergedData.work_experience, null, 2))
    console.log('🎓 Education:', JSON.stringify(mergedData.education, null, 2))
    console.log('🏆 Achievements:', JSON.stringify(mergedData.key_achievements, null, 2))
    console.log('🔧 Skills:', JSON.stringify(mergedData.skills, null, 2))
    
    return mergedData
    
  } catch (error) {
    console.error('❌ 3-stage parsing failed:', error)
    console.error('Falling back to gpt-4.1-mini single prompt...')
    return await parseCVFallback(extractedText, sessionId)
  }
}

/* OLD 3-Stage version (keeping for reference)
async function parseCVOld(extractedText: string, pages: string[], sessionId: string) {
  console.log('🤖 Starting 3-STAGE CHAINED PROMPT AI parsing')
  console.log('⚡ Stage 1: Extracting exact section headings from CV...')
  
  const path = await import('path')
  const { writeFile } = await import('fs/promises')
  const outputPath = path.join(process.cwd(), 'public', `raw-cv-text-${sessionId}.txt`)
  await writeFile(outputPath, extractedText, 'utf-8')
  console.log('📝 Raw CV text saved to:', outputPath)
  
  const openai = getOpenAIClient()
  const totalStart = Date.now()
  const stage1Start = Date.now()
  
  // STAGE 1: Extract exact section headings as they appear in the CV
  const headingsPrompt = `You are a CV/resume expert. Scan this CV and extract the EXACT section headings as they appear in the document.

CV Text:
${extractedText}

Return the section headings EXACTLY as written in the CV (preserve capitalization, spacing, punctuation).

Common sections to look for:
- Name and contact details (top of CV)
- Summary/Profile/About section
- Key achievements/highlights/accomplishments
- Professional experience/work history/employment
- Education/qualifications
- Skills/technical skills/competencies

Return ONLY valid JSON:
{
  "headings": [
    {"type": "personal_info", "heading": "ANGELINA MENCHON DYER, MSC"},
    {"type": "summary", "heading": "SUMMARY"},
    {"type": "achievements", "heading": "KEY ACHIEVEMENTS"},
    {"type": "experience", "heading": "PROFESSIONAL EXPERIENCE"},
    {"type": "education", "heading": "EDUCATION"},
    {"type": "skills", "heading": "SKILLS"}
  ]
}`

  try {
    const headingsResponse = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a CV expert. Extract section headings exactly as they appear.' },
        { role: 'user', content: headingsPrompt }
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
      service_tier: 'default'
    })
    
    const stage1Time = Date.now() - stage1Start
    console.log(`✅ Stage 1 completed in ${stage1Time}ms`)
    
    let headingsContent = headingsResponse.choices[0].message.content?.trim() || '{}'
    const headingsData = JSON.parse(headingsContent)
    
    console.log(`📊 Found ${headingsData.headings?.length || 0} section headings:`, headingsData.headings?.map((h: any) => h.heading))
    
    // Save headings for debugging
    const headingsPath = path.join(process.cwd(), 'public', `headings-${sessionId}.json`)
    await writeFile(headingsPath, JSON.stringify(headingsData, null, 2), 'utf-8')
    
    // STAGE 2: Extract raw text for each section in parallel
    console.log('⚡ Stage 2: Extracting raw text for each section in parallel...')
    const stage2Start = Date.now()
    
    const textExtractionPromises = (headingsData.headings || []).map((heading: any) => {
      const extractPrompt = `Extract ALL text that appears under the heading "${heading.heading}" in this CV.

CV Text:
${extractedText}

Return ONLY the exact text that appears under this heading, up until the next section heading starts. Include everything - do not summarize or skip any content.

Return ONLY valid JSON:
{
  "section_type": "${heading.type}",
  "heading": "${heading.heading}",
  "raw_text": "...all text under this heading..."
}`
      
      let extractPrompt = ''
      
      if (section.name === 'personal_info') {
        extractPrompt = `Extract personal information from this CV section. Return ONLY valid JSON:
${sectionText}

Format:
{"name": "", "email": "", "phone": "", "address": "", "linkedin": "", "website": "", "tagline": ""}`
      } else if (section.name === 'summary') {
        extractPrompt = `Extract the professional summary from this CV section. Return ONLY valid JSON:
${sectionText}

Format:
{"professional_summary": ""}`
      } else if (section.name === 'key_achievements') {
        extractPrompt = `Extract ALL key achievements from this CV section. Return ONLY valid JSON:
${sectionText}

Format:
{"key_achievements": ["achievement 1", "achievement 2"]}`
      } else if (section.name === 'work_experience') {
        extractPrompt = `Extract ALL work experience from this CV section. Return ONLY valid JSON:
${sectionText}

Format:
{"work_experience": [{"title": "", "company": "", "start_date": "", "end_date": "", "description_items": []}]}`
      } else if (section.name === 'education') {
        extractPrompt = `Extract ALL education from this CV section. Return ONLY valid JSON:
${sectionText}

Format:
{"education": [{"degree": "", "institution": "", "start_date": "", "end_date": "", "description": ""}]}`
      } else if (section.name === 'skills') {
        extractPrompt = `Extract ONLY skills explicitly listed in this CV section. DO NOT invent skills. Return ONLY valid JSON:
${sectionText}

Format:
{"skills": [{"name": "", "level": 80}]}`
      } else {
        return Promise.resolve({ section: section.name, data: {} })
      }
      
      return openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Extract data from CV section. Return only valid JSON.' },
          { role: 'user', content: extractPrompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
        service_tier: 'priority'
      }).then(response => ({
        section: section.name,
        data: JSON.parse(response.choices[0].message.content || '{}')
      }))
    })
    
    const extractionResults = await Promise.allSettled(extractionPromises)
    const stage2Time = Date.now() - stage2Start
    console.log(`✅ Stage 2 completed in ${stage2Time}ms`)
    
    // Merge all extraction results
    let mergedData: any = {
      personal_info: {},
      professional_summary: '',
      key_achievements: [],
      work_experience: [],
      education: [],
      skills: [],
      extracted_text: extractedText
    }
    
    // Process each section extraction result
    for (let i = 0; i < extractionResults.length; i++) {
      const result = extractionResults[i]
      
      if (result.status === 'fulfilled') {
        const { section, data } = result.value
        console.log(`✅ Section '${section}' extracted successfully`)
        
        // Merge data based on section type
        if (section === 'personal_info' && data.name) {
          mergedData.personal_info = data
        } else if (section === 'summary' && data.professional_summary) {
          mergedData.professional_summary = data.professional_summary
        } else if (section === 'key_achievements' && data.key_achievements) {
          mergedData.key_achievements = data.key_achievements
        } else if (section === 'work_experience' && data.work_experience) {
          mergedData.work_experience = data.work_experience
        } else if (section === 'education' && data.education) {
          mergedData.education = data.education
        } else if (section === 'skills' && data.skills) {
          mergedData.skills = data.skills
        }
      } else {
        console.error(`Section extraction failed:`, result.reason)
      }
    }
    
    const totalTime = Date.now() - totalStart
    const stats = {
      name: mergedData.personal_info?.name || 'Unknown',
      jobs: mergedData.work_experience?.length || 0,
      skills: mergedData.skills?.length || 0,
      achievements: mergedData.key_achievements?.length || 0,
      education: mergedData.education?.length || 0
    }
    log('AI parsing completed', { totalTime, stage1Time, stage2Time, ...stats })
    console.log(`🎉 Total processing time: ${totalTime}ms (Stage 1: ${stage1Time}ms, Stage 2: ${stage2Time}ms)`)
    console.log(`📊 Final totals:`, stats)
    
    return mergedData
    
  } catch (error) {
    console.error('❌ 2-stage parsing failed:', error)
    console.error('Falling back to gpt-4.1-mini...')
    
    // Fallback to gpt-4.1-mini if nano fails
    return await parseCVFallback(extractedText, sessionId)
  }
}
*/

// Fallback function using gpt-4.1-mini for more reliable parsing
async function parseCVFallback(extractedText: string, sessionId: string) {
  console.log('🔄 Using fallback parser with gpt-4.1-mini')
  const openai = getOpenAIClient()
  const path = await import('path')
  const { writeFile } = await import('fs/promises')
  
  const fallbackPrompt = `Extract ALL data from this CV. Return ONLY valid JSON:

${extractedText}

Format:
{
  "personal_info": {"name": "", "email": "", "phone": "", "address": "", "linkedin": "", "website": "", "tagline": ""},
  "professional_summary": "",
  "key_achievements": [],
  "work_experience": [{"title": "", "company": "", "start_date": "", "end_date": "", "description_items": []}],
  "education": [{"degree": "", "institution": "", "start_date": "", "end_date": "", "description": ""}],
  "skills": [{"name": "", "level": 80}]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'Extract ALL CV data. DO NOT invent skills. Return only valid JSON.' },
      { role: 'user', content: fallbackPrompt }
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    service_tier: 'default'
  })
  
  const content = response.choices[0].message.content || '{}'
  const data = JSON.parse(content)
  
  // Save fallback response
  const fallbackPath = path.join(process.cwd(), 'public', `fallback-${sessionId}.json`)
  await writeFile(fallbackPath, JSON.stringify(data, null, 2), 'utf-8')
  
  data.extracted_text = extractedText
  return data
}

/* OLD SINGLE-REQUEST CODE - KEEPING FOR REFERENCE
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
  */

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
      const extraction = await extractTextFromFile(filePath, file.name)
      extractedText = extraction.fullText
      const pages = extraction.pages
      
      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the file')
      }
      
      console.log('✅ Text extracted successfully, length:', extractedText.length, 'pages:', pages.length)
      
      // Step 2: Parse extracted text with AI IN PARALLEL BY PAGE
      console.log('🤖 Parsing CV data with AI in parallel...')
      console.log('📏 Input text length:', extractedText.length)
      console.log('📄 Pages to process:', pages.length)
      console.log('📝 First 200 chars:', extractedText.substring(0, 200))
      
      const extractionResult = await parseCV(extractedText, pages, sessionId)
      
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
          tagline: extractionResult.personal_info?.tagline || null,
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