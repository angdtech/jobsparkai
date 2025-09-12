'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CVSessionManager, CVSession } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Check, MessageCircle } from 'lucide-react'
import CVUpload from '@/components/CV/CVUpload'
import CVAnalysis from '@/components/CV/CVAnalysis'
import FreemiumAnalysis from '@/components/CV/FreemiumAnalysis'
import CVViewer from '@/components/CV/CVViewer'
import AnalysisLoading from '@/components/CV/AnalysisLoading'
import CVOverviewModal from '@/components/CV/CVOverviewModal'
import EnhancedTemplateSelection from '@/components/CV/EnhancedTemplateSelection'
import CoachingOverview from '@/components/CV/CoachingOverview'
import TemplateSelector from '@/components/CV/TemplateSelector'
import CVCoachingSummary from '@/components/CV/CVCoachingSummary'
import type { ATSAnalysis } from '@/lib/ats-analysis'

export default function CVSessionPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<CVSession | null>(null)
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [analyzingCV, setAnalyzingCV] = useState(false)
  const [cvData, setCvData] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string, type: string} | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [showTemplateSelection, setShowTemplateSelection] = useState(false)
  const [showReanalyzeOption, setShowReanalyzeOption] = useState(false)
  const [showOverviewModal, setShowOverviewModal] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)
  const [onboardingProgress, setOnboardingProgress] = useState<'upload' | 'overview' | 'template' | 'complete'>('upload')
  const [selectedRoleType, setSelectedRoleType] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [showCoachingOverview, setShowCoachingOverview] = useState(false)
  const [showNewTemplateSelector, setShowNewTemplateSelector] = useState(false)
  const [flowStage, setFlowStage] = useState<'analysis' | 'coaching' | 'templates' | 'complete'>('analysis')
  const [showCoachingSummary, setShowCoachingSummary] = useState(false)
  const [personalizationData, setPersonalizationData] = useState<{
    roleTypes: string[]
    market: string
  }>({ roleTypes: [], market: '' })

  useEffect(() => {
    // Allow access without authentication for homepage upload flow
    // but redirect to dashboard if no user and no sessionId
    if (!loading && !user && !sessionId) {
      router.push('/')
      return
    }
    
    if (sessionId && !session) { // Only load if we don't already have the session
      loadSession()
    }
  }, [sessionId]) // Remove unnecessary dependencies

  const loadSession = async () => {
    setLoadingSession(true)
    try {
      console.log('⏱️ Loading session with ID:', sessionId)
      const sessionData = await CVSessionManager.getSession(sessionId)
      console.log('✅ Session data received in', sessionData ? 'success' : 'failed')
      
      if (sessionData) {
        // Set session data immediately for faster UI
        setSession(sessionData)
        setIsPaid(sessionData.is_paid || false)
        console.log('✅ Session loaded instantly')
        
        // Load existing analysis if any
        try {
          const { ATSAnalysisManager } = await import('@/lib/database')
          const analysisData = await ATSAnalysisManager.getAnalysis(sessionId)
          console.log('Analysis data loaded:', analysisData)
          
          if (analysisData) {
            // Convert database format to ATSAnalysis format
            const convertedAnalysis: ATSAnalysis = {
              overall_score: analysisData.overall_score,
              readability_score: 85, // Default values for missing fields
              keyword_score: 75,
              format_score: analysisData.file_format_score,
              file_format_score: analysisData.file_format_score,
              layout_score: analysisData.layout_score,
              font_score: analysisData.font_score,
              content_structure_score: analysisData.content_structure_score,
              total_words: analysisData.text_length || 0,
              keywords_found: [],
              missing_sections: [],
              recommendations: analysisData.recommendations || [],
              issues: analysisData.issues || [],
              strengths: analysisData.strengths || [],
              rating: analysisData.rating,
              rating_color: analysisData.rating_color,
              analyzed_at: analysisData.created_at,
              detailed_analysis: analysisData.detailed_analysis || null
            }
            console.log('✅ Found existing analysis - showing immediately')
            setAnalysis(convertedAnalysis)
            setShowReanalyzeOption(true) // Show re-analyze option when existing analysis loaded
            
            // Show coaching summary for first-time users
            const hasSeenSummary = localStorage.getItem(`cv_summary_seen_${sessionId}`)
            if (!hasSeenSummary) {
              setShowCoachingSummary(true)
            }
            setFlowStage('complete')
            
            // STOP HERE - don't run any new analysis
            return
          }
          
          // Only run new analysis if no existing analysis found
          console.log('No analysis data found - will show manual analysis option')
          // Don't automatically run analysis - let user manually trigger it or check if CV content analysis was already done
          
          // Check if analysis exists but wasn't loaded properly (could be in different table)
          try {
            const { supabaseAdmin, supabase } = await import('@/lib/supabase')
            const client = supabaseAdmin || supabase
            
            if (!client) {
              console.error('❌ No Supabase client available for analysis check')
              return
            }
            
            const { data: existingAnalysisCheck, error: checkError } = await client
              .from('cv_ats_analysis')
              .select('*')
              .eq('session_id', sessionId)
              .maybeSingle()
              
            if (existingAnalysisCheck) {
              console.log('Found analysis in cv_ats_analysis table, using it')
              const convertedAnalysis: ATSAnalysis = {
                overall_score: existingAnalysisCheck.overall_score,
                readability_score: 85,
                keyword_score: 75,
                format_score: existingAnalysisCheck.file_format_score || 75,
                file_format_score: existingAnalysisCheck.file_format_score || 75,
                layout_score: existingAnalysisCheck.layout_score || 75,
                font_score: existingAnalysisCheck.font_score || 75,
                content_structure_score: existingAnalysisCheck.content_structure_score || 75,
                total_words: existingAnalysisCheck.text_length || 0,
                keywords_found: [],
                missing_sections: [],
                recommendations: existingAnalysisCheck.recommendations || [],
                issues: existingAnalysisCheck.issues || [],
                strengths: existingAnalysisCheck.strengths || [],
                rating: existingAnalysisCheck.rating,
                rating_color: existingAnalysisCheck.rating_color,
                analyzed_at: existingAnalysisCheck.created_at,
                detailed_analysis: existingAnalysisCheck.detailed_analysis || null
              }
              setAnalysis(convertedAnalysis)
              setShowReanalyzeOption(true)
              
              // Show coaching summary for first-time users
              const hasSeenSummary = localStorage.getItem(`cv_summary_seen_${sessionId}`)
              if (!hasSeenSummary) {
                setShowCoachingSummary(true)
              }
              setFlowStage('complete')
              
              return
            }
          } catch (dbError) {
            console.error('Error checking cv_ats_analysis table:', dbError)
          }
          
          // Analysis should have been completed during upload
          console.log('No existing analysis found - analysis should have been completed during upload')
        } catch (error) {
          console.error('Error loading existing analysis:', error)
          console.log('Could not load analysis - it should have been completed during upload')
        }
        // setAnalysis(analysisData)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('❌ Error loading session:', error)
      router.push('/dashboard')
    } finally {
      setLoadingSession(false)
      console.log('✅ Session loading complete')
    }
  }

  const handleFileUploaded = async (file: File, extractedData: any) => {
    try {
      // Update session with file name
      await CVSessionManager.updateSession(sessionId, {
        file_name: file.name
      })

      // Store CV data for analysis
      setCvData(extractedData)
      
      // Store uploaded file info for viewer
      setUploadedFile({
        name: file.name,
        url: `/uploads/cvs/${sessionId}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`,
        type: file.type
      })
      
      // Reload session to get updated data
      await loadSession()
      
      // Automatically run analysis after upload
      runATSAnalysis(extractedData)
      
    } catch (error) {
      console.error('Error processing uploaded file:', error)
      alert('Failed to process uploaded file')
    }
  }

  const extractAndAnalyze = async (sessionData: CVSession) => {
    if (!sessionData.file_name) {
      console.log('No file uploaded for this session yet')
      alert('Please upload a CV file first before running analysis.')
      return
    }
    
    setAnalyzingCV(true)
    
    try {
      console.log('Loading CV content from database...')
      
      // Check if CV content exists in database (should be there from upload)
      const { data: existingCvContent, error: cvContentError } = await supabase
        .from('cv_content')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle() // Use maybeSingle to handle 0 or 1 rows gracefully
      
      if (cvContentError) {
        console.error('Error fetching CV content:', cvContentError)
        alert('Error loading CV content from database. Please try re-uploading your CV.')
        return
      }
      
      if (existingCvContent) {
        console.log('Found CV content in database, proceeding with analysis')
        
        // Create CV data object for analysis
        const cvDataForAnalysis = {
          extractedText: existingCvContent.professional_summary || 'No professional summary available',
          full_content: existingCvContent,
          file_type: sessionData.file_type,
          session_id: sessionId
        }
        
        setCvData(cvDataForAnalysis)
        setExtractedData(existingCvContent)
        
        // Run analysis with database content
        await runATSAnalysis(cvDataForAnalysis)
        return
      }
      
      // If no CV content in database, means extraction failed during upload
      console.log('No CV content found in database - extraction may have failed during upload')
      alert('No CV content found in database. Please try re-uploading your CV file.')
      
    } catch (error) {
      console.error('Error loading and analyzing CV:', error)
      alert('An error occurred while analyzing your CV. Please try again.')
    } finally {
      setAnalyzingCV(false)
    }
  }

  const runATSAnalysis = async (dataToAnalyze?: any) => {
    if (!session && !dataToAnalyze) return

    setAnalyzingCV(true)
    
    try {
      const response = await fetch('/api/cv/analyze-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          cv_data: dataToAnalyze || cvData,
          user_id: user?.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Show detailed error information
        const errorMessage = result.show_error 
          ? `AI Analysis Error: ${result.error}\n\nDetails: ${result.details || 'No additional details'}`
          : 'Analysis failed. Please try again.'
        
        console.error('Analysis API error:', result)
        alert(errorMessage)
        return
      }

      if (result.analysis) {
        setAnalysis(result.analysis)
        console.log('Analysis completed:', result.ai_powered ? 'AI-powered' : 'Mock data')
        
        // Show coaching summary for new analysis
        const hasSeenSummary = localStorage.getItem(`cv_summary_seen_${sessionId}`)
        if (!hasSeenSummary) {
          setShowCoachingSummary(true)
        }
        setFlowStage('complete')
      } else {
        throw new Error('No analysis data received')
      }

    } catch (error) {
      console.error('Error running ATS analysis:', error)
      const errorMessage = error instanceof Error 
        ? `Analysis Error: ${error.message}` 
        : 'Failed to run ATS analysis. Please check your network connection and try again.'
      alert(errorMessage)
    } finally {
      setAnalyzingCV(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType: 'one-time',
          sessionId,
          userId: user?.id
        })
      })

      const { checkoutUrl } = await response.json()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment setup failed. Please try again.')
    }
  }

  const handleOverviewContinue = (roleType: string, market: string) => {
    // Mark overview as seen and store preferences
    localStorage.setItem(`cv_overview_seen_${sessionId}`, 'true')
    localStorage.setItem(`cv_role_type_${sessionId}`, roleType)
    localStorage.setItem(`cv_market_${sessionId}`, market)
    setSelectedRoleType(roleType)
    setSelectedMarket(market)
    setShowOverviewModal(false)
    setOnboardingProgress('template')
    setShowTemplateSelection(true)
  }

  const handleOverviewClose = () => {
    // Mark overview as seen but user chose to skip
    localStorage.setItem(`cv_overview_seen_${sessionId}`, 'true')
    setShowOverviewModal(false)
    setOnboardingProgress('complete')
  }

  const handlePersonalizationUpdate = (data: { roleTypes: string[], market: string }) => {
    setPersonalizationData(data)
  }

  const handleCoachingContinue = () => {
    // Mark coaching as seen and proceed to template selection
    localStorage.setItem(`cv_coaching_seen_${sessionId}`, 'true')
    setShowCoachingOverview(false)
    setShowNewTemplateSelector(true)
    setFlowStage('templates')
  }

  const handleViewFullAnalysis = () => {
    // Show full analysis instead of coaching overview
    setShowCoachingOverview(false)
    setFlowStage('complete')
  }

  const handleTemplateSelect = (templateId: string) => {
    // Template selected, proceed to CV page
    setShowNewTemplateSelector(false)
    setFlowStage('complete')
    router.push(`/resume?session=${sessionId}&template=${templateId}`)
  }

  const handleSummaryClose = () => {
    localStorage.setItem(`cv_summary_seen_${sessionId}`, 'true')
    setShowCoachingSummary(false)
  }

  const handleSummaryContinue = () => {
    localStorage.setItem(`cv_summary_seen_${sessionId}`, 'true')
    setShowCoachingSummary(false)
    // Navigate to improvements/next steps
    router.push(`/resume?session=${sessionId}&template=modern`)
  }

  if (loading || loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {session.file_name || 'Untitled CV'}
              </h1>
            </div>
            {analysis && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCoachingSummary(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>View CV Summary</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="space-y-8">
          {/* File Upload Section - only show if no analysis and no file */}
          {!session.file_name && !analysis ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Upload Your CV</h2>
              <CVUpload 
                onFileUploaded={handleFileUploaded}
                sessionId={sessionId}
              />
            </div>
          ) : session.file_name && !analysis ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-green-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{session.file_name}</p>
                    <p className="text-sm text-gray-600">File uploaded successfully</p>
                  </div>
                </div>
                {!analysis && !analyzingCV && cvData && (
                  <button
                    onClick={() => runATSAnalysis()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  >
                    Run ATS Analysis
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* CV Viewer */}
          {session.file_name && uploadedFile && (
            <CVViewer
              fileName={uploadedFile.name}
              fileUrl={uploadedFile.url}
              fileType={uploadedFile.type}
              extractedText={cvData?.extractedText}
            />
          )}

          {/* Manual Analysis Trigger for sessions without analysis */}
          {!analysis && !analyzingCV && session?.file_name && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready to Analyze Your CV</h3>
                <p className="text-blue-600 mb-4">
                  Click below to run AI analysis on your uploaded CV: {session.file_name}
                </p>
                <button
                  onClick={async () => {
                    if (session) {
                      await extractAndAnalyze(session)
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  🚀 Analyze My CV
                </button>
              </div>
            </div>
          )}

          {/* Show upload prompt if no file and no analysis */}
          {!analysis && !analyzingCV && !session?.file_name && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No CV Uploaded Yet</h3>
                <p className="text-yellow-600 mb-4">
                  Please upload a CV file to get started with AI analysis.
                </p>
                <div className="text-sm text-yellow-600">
                  ↑ Use the upload section above to add your CV
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analyzingCV && !analysis && (
            <AnalysisLoading onPersonalizationUpdate={handlePersonalizationUpdate} />
          )}
          
          {/* Remove old coaching overview - replaced with simple modal */}

          {/* Template Selector - New Flow */}
          {showNewTemplateSelector && flowStage === 'templates' && (
            <TemplateSelector 
              onTemplateSelect={handleTemplateSelect}
              personalizationData={personalizationData}
            />
          )}

          {/* Main CV Analysis Display */}
          {analysis && !analyzingCV && flowStage === 'complete' && !showNewTemplateSelector && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-1">Analysis Complete</h3>
                    <p className="text-sm text-blue-600">
                      {showReanalyzeOption 
                        ? `Showing saved analysis from ${new Date(analysis.analyzed_at).toLocaleDateString()}`
                        : 'Your CV analysis is ready'
                      }
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setShowReanalyzeOption(false)
                      setAnalysis(null)
                      setFlowStage('analysis')
                      if (session) {
                        await extractAndAnalyze(session)
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  >
                    🔄 Re-analyze CV
                  </button>
                </div>
              </div>
              
              <CVAnalysis 
                analysis={analysis}
                isLoading={false}
              />
            </>
          )}


          {/* Enhanced Template Selection Modal */}
          {showTemplateSelection && (
            <EnhancedTemplateSelection
              isOpen={showTemplateSelection}
              onClose={() => setShowTemplateSelection(false)}
              sessionId={sessionId}
              roleType={selectedRoleType}
              market={selectedMarket}
              cvData={extractedData}
            />
          )}

          {/* Generate New CV Button (for paid users) */}
          {analysis && isPaid && flowStage === 'complete' && !showNewTemplateSelector && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📄 Generate New CV
              </h3>
              <p className="text-gray-600 mb-6">
                Create a professionally formatted CV from your extracted content
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowNewTemplateSelector(true)
                    setFlowStage('templates')
                  }}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  🎨 Choose Template & Build CV
                </button>
                <button
                  onClick={() => router.push(`/resume?session=${sessionId}&template=original`)}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Quick Start with Classic Template
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CV Coaching Summary Modal */}
        {showCoachingSummary && analysis && (
          <CVCoachingSummary
            isOpen={showCoachingSummary}
            onClose={handleSummaryClose}
            analysis={analysis}
            cvData={extractedData}
            onContinue={handleSummaryContinue}
          />
        )}

        {/* CV Overview Modal for New Users */}
        {showOverviewModal && analysis && (
          <CVOverviewModal
            isOpen={showOverviewModal}
            onClose={handleOverviewClose}
            cvData={extractedData}
            analysis={analysis}
            onContinue={handleOverviewContinue}
          />
        )}
      </div>
    </div>
  )
}