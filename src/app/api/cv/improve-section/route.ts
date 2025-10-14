import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build'
})

interface ImprovementRequest {
  sectionType: 'tagline' | 'summary' | 'experience' | 'education' | 'skills' | 'achievements'
  currentContent: string
  context?: {
    jobTitle?: string
    industry?: string
    yearsExperience?: number
    targetRole?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sectionType, currentContent, context }: ImprovementRequest = await request.json()

    if (!currentContent || !sectionType) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionType and currentContent' },
        { status: 400 }
      )
    }

    let systemPrompt = ''
    let userPrompt = ''

    switch (sectionType) {
      case 'tagline':
        systemPrompt = `You are a professional CV writer. Create compelling, concise taglines that capture the candidate's value proposition. Keep taglines under 10 words and make them powerful and memorable.`
        userPrompt = `Current tagline: "${currentContent}"
        
Context: ${context?.jobTitle || 'Professional'} with ${context?.yearsExperience || 'several'} years experience${context?.industry ? ` in ${context.industry}` : ''}${context?.targetRole ? `, targeting ${context.targetRole} roles` : ''}.

Provide 3 improved tagline options that are:
- Concise (under 10 words)
- Impactful and memorable
- Highlight unique value
- Professional but engaging

Format as JSON: {"suggestions": ["option1", "option2", "option3"], "reasoning": "brief explanation"}`
        break

      case 'summary':
        systemPrompt = `You are a professional CV writer. Create compelling professional summaries that showcase achievements, skills, and career progression. Keep summaries concise (2-3 sentences, 50-80 words) but impactful.`
        userPrompt = `Current summary: "${currentContent}"
        
Context: ${context?.jobTitle || 'Professional'} with ${context?.yearsExperience || 'several'} years experience${context?.industry ? ` in ${context.industry}` : ''}${context?.targetRole ? `, targeting ${context.targetRole} roles` : ''}.

Provide 2 improved summary options that:
- Are 2-3 sentences (50-80 words)
- Lead with strongest achievements
- Include quantifiable results where possible
- Show career progression and skills
- Match the target role requirements

Format as JSON: {"suggestions": ["option1", "option2"], "reasoning": "brief explanation"}`
        break

      case 'experience':
        systemPrompt = `You are a professional CV writer. Improve work experience descriptions using strong action verbs, quantifiable achievements, and relevant skills. Focus on impact and results.`
        userPrompt = `Current experience description: "${currentContent}"

Improve this by:
- Starting with strong action verbs
- Adding quantifiable achievements where possible
- Highlighting transferable skills
- Showing progression and impact
- Making it ATS-friendly

Provide 1 improved version that's concise but impactful.

Format as JSON: {"suggestion": "improved text", "reasoning": "brief explanation"}`
        break

      case 'education':
        systemPrompt = `You are a professional CV writer. Improve education descriptions by highlighting relevant coursework, achievements, grades (if strong), and transferable skills.`
        userPrompt = `Current education description: "${currentContent}"

Improve this by:
- Highlighting relevant coursework/projects
- Including strong grades if applicable  
- Mentioning key skills gained
- Adding any awards or distinctions
- Keeping it concise and relevant

Provide 1 improved version.

Format as JSON: {"suggestion": "improved text", "reasoning": "brief explanation"}`
        break

      case 'skills':
        systemPrompt = `You are a professional CV writer. Improve skills sections by organizing skills logically, using industry-standard terminology, and ensuring relevance to target roles.`
        userPrompt = `Current skills: "${currentContent}"

Improve this by:
- Organizing into logical categories
- Using current industry terminology
- Removing outdated or irrelevant skills
- Highlighting most relevant skills first
- Ensuring ATS compatibility

Provide 1 improved version.

Format as JSON: {"suggestion": "improved text", "reasoning": "brief explanation"}`
        break

      case 'achievements':
        systemPrompt = `You are a professional CV writer. Improve achievements by making them specific, quantifiable, and impactful. Use strong action verbs and focus on results.`
        userPrompt = `Current achievement: "${currentContent}"

Improve this by:
- Making it specific and quantifiable
- Using strong action verbs
- Highlighting the impact/result
- Making it relevant to target roles
- Ensuring it's compelling and credible

Provide 1 improved version.

Format as JSON: {"suggestion": "improved text", "reasoning": "brief explanation"}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid section type' },
          { status: 400 }
        )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Invalid AI response format')
    }

    return NextResponse.json({
      success: true,
      sectionType,
      originalContent: currentContent,
      ...parsedResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error improving CV section:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}