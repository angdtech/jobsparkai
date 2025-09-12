'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ResumeTemplate2 } from '@/components/CV/ResumeTemplate2'
import { FeedbackType } from '@/components/CV/CommentHighlight'
import { CommentPanel } from '@/components/CV/CommentPanel'

interface ResumeData {
  personalInfo: {
    name: string
    title: string
    email: string
    phone: string
    address: string
    summary: string
  }
  experience: Array<{
    id: string
    position: string
    company: string
    duration: string
    description: string
  }>
  education: Array<{
    id: string
    degree: string
    school: string
    duration: string
    description: string
  }>
  skills: Array<{
    id: string
    name: string
    level: number
  }>
  awards: Array<{
    id: string
    title: string
    year: string
    description: string
  }>
  languages: Array<{
    id: string
    name: string
    level: string
  }>
  hobbies?: string[]
}

interface CommentItem {
  type: FeedbackType
  category: string // "Grammar", "Tone", "Action Verbs", etc.
  title: string
  message: string
  suggestion?: string // AI's suggested replacement text
  severity?: 'low' | 'medium' | 'high'
  targetText: string // Specific text to highlight
}

interface AnalysisData {
  overall_score: number
  rating: string
  comments: CommentItem[] // Flattened list of all comments
}

// Single corporate template for CV review

function ResumePageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<ResumeData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedComments, setSelectedComments] = useState<{
    comments: CommentItem[]
    text: string
    position: { x: number; y: number }
  } | null>(null)
  const [editModeText, setEditModeText] = useState<string | null>(null)

  // Create default resume data structure with some intentional errors for testing
  const createDefaultResumeData = (): ResumeData => ({
    personalInfo: {
      name: 'John Smith',
      title: 'Sales Manger', // Intentional spelling error for testing
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      address: 'New York, NY',
      summary: 'Professional summary describing my experience in sales and team management. I have worked in various industries and improved sales performance.'
    },
    experience: [{
      id: 'exp-1',
      position: 'Sales Representative',
      company: 'ABC Company',
      duration: '2022 - Present',
      description: 'I did various tasks including managing client relationships and improved sales for the team. Responsible for meeting quotas and working with customers.'
    }],
    education: [{
      id: 'edu-1',
      degree: 'Your Degree',
      school: 'University Name',
      duration: '2018 - 2022',
      description: 'Relevant coursework or achievements'
    }],
    skills: [
      { id: 'skill-1', name: 'JavaScript', level: 85 },
      { id: 'skill-2', name: 'Project Management', level: 90 },
      { id: 'skill-3', name: 'Communication', level: 88 }
    ],
    awards: [{
      id: 'award-1',
      title: 'Employee of the Year',
      year: '2023',
      description: 'Recognized for outstanding performance'
    }],
    languages: [
      { id: 'lang-1', name: 'English', level: 'Native' },
      { id: 'lang-2', name: 'Spanish', level: 'Intermediate' }
    ]
  })

  // Load resume data from database
  const loadResumeData = useCallback(async () => {
    if (!sessionId || !user) {
      setIsLoading(false)
      return
    }

    try {
      // First try to get data from cv_content table
      const { data: cvContent, error: contentError } = await supabase
        .from('cv_content')
        .select('*')
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)
        .single()

      if (!contentError && cvContent) {
        // Format data from cv_content table
        const formattedData: ResumeData = {
          personalInfo: {
            name: cvContent.full_name || 'Your Name',
            title: 'Professional Title', // This might need to be extracted from summary
            email: cvContent.email || 'your.email@example.com',
            phone: cvContent.phone || '+1 (555) 123-4567',
            address: cvContent.location || 'Your City, Country',
            summary: cvContent.professional_summary || 'Professional summary describing your experience and expertise.'
          },
          experience: Array.isArray(cvContent.work_experience) 
            ? cvContent.work_experience.map((exp: any, index: number) => ({
                id: `exp-${index}`,
                position: exp.position || exp.title || '',
                company: exp.company || '',
                duration: exp.duration || exp.dates || '',
                description: exp.description || exp.responsibilities || ''
              }))
            : [],
          education: Array.isArray(cvContent.education)
            ? cvContent.education.map((edu: any, index: number) => ({
                id: `edu-${index}`,
                degree: edu.degree || edu.qualification || '',
                school: edu.school || edu.institution || '',
                duration: edu.duration || edu.dates || '',
                description: edu.description || ''
              }))
            : [],
          skills: Array.isArray(cvContent.skills)
            ? cvContent.skills.map((skill: any, index: number) => ({
                id: `skill-${index}`,
                name: typeof skill === 'string' ? skill : skill.name || '',
                level: skill.level || 80
              }))
            : [],
          awards: Array.isArray(cvContent.achievements)
            ? cvContent.achievements.map((award: any, index: number) => ({
                id: `award-${index}`,
                title: award.title || award.name || '',
                year: award.year || award.date || '',
                description: award.description || ''
              }))
            : [],
          languages: Array.isArray(cvContent.languages)
            ? cvContent.languages.map((lang: any, index: number) => ({
                id: `lang-${index}`,
                name: typeof lang === 'string' ? lang : lang.name || '',
                level: lang.level || 'Intermediate'
              }))
            : [],
          hobbies: Array.isArray(cvContent.hobbies) 
            ? cvContent.hobbies.map((hobby: any) => typeof hobby === 'string' ? hobby : hobby.name || '')
            : []
        }

        setResumeData(formattedData)
        setHistory([formattedData])
        setHistoryIndex(0)
        setIsLoading(false)
        return
      }

      // If no content found, check if session exists in auth_cv_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('auth_cv_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)
        .single()

      if (sessionError) {
        console.error('Session not found:', sessionError)
        // Create default data for new sessions
        const defaultData = createDefaultResumeData()
        setResumeData(defaultData)
        setHistory([defaultData])
        setHistoryIndex(0)
        setIsLoading(false)
        return
      }

      // Session exists but no content yet, create default data
      const defaultData = createDefaultResumeData()
      setResumeData(defaultData)
      setHistory([defaultData])
      setHistoryIndex(0)

    } catch (error) {
      console.error('Error loading resume data:', error)
      // Fallback to default data
      const defaultData = createDefaultResumeData()
      setResumeData(defaultData)
      setHistory([defaultData])
      setHistoryIndex(0)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, user])

  // Load analysis feedback data
  const loadAnalysisData = useCallback(async () => {
    if (!sessionId || !user) return

    try {
      const { data: analysisData, error } = await supabase
        .from('cv_ats_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)
        .single()

      if (!error && analysisData) {
        // Parse the JSONB fields
        const formattedAnalysis: AnalysisData = {
          overall_score: analysisData.overall_score || 0,
          rating: analysisData.rating || '',
          comments: Array.isArray(analysisData.comments) ? analysisData.comments : []
        }

        setAnalysisData(formattedAnalysis)
      }
    } catch (error) {
      console.error('Error loading analysis data:', error)
    }
  }, [sessionId, user])

  // Save resume data to database
  const saveResumeData = useCallback(async (data: ResumeData) => {
    if (!sessionId || !user || isSaving) return

    setIsSaving(true)
    try {
      // Prepare data for cv_content table
      const contentData = {
        session_id: sessionId,
        auth_user_id: user.id,
        full_name: data.personalInfo.name,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone,
        location: data.personalInfo.address,
        professional_summary: data.personalInfo.summary,
        work_experience: data.experience.map(exp => ({
          position: exp.position,
          company: exp.company,
          duration: exp.duration,
          description: exp.description
        })),
        education: data.education.map(edu => ({
          degree: edu.degree,
          school: edu.school,
          duration: edu.duration,
          description: edu.description
        })),
        skills: data.skills.map(skill => ({
          name: skill.name,
          level: skill.level
        })),
        achievements: data.awards.map(award => ({
          title: award.title,
          year: award.year,
          description: award.description
        })),
        languages: data.languages.map(lang => ({
          name: lang.name,
          level: lang.level
        })),
        hobbies: data.hobbies || [],
        updated_at: new Date().toISOString()
      }

      // Try to update existing record first
      const { error: updateError } = await supabase
        .from('cv_content')
        .update(contentData)
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)

      // If update fails (no existing record), try to insert
      if (updateError?.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('cv_content')
          .insert({
            ...contentData,
            created_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting resume data:', insertError)
        }
      } else if (updateError) {
        console.error('Error updating resume data:', updateError)
      }
    } catch (error) {
      console.error('Error saving resume data:', error)
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, user, isSaving])

  // Update resume data with history tracking
  const updateResumeData = useCallback((newData: ResumeData) => {
    setResumeData(newData)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    // Auto-save after a short delay
    const timeoutId = setTimeout(() => saveResumeData(newData), 1000)
    return () => clearTimeout(timeoutId)
  }, [history, historyIndex, saveResumeData])

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setResumeData(history[newIndex])
      saveResumeData(history[newIndex])
    }
  }, [historyIndex, history, saveResumeData])

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setResumeData(history[newIndex])
      saveResumeData(history[newIndex])
    }
  }, [historyIndex, history, saveResumeData])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (!sessionId) {
      router.push('/dashboard')
      return
    }

    loadResumeData()
    loadAnalysisData()
  }, [user, loading, sessionId, router, loadResumeData, loadAnalysisData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Get comments for specific text
  const getCommentsForText = useCallback((text: string) => {
    if (!analysisData) return []
    
    return analysisData.comments.filter(comment => 
      text.includes(comment.targetText)
    )
  }, [analysisData])

  // Handle showing comments
  const handleShowComments = useCallback((comments: CommentItem[], text: string, position: { x: number; y: number }) => {
    setSelectedComments({ comments, text, position })
  }, [])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }

  if (!user || !sessionId || !resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load resume data</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">CV Review</h1>
            {analysisData && (
              <span className="text-sm text-gray-600">
                Analysis loaded: {analysisData.comments.length} suggestions
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Undo/Redo */}
            <div className="flex items-center space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className={`p-2 rounded ${
                  historyIndex <= 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Undo (Ctrl+Z)"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={`p-2 rounded ${
                  historyIndex >= history.length - 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Redo (Ctrl+Y)"
              >
                ↷
              </button>
            </div>
            
            {/* Test Comments Button */}
            <button
              onClick={() => setAnalysisData({
                overall_score: 68,
                rating: 'Needs Improvement',
                comments: [
                  {
                    type: 'issue',
                    category: 'Spelling',
                    title: 'Spelling Error',
                    message: 'There is a spelling mistake in your professional title.',
                    suggestion: 'Sales Manager',
                    severity: 'high',
                    targetText: 'Sales Manger'
                  },
                  {
                    type: 'issue',
                    category: 'Action Verbs', 
                    title: 'Weak Action Verb',
                    message: 'Replace weak language with stronger action verbs to show impact.',
                    suggestion: 'I managed various tasks including client relationships and increased sales for the team.',
                    severity: 'medium',
                    targetText: 'I did various tasks including managing client relationships and improved sales for the team.'
                  },
                  {
                    type: 'recommendation',
                    category: 'Tone',
                    title: 'Professional Tone',
                    message: 'Use more professional language and avoid first person.',
                    suggestion: 'Building exceptional products for businesses to thrive, while delivering results across multiple projects.',
                    targetText: 'Building amazing products for businesses to thrive, whilst seeing my work put into motion, enables my success across multiple projects.'
                  },
                  {
                    type: 'issue',
                    category: 'Grammar',
                    title: 'Word Choice',
                    message: 'Use more precise business language.',
                    suggestion: 'Created and delivered the digital self-service strategy and roadmap.',
                    severity: 'low',
                    targetText: 'Creation and delivery of the digital self-service strategy and roadmap.'
                  }
                ]
              })}
              className="text-xs bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded font-medium"
            >
              Test Comments
            </button>

            {/* Save Status */}
            {isSaving && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Saving...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Content */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <ResumeTemplate2
            data={resumeData}
            onDataChange={updateResumeData}
            isEditable={true}
            getCommentsForText={getCommentsForText}
            onShowComments={handleShowComments}
            editModeText={editModeText}
            onEditModeTextChange={setEditModeText}
          />
        </div>
      </div>

      {/* Comment Panel */}
      {selectedComments && (
        <CommentPanel
          comments={selectedComments.comments}
          originalText={selectedComments.text}
          position={selectedComments.position}
          onClose={() => setSelectedComments(null)}
          onApplySuggestion={(oldText, newText) => {
            // Apply suggestion to resume data
            const newData = JSON.parse(JSON.stringify(resumeData))
            
            // Function to recursively find and replace text in the data structure
            const replaceTextInObject = (obj: any): any => {
              if (typeof obj === 'string') {
                return obj.replace(oldText, newText)
              }
              if (Array.isArray(obj)) {
                return obj.map(replaceTextInObject)
              }
              if (obj && typeof obj === 'object') {
                const result: any = {}
                for (const key in obj) {
                  result[key] = replaceTextInObject(obj[key])
                }
                return result
              }
              return obj
            }
            
            const updatedData = replaceTextInObject(newData)
            updateResumeData(updatedData)
            setSelectedComments(null)
          }}
          onEditManually={(text) => {
            // Open edit mode for this specific text
            setEditModeText(text)
            setSelectedComments(null)
          }}
          onGenerateMore={(text) => {
            // Call AI to generate more suggestions for this text
            console.log('Generate more suggestions for:', text)
          }}
        />
      )}
    </div>
  )
}

export default function ResumePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    }>
      <ResumePageContent />
    </Suspense>
  )
}