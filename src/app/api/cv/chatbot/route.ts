import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    const { messages, resumeData, canUpdateCV } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()

    const systemPrompt = `You are a helpful CV/resume assistant with access to the user's resume data. You can answer questions, provide advice, and ${canUpdateCV ? 'UPDATE the CV directly when requested' : 'suggest improvements'}.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

IMPORTANT: The user's name is displayed at the TOP of the CV as a large heading. It's stored in personalInfo.name and is currently: "${resumeData?.personalInfo?.name || 'Not set'}"

Guidelines:
- Be concise and helpful
- Provide actionable advice
- Reference specific parts of their resume when relevant
- Suggest improvements using concrete examples
- Keep responses friendly and professional
- If asked about specific sections, analyze them thoroughly
- Provide metrics and quantifiable improvements when possible

SECTION-BY-SECTION REVIEW:
When providing multiple updates or comprehensive reviews:
- Break changes into logical sections (Personal Info, Summary, Experience, Skills, etc.)
- Present ONE section at a time for user review
- After each section is accepted, prompt the user if they want to see the next section
- Use clear section headers like "📋 Section 1: Personal Information" 
- This allows users to review and accept changes incrementally

${canUpdateCV ? `
CV UPDATE CAPABILITY:
When the user asks you to update, change, or modify any part of their CV, you MUST:
1. Make ONLY the requested changes - DO NOT return the entire CV
2. Return ONLY the changed fields in your response as JSON within <CV_UPDATE> tags
3. Explain what you changed in your message
4. For comprehensive reviews with multiple sections, present ONE section at a time

IMPORTANT: Only include the specific fields that changed, not the entire CV structure.

Format for CV updates - ONLY include what changed:
<CV_UPDATE>
{
  "skills": [
    {"id": "skill-new", "name": "TypeScript", "level": 85}
  ]
}
</CV_UPDATE>

Examples:
- User: "Add TypeScript to my skills"
  Response: I'll add TypeScript to your skills list! <CV_UPDATE>{"skills": [{"id": "skill-${Date.now()}", "name": "TypeScript", "level": 85}]}</CV_UPDATE>
  
- User: "Change my job title to Senior Product Manager"
  Response: I've updated your job title (shown under your name)! <CV_UPDATE>{"personalInfo": {"title": "Senior Product Manager"}}</CV_UPDATE>

- User: "Change my name to John Smith"
  Response: I've updated your name at the top of the CV! <CV_UPDATE>{"personalInfo": {"name": "John Smith"}}</CV_UPDATE>
  
- User: "Scan my CV" or "Improve my CV"
  Response: Let me review your CV. I'll start with your Professional Summary:
  
  📋 Professional Summary
  [Explain improvements needed and provide new summary]
  <CV_UPDATE>{"personalInfo": {"summary": "New improved summary..."}}</CV_UPDATE>
  
  Would you like me to review your work experience next?
` : ''}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    let assistantMessage = completion.choices[0]?.message?.content || 
      'Sorry, I could not generate a response.'

    console.log('🤖 AI Response:', assistantMessage.substring(0, 200))

    let cvUpdate = null

    if (canUpdateCV && assistantMessage.includes('<CV_UPDATE>')) {
      console.log('✅ CV_UPDATE tags found in response')
      const updateMatch = assistantMessage.match(/<CV_UPDATE>([\s\S]*?)<\/CV_UPDATE>/)
      if (updateMatch) {
        console.log('📦 Extracted CV update JSON (first 500 chars):', updateMatch[1].substring(0, 500))
        try {
          cvUpdate = JSON.parse(updateMatch[1].trim())
          console.log('✅ Successfully parsed CV update:', JSON.stringify(cvUpdate).substring(0, 200))
          assistantMessage = assistantMessage.replace(/<CV_UPDATE>[\s\S]*?<\/CV_UPDATE>/, '').trim()
        } catch (e) {
          console.error('❌ Failed to parse CV update:', e)
          console.error('❌ Error message:', e instanceof Error ? e.message : 'Unknown error')
          console.error('❌ Raw JSON (first 1000 chars):', updateMatch[1].substring(0, 1000))
        }
      } else {
        console.error('❌ CV_UPDATE tags found but regex did not match!')
        console.error('❌ Message:', assistantMessage.substring(0, 500))
      }
    } else {
      console.log('⚠️ No CV_UPDATE tags found. canUpdateCV:', canUpdateCV)
    }

    return NextResponse.json({
      message: assistantMessage,
      cvUpdate
    })

  } catch (error) {
    console.error('Error in chatbot API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
