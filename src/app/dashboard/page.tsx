'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { CVSessionManager, CVSession } from '@/lib/database'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Zap, Eye, Trash2, Calendar, FileCheck } from 'lucide-react'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [cvSessions, setCvSessions] = useState<CVSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      redirect('/')
    }
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchUserSessions()
    }
  }, [user])

  const fetchUserSessions = async () => {
    if (!user) return

    try {
      const sessions = await CVSessionManager.getUserSessions(user.id)
      setCvSessions(sessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !user) return

    setIsUploading(true)
    setUploadStep(1)

    try {
      // First create a session
      setUploadStep(1)
      const session = await CVSessionManager.createSession(user.id)
      if (!session) {
        throw new Error('Failed to create session')
      }

      // Create form data with correct field names
      const formData = new FormData()
      formData.append('cv_file', file)
      formData.append('session_id', session.session_id)
      
      // Step 2: Upload file
      setUploadStep(2)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Visual delay
      
      const uploadResponse = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      const sessionId = session.session_id

      // Step 3: Analyze
      setUploadStep(3)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Close modal and refresh sessions
      setShowUploadModal(false)
      setIsUploading(false)
      setUploadStep(0)
      await fetchUserSessions()

      // Redirect to analysis results
      router.push(`/cv/${sessionId}`)
      
    } catch (error) {
      console.error('Upload failed:', error)
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
      const success = await CVSessionManager.deleteSession(sessionId)
      if (success) {
        await fetchUserSessions() // Refresh the list
      } else {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <header className="mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                + Add CV
              </button>
              <button
                onClick={signOut}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Your CV Sessions</h2>
            
            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading sessions...</p>
              </div>
            ) : cvSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No CV sessions yet</h3>
                <p className="text-gray-600 mb-4">Create your first CV session to get started with résumé analysis.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add Your First CV
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cvSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 truncate">
                            {session.file_name || 'Untitled CV'}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center space-x-1">
                        {session.is_paid ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FileCheck className="h-3 w-3 mr-1" />
                            Analyzed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Session ID</div>
                      <div className="text-xs font-mono text-gray-800 truncate">{session.session_id}</div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => router.push(`/cv/${session.session_id}`)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Analysis</span>
                      </button>
                      
                      <button
                        onClick={() => deleteCV(session.session_id)}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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
              // Upload Progress
              <div className="p-12 text-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    {uploadStep === 1 && <Upload className="h-8 w-8 text-white animate-bounce" />}
                    {uploadStep === 2 && <FileText className="h-8 w-8 text-white animate-pulse" />}
                    {uploadStep === 3 && <Zap className="h-8 w-8 text-white animate-spin" />}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {uploadStep === 1 && "Uploading Your CV..."}
                    {uploadStep === 2 && "Reading Your CV..."}
                    {uploadStep === 3 && "Analyzing for Issues..."}
                  </h2>
                  
                  <p className="text-gray-600 mb-8">
                    {uploadStep === 1 && "Securely uploading your file"}
                    {uploadStep === 2 && "Extracting text and formatting details"}
                    {uploadStep === 3 && "AI is finding critical issues that cost you interviews"}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(uploadStep / 3) * 100}%` }}
                  ></div>
                </div>
                
                <p className="text-gray-500 text-sm">
                  Step {uploadStep} of 3 • Please don't close this window
                </p>
              </div>
            ) : (
              // Upload Interface
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your CV</h2>
                  <p className="text-gray-600">Upload your resume to get AI-powered analysis and improvements</p>
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
                      PDF or Word document • Free analysis in 2 minutes
                    </p>
                    
                    <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                      Choose File
                    </button>
                    
                    <p className="text-gray-500 text-sm mt-4">
                      ✓ Secure upload ✓ Instant analysis ✓ Professional recommendations
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}