import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { incrementChatUsage } from '@/lib/chat-usage'
import { supabase } from '@/lib/supabase'

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
    const { messages, resumeData, canUpdateCV, userId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()

    // Optimize resume data - only send essential fields to reduce tokens
    const optimizedResumeData = {
      personalInfo: {
        name: resumeData?.personalInfo?.name,
        title: resumeData?.personalInfo?.title,
        email: resumeData?.personalInfo?.email,
        phone: resumeData?.personalInfo?.phone,
        address: resumeData?.personalInfo?.address,
        summary: resumeData?.personalInfo?.summary,
        linkedin: resumeData?.personalInfo?.linkedin,
        website: resumeData?.personalInfo?.website
      },
      experience: resumeData?.experience?.map((exp: any) => ({
        position: exp.position,
        company: exp.company,
        duration: exp.duration,
        description: exp.description_items?.join('; ') || exp.description
      })),
      education: resumeData?.education?.map((edu: any) => ({
        degree: edu.degree,
        school: edu.school,
        duration: edu.duration
      })),
      skills: resumeData?.skills?.map((s: any) => s.name).join(', '),
      awards: resumeData?.awards?.length || 0,
      languages: resumeData?.languages?.map((l: any) => l.name).join(', ')
    }

    const systemPrompt = `You are a helpful CV/resume assistant with access to the user's resume data. You can answer questions, provide advice, and ${canUpdateCV ? 'UPDATE the CV directly when requested' : 'suggest improvements'}.

Resume Data:
${JSON.stringify(optimizedResumeData, null, 2)}

IMPORTANT: The user's name is displayed at the TOP of the CV as a large heading. It's stored in personalInfo.name and is currently: "${resumeData?.personalInfo?.name || 'Not set'}"

Guidelines:
- Be concise and helpful
- Provide actionable advice
- Reference specific parts of their resume when relevant
- Suggest improvements using concrete examples
- Keep responses friendly and professional
- If asked about specific sections, analyze them thoroughly
- Provide metrics and quantifiable improvements when possible
- NEVER ask "Would you like me to update this?" or "Should I apply these changes?" - just provide the improved version
- Accept/Reject buttons will automatically appear for the user

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
4. ALWAYS include the <CV_UPDATE> tags when making suggestions - DO NOT ask if they want to apply changes
5. For comprehensive reviews with multiple sections, present ONE section at a time

CRITICAL RULES - MUST FOLLOW:
1. When user asks to update/improve/change ANYTHING, you MUST include <CV_UPDATE> tags
2. Format: Brief explanation (1-2 lines) + <CV_UPDATE>JSON</CV_UPDATE>
3. NEVER write long explanations without the tags
4. NEVER ask "Would you like me to update?" - just provide the tags
5. Example response: "Here's an improved version:\n\n<CV_UPDATE>{\"personalInfo\":{\"summary\":\"New text\"}}</CV_UPDATE>"

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
  Response: I've updated your job title! <CV_UPDATE>{"personalInfo": {"title": "Senior Product Manager"}}</CV_UPDATE>

- User: "Change my name to John Smith"
  Response: I've updated your name! <CV_UPDATE>{"personalInfo": {"name": "John Smith"}}</CV_UPDATE>
  
- User: "Scan my CV" or "Improve my CV"
  Response: Let me review your CV. I'll start with your Professional Summary:
  
  📋 Professional Summary
  [Explain improvements needed and provide new summary]
  <CV_UPDATE>{"personalInfo": {"summary": "New improved summary..."}}</CV_UPDATE>
  
  Let me know when you're ready to review your work experience next!

REMEMBER: Even if response is long, you MUST end with <CV_UPDATE> tags. User CANNOT update their CV without these tags!
` : ''}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800, // Increased to ensure CV_UPDATE tags fit
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7
    })

    let assistantMessage = completion.choices[0]?.message?.content || 
      'Sorry, I could not generate a response.'
    
    // Check if response was truncated due to token limit
    const finishReason = completion.choices[0]?.finish_reason
    const wasTruncated = finishReason === 'length'
    
    if (wasTruncated) {
      assistantMessage += '\n\n_Response truncated. Subscribe for £5/month for unlimited detailed responses!_'
    }

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

    if (userId) {
      try {
        await supabase.rpc('increment_chat_usage', { user_id: userId })
      } catch (err) {
        console.error('Error incrementing chat usage:', err)
      }
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
