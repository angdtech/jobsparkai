import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const { sessionId, extractedText } = await request.json()

    if (!sessionId || !extractedText) {
      return NextResponse.json({ error: 'Session ID and extracted text are required' }, { status: 400 })
    }

    // Create the prompt for OpenAI to extract structured data AND layout information
    const prompt = `
You are a professional CV data extractor. Extract both content AND layout structure from the following CV text and return it as JSON.

IMPORTANT: Return ONLY valid JSON, no additional text or explanations.

The JSON should have this exact structure:
{
  "full_name": "string",
  "email": "string", 
  "phone": "string",
  "location": "string",
  "linkedin_url": "string",
  "website_url": "string",
  "professional_summary": "string",
  "work_experience": [
    {
      "title": "string",
      "company": "string", 
      "location": "string",
      "start_date": "string",
      "end_date": "string", 
      "description": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "school": "string",
      "location": "string", 
      "start_date": "string",
      "end_date": "string",
      "description": "string"
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "string",
      "level": 80
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string", 
      "date": "string",
      "expiry_date": "string"
    }
  ],
  "languages": [
    {
      "name": "string",
      "proficiency": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "date": "string"
    }
  ],
  "layout_structure": {
    "overall_layout": "single_column|two_column|multi_column",
    "header_style": "centered|left_aligned|right_aligned|split",
    "header_has_photo": true/false,
    "sections_order": ["header", "summary", "experience", "education", "skills"],
    "color_scheme": {
      "primary_color": "#color_hex_or_description",
      "accent_color": "#color_hex_or_description",
      "text_color": "#color_hex_or_description"
    },
    "typography": {
      "name_style": "large_bold|small_caps|underlined|colored",
      "section_headers": "bold_underlined|colored|uppercase|bordered",
      "body_text": "justified|left_aligned|bullet_points"
    },
    "spacing": {
      "section_gaps": "tight|normal|spacious",
      "line_spacing": "compact|normal|loose"
    },
    "distinctive_features": ["underlined_headers", "colored_accents", "bullet_points", "italicized_summary", "date_right_aligned", "company_emphasis"]
  }
}

Extract data from this CV text:

${extractedText}
`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a professional CV data extraction assistant. Extract structured data from CV text and return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const extractedDataText = completion.choices[0]?.message?.content
    if (!extractedDataText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let extractedData
    try {
      extractedData = JSON.parse(extractedDataText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', extractedDataText)
      throw new Error('Invalid JSON response from OpenAI')
    }

    // Save extracted data to database
    const { data: cvContent, error: insertError } = await supabaseAdmin
      .from('cv_content_nw')
      .insert({
        session_id: sessionId,
        auth_user_id: null, // Will be updated if user is authenticated
        full_name: extractedData.full_name || null,
        email: extractedData.email || null,
        phone: extractedData.phone || null,
        location: extractedData.location || null,
        linkedin_url: extractedData.linkedin_url || null,
        website_url: extractedData.website_url || null,
        professional_summary: extractedData.professional_summary || null,
        work_experience: extractedData.work_experience || [],
        education: extractedData.education || [],
        skills: extractedData.skills || [],
        certifications: extractedData.certifications || [],
        languages: extractedData.languages || [],
        projects: extractedData.projects || [],
        achievements: extractedData.achievements || [], // This field exists in schema
        extraction_method: 'openai',
        extracted_from_file: sessionId
        // Note: auth_user_id will be null for anonymous sessions
        // created_at and updated_at will be auto-set by database defaults
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error('Failed to save extracted data')
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      cvContentId: cvContent.id
    })

  } catch (error) {
    console.error('CV data extraction error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract CV data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}