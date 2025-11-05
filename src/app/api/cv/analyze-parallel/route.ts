import { NextRequest, NextResponse } from 'next/server'
import { ATSAnalysisManager } from '@/lib/database'
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

// Parallel analysis functions
async function analyzeContentRelevance(openai: OpenAI, cvText: string) {
  const prompt = `
You are a recruiter analyzing CV content relevance. Focus ONLY on content quality and relevance.

CV Content:
${cvText}

Analyze and return JSON:
{
  "strengths": ["Specific achievements listed", "Clear career progression"],
  "improvements": ["Need more quantifiable metrics", "Too generic for specific roles"],
  "score": 7,
  "critical_issues": 2
}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a recruiter focusing on content analysis. Return only valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 300
  })

  return JSON.parse(completion.choices[0]?.message?.content || '{}')
}

async function analyzeFormatting(openai: OpenAI, cvText: string) {
  const prompt = `
You are analyzing CV formatting and readability. Focus ONLY on layout, structure, and visual presentation.

CV Content:
${cvText}

Analyze and return JSON:
{
  "strengths": ["Clear section headers", "Good use of bullet points"],
  "improvements": ["Two-column layout may confuse ATS", "Dense text blocks need spacing"],
  "ats_issues": ["Skills in table format", "Non-standard headers"],
  "score": 6,
  "critical_issues": 1
}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a formatting expert. Return only valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 300
  })

  return JSON.parse(completion.choices[0]?.message?.content || '{}')
}

