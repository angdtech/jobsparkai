import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { session_id, summary_text } = await request.json()

    if (!session_id || !summary_text) {
      return NextResponse.json({ error: 'Session ID and summary text are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    console.log('Analyzing summary text:', summary_text)

    const prompt = `
Analyze this professional summary and provide specific feedback for sentence-level and word-level improvements:

SUMMARY TEXT:
"${summary_text}"

Return ONLY this JSON structure with specific text highlights:
{
  "overall_feedback": {
    "strength": "string describing what works well",
    "main_issue": "string describing the biggest problem"
  },
  "highlights": [
    {
      "text": "exact text to highlight",
      "type": "issue|suggestion|strength",
      "category": "Grammar|Tone|Action Verbs|Spelling|Clarity|Impact",
      "message": "specific feedback about this text",
      "suggestion": "improved version of the text",
      "severity": "low|medium|high"
    }
  ]
}

Focus on:
- Weak or passive language that can be strengthened
- Grammatical errors or awkward phrasing
- Missing quantifiable achievements
- Generic buzzwords that add no value
- Unclear or vague statements

Be specific - highlight exact phrases, words, or sentences that need improvement.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o mini
      messages: [
        {
          role: "system",
          content: "You are a professional CV expert analyzing professional summaries. Provide specific, actionable feedback. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 600
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw OpenAI response:', aiResponse)

    let analysisResult
    try {
      analysisResult = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResponse)
      console.error('Parse error:', parseError)
      return NextResponse.json({ 
        error: 'Invalid response from AI analysis',
        details: `OpenAI returned: ${aiResponse.substring(0, 200)}...`,
        parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('Summary analysis error:', error)
    return NextResponse.json({ 
      error: 'Summary analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}