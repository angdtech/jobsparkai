import { NextRequest, NextResponse } from 'next/server'
import { ATSAnalyzer } from '@/lib/ats-analysis'
import { ATSAnalysisManager } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { session_id, cv_data, job_description, user_id } = await request.json()

    if (!session_id || !cv_data) {
      return NextResponse.json({ error: 'Session ID and CV data required' }, { status: 400 })
    }

    console.log('Running analysis for session:', session_id)

    // Run ATS analysis
    const analysis = ATSAnalyzer.analyzeCV(cv_data, job_description)

    console.log('Analysis completed:', analysis)

    // Save analysis to database using the proper manager
    const analysisRecord = await ATSAnalysisManager.createAnalysis(session_id, user_id || null, {
      overall_score: analysis.overall_score,
      file_extension: cv_data.file_type || null,
      file_format_score: analysis.file_format_score,
      layout_score: analysis.layout_score,
      font_score: analysis.font_score,
      content_structure_score: analysis.content_structure_score,
      rating: analysis.rating,
      rating_color: analysis.rating_color,
      issues: analysis.issues,
      recommendations: analysis.recommendations,
      strengths: analysis.strengths,
      detailed_analysis: analysis,
      text_length: analysis.total_words
    })

    console.log('Analysis saved:', analysisRecord)

    return NextResponse.json({
      success: true,
      analysis,
      analysis_id: analysisRecord?.id || null
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}