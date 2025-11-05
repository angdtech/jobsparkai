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

export async function POST(request: NextRequest) {
  try {
    const { session_id, cv_data, job_description, user_id } = await request.json()

    console.log('Real AI Analysis API called with:', { session_id, user_id, cv_data: !!cv_data })

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get CV content from database if not provided
    let actualCvData = cv_data
    if (!cv_data || !cv_data.extractedText) {
      console.log('No CV data provided, loading from database...')
      
      const { supabase } = await import('@/lib/supabase')
      const { data: dbCvContent, error: cvError } = await supabase
        .from('cv_content')
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
        user_id: dbCvContent.auth_user_id // Get user ID from CV content
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
      console.log('Calling OpenAI for CV analysis...')
      
      const prompt = `
You are a professional recruiter analyzing this CV. Use this EXACT checklist to find issues:

CV Content:
${actualCvData.extractedText || JSON.stringify(actualCvData.full_content || actualCvData)}

CHECK EACH ITEM ON THIS CHECKLIST:

CONTENT MISTAKES CHECKLIST:
☐ Too generic/not tailored → Using one CV for every job instead of tailoring to the role
☐ Buzzword overload → Phrases like "hard-working team player" without proof or achievements
☐ Lack of quantifiable impact → Listing responsibilities only ("managed a team") instead of outcomes ("managed a team of 5, increasing revenue by 20%")
☐ Job descriptions copied from HR listings → Recruiters spot this instantly
☐ Overstuffing skills → Long lists of skills/tools without context or relevance
☐ Employment gaps unexplained → Gaps stand out if not addressed with context
☐ Weak or missing profile/summary → No clear positioning of who the candidate is and what value they bring

FORMATTING MISTAKES CHECKLIST:
☐ Hard-to-read layouts → Complex designs, multiple columns, or fancy graphics that confuse ATS or recruiters
☐ Inconsistent formatting → Different fonts, bullet styles, or spacing
☐ Too long → Especially in the UK/EU where 2 pages is the norm (US tends to prefer 1–2)
☐ Overly short → One-page CVs that undersell experience for senior/mid-level professionals
☐ Poor section order → Key information (skills, achievements) buried below secondary details
☐ No clear hierarchy → Dense text blocks with no white space

ATS-RELATED MISTAKES CHECKLIST:
☐ Using images, tables, or graphics → Often unreadable by ATS
☐ PDFs saved incorrectly (as images) → ATS can't parse text
☐ Missing standard section headers → ATS may not recognise "Professional Background" as "Experience"
☐ Uncommon fonts or symbols → Can break parsing

LANGUAGE/STYLE MISTAKES CHECKLIST:
☐ Passive voice instead of active → "Was responsible for" vs. "Delivered"
☐ Typos & grammatical errors → Still one of the fastest ways to get rejected
☐ Jargon-heavy → Overly technical language without explanation
☐ Clichés → "Results-driven," "detail-oriented" without evidence

RED FLAGS CHECKLIST:
☐ Unexplained career hopping → Too many short stints without context
☐ Irrelevant personal info → Age, marital status, headshots (depending on region)
☐ Missing contact info → Yes, it happens—no phone/email, or outdated details
☐ Unprofessional email addresses → e.g., partygirl88@
☐ References included → Usually not needed unless asked

Return this JSON with structured feedback:
{
  "overall_impression": "Strong technical background comes through, but the layout hides key achievements and the CV feels generic.",
  "critical_issues_found": 4,
  "template_recommendation": "modern|simple|keep_original",
  "content_relevance": {
    "strengths": ["Good coverage of leadership skills", "Clear career progression"],
    "improvements": ["Achievements need more metrics (e.g., % increase, £ savings)", "CV feels generic - needs tailoring to specific roles"]
  },
  "formatting_readability": {
    "strengths": ["Clean layout", "Good use of sections"],
    "improvements": ["Two-column format may confuse ATS systems - consider single-column", "Dense text blocks need more white space"]
  },
  "ats_compatibility": {
    "issues": ["Skills section inside table - ATS may not read correctly", "Non-standard 'Professional Background' header"],
    "fixes": ["Use plain bullet points for skills", "Change to standard 'Experience' header"]
  },
  "language_style": {
    "issues": ["Too many passive phrases like 'responsible for'", "Generic buzzwords without evidence"],
    "fixes": ["Use active verbs like 'led,' 'delivered,' 'implemented'", "Replace clichés with specific examples"]
  },
  "red_flags": [
    {
      "issue": "Employment gap in 2019-2020 unexplained",
      "severity": "medium",
      "fix": "Add brief explanation for gap (e.g., 'Career break for family reasons')"
    }
  ],
  "action_plan": [
    "Add quantifiable achievements to each role (highest priority)",
    "Convert to ATS-friendly single-column format", 
    "Replace passive language with active verbs",
    "Add brief professional summary at top"
  ],
  "total_words": 280
}

Be specific and helpful. Focus on what actually costs interviews.
`

      const openai = getOpenAIClient()
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a brutal recruiter who spots CV problems instantly. Find SPECIFIC issues that cost interviews. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        throw new Error('No response from OpenAI')
      }

      console.log('Raw OpenAI response:', aiResponse)

      // Parse the AI response
      let realAnalysis
      try {
        realAnalysis = JSON.parse(aiResponse)
      } catch (parseError) {
        console.error('Failed to parse OpenAI analysis:', aiResponse)
        return NextResponse.json({ 
          error: 'OpenAI returned invalid JSON', 
          details: aiResponse,
          parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          show_error: true 
        }, { status: 500 })
      }

      console.log('Parsed AI analysis:', realAnalysis)

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

        // Save analysis to database - use actual user ID from CV data
        const actualUserId = actualCvData.user_id || user_id || null
        console.log('Attempting to save analysis to database for session:', session_id)
        console.log('Analysis data to save:', {
          session_id,
          user_id: actualUserId,
          overall_score: realAnalysis.critical_issues_found || issues.length,
          issues: issues.length,
          recommendations: recommendations.length
        })
        
        const analysisRecord = await ATSAnalysisManager.createAnalysis(session_id, actualUserId, {
          overall_score: realAnalysis.critical_issues_found || issues.length,
          file_extension: actualCvData.file_type ? actualCvData.file_type.split('/').pop()?.substring(0, 10) || 'pdf' : 'pdf',
          file_format_score: 0, // No longer using scores
          layout_score: 0,
          font_score: 0,
          content_structure_score: 0,
          rating: realAnalysis.critical_issues_found <= 2 ? "Excellent" : 
                 realAnalysis.critical_issues_found <= 4 ? "Good" : 
                 realAnalysis.critical_issues_found <= 6 ? "Fair" : "Needs Work",
          rating_color: realAnalysis.critical_issues_found <= 2 ? "text-green-600" : 
                       realAnalysis.critical_issues_found <= 4 ? "text-blue-600" : 
                       realAnalysis.critical_issues_found <= 6 ? "text-yellow-600" : "text-red-600",
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
          console.log('✅ Real AI analysis saved to database successfully:', analysisRecord.id)
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

      return NextResponse.json({
        success: true,
        analysis: realAnalysis,
        ai_powered: true
      })

    } catch (aiError) {
      console.error('OpenAI analysis error:', aiError)
      return NextResponse.json({ 
        error: 'AI analysis failed', 
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        show_error: true 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}