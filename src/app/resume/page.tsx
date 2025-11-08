'use client'

import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ResumeTemplate2 } from '@/components/CV/ResumeTemplate2'
import { FeedbackType } from '@/components/CV/CommentHighlight'
import { CommentPanel } from '@/components/CV/CommentPanel'
import { CVChatbot } from '@/components/CV/CVChatbot'
import { trackUserInteraction } from '@/lib/analytics'
import { MessageCircle, Download } from 'lucide-react'

interface ResumeData {
  personalInfo: {
    name: string
    title: string
    email: string
    phone: string
    address: string
    summary: string
    tagline?: string
    website?: string
    linkedin?: string
  }
  experience: Array<{
    id: string
    position: string
    company: string
    duration: string
    description: string
    description_items?: string[] | null
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


// Single corporate template for CV review

function ResumePageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<ResumeData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedComments, setSelectedComments] = useState<{
    comments: CommentItem[]
    text: string
    position: { x: number; y: number }
  } | null>(null)
  const [editModeText, setEditModeText] = useState<string | null>(null)
  const [showChatbot, setShowChatbot] = useState(true)
  const [hideContactDetails, setHideContactDetails] = useState(false)
  const [hidePhoto, setHidePhoto] = useState(false)
  const [sectionLayout, setSectionLayout] = useState({
    sidebar: ['photo', 'contact', 'skills', 'languages'],
    main: ['profile', 'achievements', 'experience', 'education']
  })
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const resumeRef = useRef<HTMLDivElement>(null)

  // Rotating facts for loading screen
  const LOADING_FACTS = [
    {
      title: "Did you know?",
      text: "75% of resumes are rejected by ATS systems before a human ever sees them."
    },
    {
      title: "Pro tip:",
      text: "Recruiters spend only 7.4 seconds scanning a resume. Every word needs to count."
    },
    {
      title: "Industry insight:",
      text: "Resumes with quantified achievements get 40% more interview callbacks than generic descriptions."
    },
    {
      title: "Quick fact:",
      text: "Using action verbs like 'Led', 'Increased', or 'Developed' makes your CV 33% more likely to get noticed."
    },
    {
      title: "Expert advice:",
      text: "Tailoring your CV to each job description can increase your interview chances by up to 50%."
    }
  ]

