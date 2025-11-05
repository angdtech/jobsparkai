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

Guidelines:
- Be concise and helpful
- Provide actionable advice
- Reference specific parts of their resume when relevant
- Suggest improvements using concrete examples
- Keep responses friendly and professional
- If asked about specific sections, analyze them thoroughly
- Provide metrics and quantifiable improvements when possible

${canUpdateCV ? `
CV UPDATE CAPABILITY:
When the user asks you to update, change, or modify any part of their CV, you MUST:
1. Make ONLY the requested changes - DO NOT return the entire CV
2. Return ONLY the changed fields in your response as JSON within <CV_UPDATE> tags
3. Explain what you changed in your message

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
  Response: <CV_UPDATE>{"skills": [{"id": "skill-${Date.now()}", "name": "TypeScript", "level": 85}]}</CV_UPDATE>
  
- User: "Change my job title to Senior Product Manager"
  Response: <CV_UPDATE>{"personalInfo": {"title": "Senior Product Manager"}}</CV_UPDATE>
  
- User: "Update my summary"
  Response: <CV_UPDATE>{"personalInfo": {"summary": "New improved summary..."}}</CV_UPDATE>
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