async function analyzeLanguageStyle(openai: OpenAI, cvText: string) {
  const prompt = `
You are analyzing language and writing style. Focus ONLY on grammar, tone, and word choice.

CV Content:
${cvText}

Analyze and return JSON:
{
  "issues": ["Too many passive phrases", "Generic buzzwords without evidence"],
  "fixes": ["Use active verbs like 'led,' 'delivered'", "Replace clichés with specific examples"],
  "red_flags": [{"issue": "Unprofessional email format", "severity": "medium"}],
  "score": 8,
  "critical_issues": 1
}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a language and style expert. Return only valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 300
  })

  return JSON.parse(completion.choices[0]?.message?.content || '{}')
}

async function generateActionPlan(openai: OpenAI, cvText: string, analysisResults: any) {
  const prompt = `
Based on the CV content and analysis results, create a prioritized action plan.

CV Content:
${cvText}

Analysis Results:
${JSON.stringify(analysisResults, null, 2)}

Generate action plan and return JSON:
{
  "action_plan": [
    "Add quantifiable achievements to each role (highest priority)",
    "Convert to ATS-friendly single-column format",
    "Replace passive language with active verbs"
  ],
  "template_recommendation": "modern",
  "overall_impression": "Strong technical background but needs better formatting",
  "total_words": 280
}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a CV improvement strategist. Return only valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 400
  })

  return JSON.parse(completion.choices[0]?.message?.content || '{}')
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, cv_data, job_description, user_id } = await request.json()

    console.log('🚀 Parallel AI Analysis API called with:', { session_id, user_id, cv_data: !!cv_data })

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get CV content from database if not provided
    let actualCvData = cv_data
    if (!cv_data || !cv_data.extractedText) {
      console.log('No CV data provided, loading from database...')
      
      const { supabase } = await import('@/lib/supabase')
      const { data: dbCvContent, error: cvError } = await supabase
        .from('cv_content_nw')
        .select('*')
        .eq('session_id', session_id)
        .maybeSingle()
      
      if (cvError) {
        console.error('Error fetching CV content from database:', cvError)
        return NextResponse.json({ 
          error: 'Could not load CV content from database',
          details: cvError.message,
          show_error: true 
        }, { status: 500 })
      }
      
      if (!dbCvContent) {
        return NextResponse.json({ 
          error: 'No CV content found. Please upload a CV first.',
          show_error: true
        }, { status: 404 })
      }
      
      // Convert database content to analysis format
      actualCvData = {
        extractedText: dbCvContent.professional_summary || 'No content available',
        full_content: dbCvContent,
        file_type: 'pdf',
        session_id: session_id,
        user_id: dbCvContent.auth_user_id
      }
      
      console.log('Successfully loaded CV content from database for analysis')
    }

    if (!actualCvData.extractedText || actualCvData.extractedText.length < 50) {
      return NextResponse.json({ 
        error: 'Insufficient CV content for analysis. Please upload a more detailed CV.',
        show_error: true
      }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured', 
        details: 'OPENAI_API_KEY environment variable is missing',
        show_error: true 
      }, { status: 500 })
    }

    try {
      console.log('🚀 Starting parallel AI analysis calls...')
      const startTime = Date.now()
      
      const openai = getOpenAIClient()
      const cvText = actualCvData.extractedText || JSON.stringify(actualCvData.full_content || actualCvData)

      // Execute all analysis calls in parallel
      const [
        contentAnalysis,
        formattingAnalysis,
        languageAnalysis
      ] = await Promise.all([
        analyzeContentRelevance(openai, cvText),
        analyzeFormatting(openai, cvText),
        analyzeLanguageStyle(openai, cvText)
      ])

      console.log('✅ Parallel analysis completed in', Date.now() - startTime, 'ms')

      // Combine results
      const combinedResults = {
        content_relevance: contentAnalysis,
        formatting_readability: formattingAnalysis,
        language_style: languageAnalysis
      }

      // Generate action plan based on combined results
      const actionPlanResult = await generateActionPlan(openai, cvText, combinedResults)

      // Calculate overall critical issues
      const totalCriticalIssues = (contentAnalysis.critical_issues || 0) + 
                                 (formattingAnalysis.critical_issues || 0) + 
                                 (languageAnalysis.critical_issues || 0)

      // Build final analysis result
      const realAnalysis = {
        overall_impression: actionPlanResult.overall_impression,
        critical_issues_found: totalCriticalIssues,
        template_recommendation: actionPlanResult.template_recommendation || "modern",
        content_relevance: {
          strengths: contentAnalysis.strengths || [],
          improvements: contentAnalysis.improvements || []
        },
        formatting_readability: {
          strengths: formattingAnalysis.strengths || [],
          improvements: formattingAnalysis.improvements || []
        },
        ats_compatibility: {
          issues: formattingAnalysis.ats_issues || [],
          fixes: ["Use plain bullet points for skills", "Change to standard section headers"]
        },
        language_style: {
          issues: languageAnalysis.issues || [],
          fixes: languageAnalysis.fixes || []
        },
        red_flags: languageAnalysis.red_flags || [],
        action_plan: actionPlanResult.action_plan || [],
        total_words: actionPlanResult.total_words || 0
      }

      console.log('🔄 Parsed parallel AI analysis:', realAnalysis)

      try {
        // Convert new structured format to database format
        const issues = []
        
        // Extract issues from structured format
        if (realAnalysis.content_relevance?.improvements) {
          realAnalysis.content_relevance.improvements.forEach((imp: string) => {
            issues.push({ type: "Content", description: imp, severity: "medium" })
          })
        }
        if (realAnalysis.formatting_readability?.improvements) {
          realAnalysis.formatting_readability.improvements.forEach((imp: string) => {
            issues.push({ type: "Formatting", description: imp, severity: "medium" })
          })
        }
        if (realAnalysis.ats_compatibility?.issues) {
          realAnalysis.ats_compatibility.issues.forEach((issue: string) => {
            issues.push({ type: "ATS", description: issue, severity: "high" })
          })
        }
        if (realAnalysis.language_style?.issues) {
          realAnalysis.language_style.issues.forEach((issue: string) => {
            issues.push({ type: "Language", description: issue, severity: "medium" })
          })
        }
        if (realAnalysis.red_flags) {
          realAnalysis.red_flags.forEach((flag: any) => {
            issues.push({ type: "Red Flag", description: flag.issue, severity: flag.severity })
          })
        }

        // Create recommendations from action plan
        const recommendations = realAnalysis.action_plan?.map((action: string, index: number) => ({
          type: "Action Item",
          description: action,
          priority: index === 0 ? "high" : "medium"
        })) || []

        // Save analysis to database
        const actualUserId = actualCvData.user_id || user_id || null
        console.log('💾 Saving parallel analysis to database for session:', session_id)
        
        const analysisRecord = await ATSAnalysisManager.createAnalysis(session_id, actualUserId, {
          overall_score: totalCriticalIssues,
          file_extension: actualCvData.file_type ? actualCvData.file_type.split('/').pop()?.substring(0, 10) || 'pdf' : 'pdf',
          file_format_score: 0,
          layout_score: 0,
          font_score: 0,
          content_structure_score: 0,
          rating: totalCriticalIssues <= 2 ? "Excellent" : 
                 totalCriticalIssues <= 4 ? "Good" : 
                 totalCriticalIssues <= 6 ? "Fair" : "Needs Work",
          rating_color: totalCriticalIssues <= 2 ? "text-green-600" : 
                       totalCriticalIssues <= 4 ? "text-blue-600" : 
                       totalCriticalIssues <= 6 ? "text-yellow-600" : "text-red-600",
          issues: issues,
          recommendations: recommendations,
          strengths: [
            ...(realAnalysis.content_relevance?.strengths || []).map((s: string) => ({ type: "Content", description: s })),
            ...(realAnalysis.formatting_readability?.strengths || []).map((s: string) => ({ type: "Formatting", description: s }))
          ],
          detailed_analysis: realAnalysis,
          text_length: realAnalysis.total_words
        })

        if (analysisRecord) {
          console.log('✅ Parallel AI analysis saved to database successfully:', analysisRecord.id)
        } else {
          console.error('❌ Analysis record is null - save failed silently')
        }
      } catch (dbError) {
        console.error('Database save failed:', dbError)
        return NextResponse.json({ 
          error: 'Failed to save analysis to database', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          show_error: true 
        }, { status: 500 })
      }

      const totalTime = Date.now() - startTime
      console.log(`🎯 Total parallel analysis time: ${totalTime}ms`)

      return NextResponse.json({
        success: true,
        analysis: realAnalysis,
        ai_powered: true,
        processing_time_ms: totalTime,
        parallel_calls: 4
      })

    } catch (aiError) {
      console.error('Parallel AI analysis error:', aiError)
      return NextResponse.json({ 
        error: 'AI analysis failed', 
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        show_error: true 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Parallel analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}