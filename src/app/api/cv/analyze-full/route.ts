import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface CVSection {
  section: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, cv_data } = await request.json()

    if (!session_id || !cv_data) {
      return NextResponse.json({ error: 'Session ID and CV data are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    console.log('Analyzing full CV for session:', session_id)

    // Structure the CV content for analysis
    const cvSections: CVSection[] = [
      {
        section: 'Professional Summary',
        content: cv_data.personalInfo?.summary || 'No summary provided'
      },
      {
        section: 'Work Experience',
        content: cv_data.experience?.map((exp: any) => 
          `${exp.position} at ${exp.company} (${exp.duration})\n${exp.description}`
        ).join('\n\n') || 'No work experience provided'
      },
      {
        section: 'Education',
        content: cv_data.education?.map((edu: any) => 
          `${edu.degree} from ${edu.school} (${edu.duration})\n${edu.description || ''}`
        ).join('\n\n') || 'No education provided'
      },
      {
        section: 'Skills',
        content: cv_data.skills?.map((skill: any) => skill.name).join(', ') || 'No skills listed'
      }
    ]

    const prompt = `
You are a CV coaching expert. Analyze this CV and identify areas for improvement. DO NOT rewrite content - only analyze and provide feedback.

CV SECTIONS:
${cvSections.map(section => `\n=== ${section.section} ===\n${section.content}`).join('\n')}

RETURN THIS EXACT JSON STRUCTURE:
{
  "coaching_summary": {
    "overall_strength": "What's working well in this CV",
    "biggest_opportunity": "The most impactful improvement they could make",
    "career_level_assessment": "junior|mid-level|senior based on content"
  },
  "priority_issues": [
    {
      "priority": "critical|high|medium|low",
      "title": "Issue title",
      "impact": "Why this matters for getting interviews",
      "coaching_tip": "Specific actionable advice (not a rewrite)"
    }
  ],
  "highlights": [
    {
      "section": "Professional Summary|Work Experience|Education|Skills",
      "highlighting_strategy": "whole_section|specific_text",
      "target_text": "WHOLE_SECTION (if whole section) or exact text from CV to highlight",
      "feedback_type": "issue|improvement|suggestion|strength",
      "category": "Content|Grammar|Impact|ATS|Clarity|Action_Verbs",
      "title": "Short title for the issue",
      "message": "Detailed feedback about this issue (no rewrites)",
      "suggestion": "Brief coaching advice on how to improve this",
      "coaching_note": "Why this change will help them get interviews"
    }
  ]
}

HIGHLIGHTING RULES:
1. Use "whole_section" + "WHOLE_SECTION" when: Entire section needs major work
2. Use "specific_text" + exact text when: Specific words/phrases need fixes
3. DO NOT provide rewritten content - only feedback and coaching advice
4. Focus on what needs improvement, not providing the improved version
5. Be specific about what's wrong and how to fix it

Analyze the CV sections and identify issues - do not rewrite anything.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a career coach and CV expert. Provide strategic, actionable feedback that helps people get interviews. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw OpenAI response for full CV:', aiResponse)

    let analysisResult
    try {
      analysisResult = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse)
      return NextResponse.json({ 
        error: 'Invalid response from AI analysis',
        details: `OpenAI returned: ${aiResponse.substring(0, 300)}...`,
        parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('Full CV analysis error:', error)
    return NextResponse.json({ 
      error: 'Full CV analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}