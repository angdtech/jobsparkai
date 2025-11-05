import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Extract work experience from this text and return JSON:

${text}

Return JSON:
{
  "position": "Job Title",
  "company": "Company Name",
  "duration": "Start Date - End Date",
  "description_items": ["Bullet point 1", "Bullet point 2", "..."]
}

Make bullet points action-oriented and quantify achievements where possible.`
      }]
    })

    const result = response.choices[0].message.content?.trim() || '{}'
    const clean = result.replace(/```json\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean)

    if (!parsed.position || !parsed.company) {
      return NextResponse.json({
        message: 'Please provide more details: job title, company name, dates, and responsibilities.'
      })
    }

    const experience = {
      id: `exp-${Date.now()}`,
      position: parsed.position || '',
      company: parsed.company || '',
      duration: parsed.duration || '',
      description: parsed.description_items?.join('\n') || '',
      description_items: parsed.description_items || []
    }

    return NextResponse.json({ experience })
  } catch (error: any) {
    console.error('Format experience error:', error)
    return NextResponse.json({
      error: error.message,
      message: 'Could not format experience. Please try again.'
    }, { status: 500 })
  }
}