  // Create default resume data structure with some intentional errors for testing
  const createDefaultResumeData = (): ResumeData => ({
    personalInfo: {
      name: 'John Smith',
      title: 'Sales Manger', // Intentional spelling error for testing
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      address: 'New York, NY',
      summary: 'I am a dedicated sales professional with experience in managing teams and improving performance. I have been responsible for various tasks and have worked hard to achieve results across different projects.'
    },
    experience: [{
      id: 'exp-1',
      position: 'Sales Representative',
      company: 'ABC Company',
      duration: '2022 - Present',
      description: 'I did various tasks including managing client relationships and improved sales for the team. Responsible for meeting quotas and working with customers.',
      description_items: [
        'Managed client relationships while consistently exceeding sales targets.',
        'Collaborated with internal teams to resolve customer issues quickly.',
        'Used CRM insights to identify upsell opportunities and grow revenue.'
      ]
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
      return
    }

    const parsingInProgress = sessionStorage.getItem('parsing_in_progress') === sessionId
    
    if (parsingInProgress) {
      setIsLoading(true)
    }
    
    try {
      // First try to get data from cv_content table - ONLY for current user
      const { data: cvContent, error: contentError } = await supabase
        .from('cv_content')
        .select('*')
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!contentError && cvContent) {
        console.log('Loading existing CV content for session:', sessionId, {
          hasContent: !!cvContent,
          hasName: !!cvContent.full_name
        })
        
        // Format data from cv_content table
        const formattedData: ResumeData = {
          personalInfo: {
            name: cvContent.full_name || 'Your Name',
            title: 'Professional Title',
            email: cvContent.email || 'your.email@example.com',
            phone: cvContent.phone || '+1 (555) 123-4567',
            address: cvContent.location || 'Your City, Country',
            summary: cvContent.professional_summary || 'Professional summary describing your experience and expertise.',
            website: cvContent.website_url || undefined,
            linkedin: cvContent.linkedin_url || undefined
          },
          experience: Array.isArray(cvContent.work_experience) 
            ? cvContent.work_experience.map((exp: any, index: number) => {
                const normalizeBullet = (val: any) => {
                  if (!val) return ''
                  const raw = typeof val === 'string'
                    ? val
                    : (
                        val.text ??
                        val.description ??
                        val.content ??
                        val.value ??
                        ''
                      )
                  return raw
                    .toString()
                    .replace(/\r/g, '')
                    .replace(/^[•*\-\d\.\)\s]+/, '')
                    .trim()
                }

                const rawDescription = (
                  exp.description ||
                  exp.responsibilities ||
                  ''
                ).toString()

                let normalizedItems: string[] | null = null

                if (Array.isArray(exp.description_items)) {
                  const mapped = exp.description_items
                    .map(normalizeBullet)
                    .filter(Boolean)
                  normalizedItems = mapped.length > 0 ? mapped : null
                } else if (typeof exp.description_items === 'string') {
                  const mapped = exp.description_items
                    .split(/\n+/)
                    .map(normalizeBullet)
                    .filter(Boolean)
                  normalizedItems = mapped.length > 0 ? mapped : null
                }

                if (!normalizedItems || normalizedItems.length === 0) {
                  const derived = rawDescription
                    .split(/\n+/)
                    .map(normalizeBullet)
                    .filter(Boolean)
                  normalizedItems = derived.length > 0 ? derived : null
                }

                const descriptionText = normalizedItems && normalizedItems.length > 0
                  ? normalizedItems.join('\n')
                  : rawDescription.trim()

                return {
                  id: `exp-${index}`,
                  position: exp.position || exp.title || '',
                  company: exp.company || '',
                  duration: exp.duration || exp.dates || (exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : exp.start_date || ''),
                  description: descriptionText,
                  description_items: normalizedItems
                }
              })
            : [],
          education: Array.isArray(cvContent.education)
            ? cvContent.education.map((edu: any, index: number) => ({
                id: `edu-${index}`,
                degree: edu.degree || edu.qualification || '',
                school: edu.school || edu.institution || '',
                duration: edu.duration || edu.dates || (edu.start_date && edu.end_date ? `${edu.start_date} - ${edu.end_date}` : edu.start_date || ''),
                description: edu.description || ''
              }))
            : [],
          skills: cvContent.skills 
            ? (typeof cvContent.skills === 'object' && !Array.isArray(cvContent.skills)
                ? // Complex categorized format - convert to flat array for template
                  Object.values(cvContent.skills).flat().map((skill: any, index: number) => ({
                    id: `skill-${index}`,
                    name: typeof skill === 'string' ? skill : skill.name || '',
                    level: skill.level || 80
                  }))
                : Array.isArray(cvContent.skills) 
                  ? cvContent.skills.map((skill: any, index: number) => ({ // Old array format
                      id: `skill-${index}`,
                      name: typeof skill === 'string' ? skill : skill.name || '',
                      level: skill.level || 80
                    }))
                  : []
              )
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
        
        if (parsingInProgress) {
          sessionStorage.removeItem('parsing_in_progress')
          setIsLoading(false)
        }
        return
      }

      // If no content found, check if session exists in auth_cv_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('auth_cv_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (sessionError) {
        console.error('Session not found:', sessionError)
        if (parsingInProgress) {
          setIsLoading(false)
        }
        return
      }

      if (parsingInProgress) {
        console.log('Session exists but no CV content found - parsing in progress')
      } else {
        console.log('Session exists but no CV content found - parsing may have failed')
      }

    } catch (error) {
      console.error('Error loading resume data:', error)
      if (parsingInProgress) {
        setIsLoading(false)
      }
    }
  }, [sessionId, user])

  // Load analysis feedback data

  // Save resume data to database
  const saveResumeData = useCallback(async (data: ResumeData) => {
    if (!sessionId || !user || isSaving) return

    setIsSaving(true)
    try {
      // Prepare data for cv_content table with proper field mapping
      const contentData = {
        session_id: sessionId,
        auth_user_id: user.id,
        full_name: data.personalInfo.name || '',
        email: data.personalInfo.email || '',
        phone: data.personalInfo.phone || '',
        location: data.personalInfo.address || '',
        linkedin_url: data.personalInfo.linkedin || null,
        website_url: data.personalInfo.website || null,
        professional_summary: data.personalInfo.summary || '',
        work_experience: data.experience?.map(exp => {
          const normalizedItems = Array.isArray(exp.description_items)
            ? exp.description_items
                .map((item) => {
                  if (!item) return ''
                  const text = typeof item === 'string' ? item : item.toString()
                  return text.replace(/\r/g, '').trim()
                })
                .filter(Boolean)
            : []

          return {
            position: exp.position || '',
            company: exp.company || '',
            duration: exp.duration || '',
            description: (exp.description || '').toString(),
            description_items: normalizedItems.length > 0 ? normalizedItems : null
          }
        }) || [],
        education: data.education?.map(edu => ({
          degree: edu.degree || '',
          school: edu.school || '',
          duration: edu.duration || '',
          description: edu.description || ''
        })) || [],
        skills: Array.isArray(data.skills) 
          ? data.skills.map(skill => ({
              name: skill.name || '',
              level: skill.level || 0
            }))
          : data.skills || [], // Keep categorized format as-is
        achievements: data.awards?.map(award => ({
          title: award.title || '',
          year: award.year || '',
          description: award.description || ''
        })) || [],
        languages: data.languages?.map(lang => ({
          name: lang.name || '',
          level: lang.level || ''
        })) || [],
        updated_at: new Date().toISOString()
      }

      console.log('📝 Attempting to save resume data:', { 
        sessionId, 
        userId: user.id, 
        dataKeys: Object.keys(contentData) 
      })

      // Check if record exists first
      const { data: existingRecord, error: selectError } = await supabase
        .from('cv_content')
        .select('id')
        .eq('session_id', sessionId)
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (selectError) {
        console.error('❌ Error checking existing record:', selectError)
        throw selectError
      }

      let result = null
      let operationError = null
      
      if (existingRecord) {
        // Record exists, update it
        console.log('🔄 Updating existing record:', existingRecord.id)
        const { data: updateResult, error } = await supabase
          .from('cv_content')
          .update(contentData)
          .eq('id', existingRecord.id)
          .select()
        
        result = updateResult
        operationError = error
        
        if (error) {
          console.error('❌ Update failed:', error)
          throw new Error(`Update failed: ${error.message || JSON.stringify(error)}`)
        } else {
          console.log('✅ Update successful:', updateResult?.length, 'records updated')
        }
      } else {
        // No record exists, insert new one
        console.log('➕ Creating new record')
        const { data: insertResult, error: insertError } = await supabase
          .from('cv_content')
          .insert({
            ...contentData,
            created_at: new Date().toISOString()
          })
          .select()
        
        result = insertResult
        operationError = insertError
        
        if (insertError) {
          console.error('❌ Insert failed:', insertError)
          throw new Error(`Insert failed: ${insertError.message || JSON.stringify(insertError)}`)
        } else {
          console.log('✅ Insert successful:', insertResult?.length, 'records created')
        }
      }

    } catch (error: any) {
      console.error('❌ Error saving resume data:', error)
      console.error('Session ID:', sessionId)
      console.error('User ID:', user?.id)
      
      // Show user-friendly error message
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, user, isSaving])

  // Update resume data with history tracking
  const updateResumeData = useCallback((newData: ResumeData) => {
    setResumeData(newData)
    
    // Add to history using functional updates to avoid stale closures
    setHistoryIndex(prevIndex => {
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, prevIndex + 1)
        newHistory.push(newData)
        return newHistory
      })
      return prevIndex + 1
    })
    
    // Track CV edit interaction
    trackUserInteraction({
      interactionType: 'cv_edit',
      metadata: {
        sessionId,
        hasName: !!newData.personalInfo?.name,
        experienceCount: newData.experience?.length || 0,
        educationCount: newData.education?.length || 0,
      }
    })
    
    // Auto-save after a short delay
    setTimeout(() => saveResumeData(newData), 1000)
  }, [saveResumeData, sessionId])

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

  // Download CV as PDF using server-side Puppeteer
  const downloadPDF = async () => {
    if (!resumeRef.current) return
    
    // Track PDF download
    trackUserInteraction({
      interactionType: 'pdf_download',
      metadata: {
        sessionId,
        cvName: resumeData?.personalInfo?.name || 'Unknown',
      }
    })
    
    setIsDownloadingPDF(true)
    try {
      const element = resumeRef.current
      
      // Get all stylesheets
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n')
          } catch (e) {
            return ''
          }
        })
        .join('\n')
      
      // Create full HTML document
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              ${styles}
              /* Hide only interactive buttons for PDF */
              button {
                display: none !important;
              }
              /* Hide empty sections */
              section:empty,
              div:empty {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `
      
      // Send to API route for PDF generation
      const response = await fetch('/api/cv/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          name: resumeData?.personalInfo.name || 'CV'
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      // Download the PDF
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeData?.personalInfo.name || 'CV'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

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
    
    // Poll for parsing completion if upload is in progress
    const parsingSession = sessionStorage.getItem('parsing_in_progress')
    if (parsingSession === sessionId) {
      const pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from('cv_content')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle()
        
        if (data) {
          // Parsing complete! Reload data and stop polling
          sessionStorage.removeItem('parsing_in_progress')
          clearInterval(pollInterval)
          loadResumeData()
        }
      }, 2000) // Check every 2 seconds
      
      return () => clearInterval(pollInterval)
    }
  }, [user, loading, sessionId, router, loadResumeData])

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

  // Get comments for specific text - simplified (no analysis)
  const getCommentsForText = useCallback((text: string) => {
    return [] // No analysis comments
  }, [])

  // Handle showing comments
  const handleShowComments = useCallback((comments: CommentItem[], text: string, position: { x: number; y: number }) => {
    setSelectedComments({ comments, text, position })
  }, [])

  // Cycle through facts while loading
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % LOADING_FACTS.length)
      }, 4000) // Change fact every 4 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading, LOADING_FACTS.length])

  if (loading || isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
          {/* Animated Icon Container */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-blue-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {/* Rotating ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Analyzing Your CV
          </h2>
          
          <p className="text-gray-600 mb-6">
            Our AI is reading your CV and extracting your experience, skills, and achievements.
          </p>
          
          {/* Animated Progress Dots */}
          <div className="flex justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>

          {/* Rotating Facts */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 transition-all duration-500">
            <p className="text-sm text-blue-800 font-medium mb-2">
              {LOADING_FACTS[currentFactIndex].title}
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              {LOADING_FACTS[currentFactIndex].text}
            </p>
          </div>
          
          {/* Fact indicators */}
          <div className="flex justify-center space-x-1 mt-4">
            {LOADING_FACTS.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentFactIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !sessionId) {
    return null
  }
  
  if (!resumeData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Resume Content with Chatbot */}
      <div className="flex h-screen">
        {/* Resume Section */}
        <div className="flex-1 overflow-y-auto py-8 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back to Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            {/* Action buttons above CV */}
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={() => setHideContactDetails(!hideContactDetails)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-medium"
              >
                {hideContactDetails ? 'Show Contact Details' : 'Hide Contact Details'}
              </button>

              <button
                onClick={() => setHidePhoto(!hidePhoto)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-medium"
              >
                {hidePhoto ? 'Show Photo' : 'Hide Photo'}
              </button>

              <button
                onClick={downloadPDF}
                disabled={isDownloadingPDF}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download as PDF"
              >
                <Download className="h-4 w-4" />
                {isDownloadingPDF ? 'Generating...' : 'Download PDF'}
              </button>

              {/* Save Status */}
              {isSaving && (
                <div className="flex items-center text-sm text-gray-600 ml-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Saving...
                </div>
              )}
            </div>

            {/* CV */}
            <div ref={resumeRef} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <ResumeTemplate2
              data={resumeData}
              onDataChange={updateResumeData}
              isEditable={true}
              getCommentsForText={getCommentsForText}
              onShowComments={handleShowComments}
              editModeText={editModeText}
              onEditModeTextChange={setEditModeText}
              hideContactDetails={hideContactDetails}
              hidePhoto={hidePhoto}
              sectionLayout={sectionLayout}
              onSectionLayoutChange={setSectionLayout}
            />
            </div>
          </div>
        </div>

        {/* Chatbot Section - Sidebar */}
        {resumeData && showChatbot && (
          <div className="w-[500px] border-l border-gray-200 bg-white flex flex-col">
            <CVChatbot
              resumeData={resumeData}
              onClose={() => setShowChatbot(false)}
              onUpdateResume={updateResumeData}
            />
          </div>
        )}
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
