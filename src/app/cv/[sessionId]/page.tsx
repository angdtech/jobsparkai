'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CVSessionManager, CVSession } from '@/lib/database'
import CVUpload from '@/components/CV/CVUpload'
import CVAnalysis from '@/components/CV/CVAnalysis'
import FreemiumAnalysis from '@/components/CV/FreemiumAnalysis'
import CVViewer from '@/components/CV/CVViewer'
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
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string, type: string} | null>(null)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    // Allow access without authentication for homepage upload flow
    // but redirect to dashboard if no user and no sessionId
    if (!loading && !user && !sessionId) {
      router.push('/')
      return
    }
    
    if (sessionId) {
      loadSession()
    }
  }, [user, loading, sessionId, router])

  const loadSession = async () => {
    try {
      console.log('Loading session with ID:', sessionId)
      const sessionData = await CVSessionManager.getSession(sessionId)
      console.log('Session data received:', sessionData)
      if (sessionData) {
        // TODO: Re-enable ownership check after fixing user_id assignment
        // For now, allow access to any session for testing
        setSession(sessionData)
        setIsPaid(sessionData.is_paid || false)
        
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
              analyzed_at: analysisData.created_at
            }
            console.log('Setting converted analysis:', convertedAnalysis)
            setAnalysis(convertedAnalysis)
          } else {
            console.log('No analysis data found')
            // If session has a file but no analysis, extract content and run analysis
            if (sessionData.file_name) {
              console.log('Session has file but no analysis, starting content extraction...')
              extractAndAnalyze(sessionData)
            }
          }
        } catch (error) {
          console.log('No existing analysis found or error loading:', error)
          // If session has a file but no analysis, extract content and run analysis
          if (sessionData.file_name) {
            console.log('Session has file but no analysis, starting content extraction...')
            extractAndAnalyze(sessionData)
          }
        }
        // setAnalysis(analysisData)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error loading session:', error)
      router.push('/dashboard')
    } finally {
      setLoadingSession(false)
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
    if (!sessionData.file_name) return
    
    setAnalyzingCV(true)
    
    try {
      console.log('Extracting content from uploaded file...')
      
      // Call extract API to get CV data from the uploaded file
      const extractResponse = await fetch('/api/cv/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        }),
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to extract CV content')
      }

      const extractedData = await extractResponse.json()
      console.log('Extracted data:', extractedData)
      
      // Store the extracted data
      setCvData(extractedData.cv_data)
      
      // Run analysis with the extracted data
      await runATSAnalysis(extractedData.cv_data)
      
    } catch (error) {
      console.error('Error extracting and analyzing:', error)
    } finally {
      setAnalyzingCV(false)
    }
  }

  const runATSAnalysis = async (dataToAnalyze?: any) => {
    if (!session && !dataToAnalyze) return

    setAnalyzingCV(true)
    
    try {
      const response = await fetch('/api/cv/analyze', {
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

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      setAnalysis(result.analysis)

    } catch (error) {
      console.error('Error running ATS analysis:', error)
      alert('Failed to run ATS analysis')
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
              <p className="text-gray-600">Session ID: {session.session_id}</p>
            </div>
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

          {/* Analysis Results */}
          {(analysis || analyzingCV) && (
            <>
              {isPaid ? (
                <CVAnalysis 
                  analysis={analysis!}
                  isLoading={analyzingCV}
                />
              ) : (
                <FreemiumAnalysis
                  analysis={analysis!}
                  onUpgrade={handleUpgrade}
                  fileName={session.file_name || 'Your CV'}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}