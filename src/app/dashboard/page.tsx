'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CVSession } from '@/lib/database'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Zap, AlertTriangle, Trash2, Calendar, FileCheck, Star, Target, ArrowRight, Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import UserProfile from '@/components/Auth/UserProfile'

// Engaging facts and tips for upload progress
const UPLOAD_FACTS = [
  {
    title: "Currently analyzing...",
    text: "Extracting text from your CV and checking for ATS compatibility issues that could block interviews."
  },
  {
    title: "Did you know?",
    text: "75% of resumes are rejected by ATS systems before a human ever sees them. We're making sure yours gets through."
  },
  {
    title: "Pro tip:",
    text: "Recruiters spend only 7.4 seconds scanning a resume. Every word needs to count."
  },
  {
    title: "We're checking...",
    text: "Keywords, formatting, section headers, and content structure that ATS systems require."
  },
  {
    title: "Industry insight:",
    text: "Resumes with quantified achievements get 40% more interview callbacks than generic descriptions."
  },
  {
    title: "Almost done!",
    text: "Our AI is identifying specific issues and preparing personalized recommendations for your CV."
  }
]

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [cvSessions, setCvSessions] = useState<CVSession[]>([])
  const [cvAnalysisData, setCvAnalysisData] = useState<{[key: string]: any}>({})
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserSessions()
    }
  }, [user])

  // Cycle through upload facts while uploading
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isUploading) {
      interval = setInterval(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % UPLOAD_FACTS.length)
      }, 4000) // Change fact every 4 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isUploading])

  const fetchUserSessions = async () => {
    if (!user) return

    try {
      // Import CVSessionManager dynamically to avoid circular imports
      const { CVSessionManager } = await import('@/lib/database')
      const sessions = await CVSessionManager.getUserSessions(user.id)
      setCvSessions(sessions)
      
      // Fetch analysis data for each session using ATSAnalysisManager
      const analysisData: {[key: string]: any} = {}
      for (const session of sessions) {
        try {
          // Import ATSAnalysisManager dynamically to avoid circular imports
          const { ATSAnalysisManager } = await import('@/lib/database')
          const data = await ATSAnalysisManager.getAnalysis(session.session_id)
          
          if (data) {
            analysisData[session.session_id] = data
            console.log(`Found analysis for session ${session.session_id}:`, {
              issues: data.issues?.length,
              rating: data.rating
            })
          } else {
            console.log(`No analysis data for session ${session.session_id}`)
          }
        } catch (error) {
          console.error(`Error fetching analysis for session ${session.session_id}:`, error)
        }
      }
      setCvAnalysisData(analysisData)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    console.log('\n📤 [DASHBOARD] ========== FILE DROP STARTED ==========')
    const file = acceptedFiles[0]
    if (!file || !user) {
      console.log('❌ [DASHBOARD] No file or user')
      return
    }

    console.log('📁 [DASHBOARD] File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    setIsUploading(true)
    setUploadStep(1)

    try {
      // Create a session and process the file
      console.log('🔑 [DASHBOARD] Creating CV session...')
      const { CVSessionManager } = await import('@/lib/database')
      const session = await CVSessionManager.createSession(user.id)
      if (!session) {
        console.log('❌ [DASHBOARD] Failed to create session')
        throw new Error('Failed to create session')
      }
      console.log('✅ [DASHBOARD] Session created:', session.session_id)

      // Create form data with correct field names
      console.log('📦 [DASHBOARD] Creating form data...')
      const formData = new FormData()
      formData.append('cv_file', file)
      formData.append('session_id', session.session_id)
      
      const sessionId = session.session_id

      // Close modal and redirect IMMEDIATELY - parsing happens in background
      console.log('🔄 [DASHBOARD] Closing modal and redirecting to resume page...')
      setShowUploadModal(false)
      setIsUploading(false)
      setUploadStep(0)
      
      // Set flag for fresh upload to trigger onboarding
      sessionStorage.setItem('fresh_upload', 'true')
      sessionStorage.setItem('parsing_in_progress', sessionId)
      console.log('✅ [DASHBOARD] Session flags set in sessionStorage')
      
      // Redirect to resume page immediately - it will show loading state
      console.log('➡️ [DASHBOARD] Redirecting to /resume?session=' + sessionId)
      router.push(`/resume?session=${sessionId}`)
      
      // Upload and parse in background with OPTIMIZED parallel parser (don't await)
      console.log('🚀 [DASHBOARD] Starting background upload to /api/cv/upload-analyze-parallel...')
      fetch('/api/cv/upload-analyze-parallel', {
        method: 'POST',
        headers: {
          'x-user-email': user?.email || ''
        },
        body: formData,
        keepalive: true
      }).then(() => {
        console.log('✅ [DASHBOARD] Background upload request sent successfully')
      }).catch(error => {
        console.error('❌ [DASHBOARD] Background upload failed (this is OK - processing continues):', error)
      })
      
      console.log('✅ [DASHBOARD] ========== DASHBOARD UPLOAD FLOW COMPLETE ==========')
      
    } catch (error) {
      console.error('❌ [DASHBOARD] Upload failed:', error)
      setIsUploading(false)
      setUploadStep(0)
      alert('Upload failed. Please try again.')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const deleteCV = async (sessionId: string) => {
    if (!user) return
    
    const confirmed = window.confirm('Are you sure you want to delete this CV? This action cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/cv/delete?sessionId=${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchUserSessions() // Refresh the list
      } else {
        const errorData = await response.json()
        console.error('Delete error:', errorData)
        alert('Failed to delete CV. Please try again.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete CV. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-12">
        <header className="mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.user_metadata?.first_name || user.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              {cvSessions.length > 0 && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  + Analyze New CV
                </button>
              )}
              <button
                onClick={() => setShowProfileModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </header>

        <main>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Your CV Review Results</h2>
            
            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading resumes...</p>
              </div>
            ) : cvSessions.length === 0 ? (
              <div className="text-center py-8">
                {isUploading ? (
                  // Engaging Upload Progress
                  <div className="text-center">
                    <div className="mb-8">
                      {/* Animated Icon Container */}
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                          <Zap className="h-8 w-8 text-blue-600 animate-bounce" />
                        </div>
                        {/* Rotating ring */}
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Extracting & Analyzing Your Resume
                      </h2>
                      
                      <div className="space-y-3 max-w-md mx-auto">
                        <p className="text-lg text-gray-700 font-medium">
                          Reading your resume and finding critical issues
                        </p>
                        <p className="text-sm text-gray-600">
                          Our AI is extracting your data and checking for problems that cost interviews
                        </p>
                      </div>
                    </div>
                    
                    {/* Animated Progress Indicators */}
                    <div className="flex justify-center space-x-2 mb-6">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    
                    {/* Rotating Facts */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 max-w-md mx-auto transition-all duration-500">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        {UPLOAD_FACTS[currentFactIndex].title}
                      </p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        {UPLOAD_FACTS[currentFactIndex].text}
                      </p>
                    </div>
                    
                    {/* Fact indicators */}
                    <div className="flex justify-center space-x-1 mt-3">
                      {UPLOAD_FACTS.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            index === currentFactIndex ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyze Your CV</h3>
                      <p className="text-gray-600">Upload your CV to discover issues that might be costing you interviews</p>
                    </div>

                    <div 
                      {...getRootProps()}
                      className={`border-2 border-dashed border-gray-300 rounded-xl p-12 transition-all duration-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                        isDragActive ? 'border-blue-400 bg-blue-50' : ''
                      }`}
                    >
                      <input {...getInputProps()} />
                      
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {isDragActive ? 'Drop your CV here!' : 'Drop Your CV Here'}
                        </h3>
                        
                        <p className="text-gray-600 mb-6">
                          PDF or Word document • Free review in 2 minutes
                        </p>
                        
                        <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                          Choose File
                        </button>
                        
                        <p className="text-gray-500 text-sm mt-4">
                          ✓ Secure upload ✓ Instant review ✓ Professional recommendations
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cvSessions.map((session) => {
                  const analysis = cvAnalysisData[session.session_id]
                  const issueCount = analysis?.issues?.length || analysis?.detailed_analysis?.critical_issues_found || 0
                  const hasAnalysis = !!analysis
                  
                  // Debug logging
                  console.log(`Session ${session.session_id}:`, {
                    hasAnalysis,
                    issueCount,
                    analysisKeys: analysis ? Object.keys(analysis) : 'no analysis'
                  })
                  
                  return (
                    <div 
                      key={session.id} 
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-blue-200 cursor-pointer"
                      onClick={() => router.push(`/resume?session=${session.session_id}`)}
                    >
                      {/* Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                {session.file_name?.replace(/\.(pdf|docx|doc)$/i, '') || 'Untitled CV'}
                              </h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(session.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation() // Prevent card click
                              deleteCV(session.session_id)
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Analysis Results */}
                        {hasAnalysis ? (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <span className="text-2xl font-bold text-red-600">{issueCount}</span>
                                <span className="text-sm text-gray-600">critical issues found</span>
                              </div>
                              {analysis.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium text-gray-700">{analysis.rating}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-600 mb-3">
                              Issues that might be preventing interviews
                            </div>
                            
                            {/* Issue Preview */}
                            {analysis.issues && analysis.issues.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center space-x-2 mb-1">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <div className="text-sm font-medium text-red-800">
                                    Critical {analysis.issues[0].type || 'Issue'}
                                  </div>
                                </div>
                                <div className="text-xs text-red-700">
                                  {(analysis.issues[0].description || analysis.issues[0].message || '').substring(0, 80)}...
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      
                      {/* Footer Badge */}
                      <div className="px-6 pb-6 flex items-center justify-between text-sm text-gray-500">
                        <span>Click to edit resume</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-6 text-sm text-gray-600">
            <a href="/contact" className="hover:text-gray-900 transition-colors">
              Contact Us
            </a>
            <a href="/privacy-policy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} JobSpark AI. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative">
            {!isUploading && (
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="h-6 w-6" />
              </button>
            )}

            {isUploading ? (
              // Engaging Upload Progress (Modal)
              <div className="p-12 text-center">
                <div className="mb-8">
                  {/* Enhanced Animated Icon */}
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                      <Zap className="h-8 w-8 text-blue-600 animate-bounce" />
                    </div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Our AI is hard at work
                  </h2>
                  
                  <div className="space-y-3 max-w-md mx-auto mb-8">
                    <p className="text-lg text-gray-700 font-medium">
                      Parsing your CV with AI
                    </p>
                    <p className="text-sm text-gray-600">
                      Extracting your experience, skills, and education into an editable format
                    </p>
                  </div>
                </div>
                
                {/* Animated Progress Dots */}
                <div className="flex justify-center space-x-2 mb-6">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                
                {/* Rotating Facts */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 max-w-md mx-auto transition-all duration-500 mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    {UPLOAD_FACTS[currentFactIndex].title}
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {UPLOAD_FACTS[currentFactIndex].text}
                  </p>
                </div>
                
                {/* Fact indicators */}
                <div className="flex justify-center space-x-1">
                  {UPLOAD_FACTS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentFactIndex ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Upload Interface
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your CV</h2>
                  <p className="text-gray-600">Upload your resume to get AI-powered review and improvements</p>
                </div>

                <div 
                  {...getRootProps()}
                  className={`border-2 border-dashed border-gray-300 rounded-xl p-12 transition-all duration-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                    isDragActive ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {isDragActive ? 'Drop your CV here!' : 'Drop Your CV Here'}
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                      PDF or Word document • Free review in 2 minutes
                    </p>
                    
                    <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                      Choose File
                    </button>
                    
                    <p className="text-gray-500 text-sm mt-4">
                      ✓ Secure upload ✓ Instant review ✓ Professional recommendations
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfile onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}