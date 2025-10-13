'use client'

import { useState, useEffect } from 'react'
import { SmartText } from './SmartText'
import { EditableText } from './EditableText'
import { FeedbackType } from './CommentHighlight'

interface CommentItem {
  type: FeedbackType
  category: string
  title: string
  message: string
  suggestion?: string
  severity?: 'low' | 'medium' | 'high'
  targetText: string
}

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

interface ResumeTemplate2Props {
  data: ResumeData
  onDataChange: (data: ResumeData) => void
  isEditable?: boolean
  getCommentsForText?: (text: string) => CommentItem[]
  onShowComments?: (comments: CommentItem[], text: string, position: { x: number; y: number }) => void
  editModeText?: string | null
  onEditModeTextChange?: (text: string | null) => void
}

export function ResumeTemplate2({ 
  data, 
  onDataChange, 
  isEditable = false, 
  getCommentsForText, 
  onShowComments, 
  editModeText, 
  onEditModeTextChange 
}: ResumeTemplate2Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(data)
  const [showSummaryQuestions, setShowSummaryQuestions] = useState(false)
  const [summaryAnswers, setSummaryAnswers] = useState({
    targetRole: '',
    keyAchievement: '',
    yearsExperience: '',
    specialization: '',
    industryFocus: '',
    uniqueValue: ''
  })
  const [newAchievementText, setNewAchievementText] = useState('')
  const [showAddAchievement, setShowAddAchievement] = useState(false)
  const [experienceImprovementMode, setExperienceImprovementMode] = useState(false)
  const [hoveredImprovement, setHoveredImprovement] = useState<{
    expIndex: number
    itemIndex: number
    suggestion: string
    original: string
  } | null>(null)
  const [improvementSuggestions, setImprovementSuggestions] = useState<{
    [key: string]: Array<{
      original: string
      improved: string
      reason: string
      severity: 'minor' | 'major'
      actionType?: 'improve' | 'remove' | 'consolidate' | 'merge'
      duplicateOf?: number
      mergeWith?: string[]
    }>
  }>({})
  const [aiReviewScore, setAiReviewScore] = useState<number | null>(null)
  const [aiReviewSummary, setAiReviewSummary] = useState<string | null>(null)
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    expIndex: number
    itemIndex: number
    text: string
  } | null>(null)
  const [hoveredDeleteButton, setHoveredDeleteButton] = useState<{
    expIndex: number
    itemIndex: number
  } | null>(null)
  const [hoveredAchievementDelete, setHoveredAchievementDelete] = useState<number | null>(null)
  const [hoveredEducationDelete, setHoveredEducationDelete] = useState<number | null>(null)
  const [hoveredSkillDelete, setHoveredSkillDelete] = useState<string | number | null>(null)
  const [hoveredLanguageDelete, setHoveredLanguageDelete] = useState<number | null>(null)
  const [hoveredExperienceDelete, setHoveredExperienceDelete] = useState<number | null>(null)
  const [showSummaryFeedback, setShowSummaryFeedback] = useState(true)

  const handleSave = () => {
    onDataChange(editData)
    setIsEditing(false)
  }

  // Auto-hide summary feedback after 5 seconds
  useEffect(() => {
    if (showSummaryFeedback) {
      const timer = setTimeout(() => {
        setShowSummaryFeedback(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showSummaryFeedback])

  const handleCancel = () => {
    setEditData(data)
    setIsEditing(false)
  }

  const updateField = (path: string, value: any) => {
    const pathArray = path.split('.')
    const newData = JSON.parse(JSON.stringify(editData))
    
    let current = newData
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]]
    }
    current[pathArray[pathArray.length - 1]] = value
    
    setEditData(newData)
  }

  const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(editData))
    newData[arrayName][index][field] = value
    
    if (arrayName === 'experience' && field === 'description') {
      const normalized = (value ?? '').toString().replace(/\r/g, '')
      const parsedItems = normalized
        .split(/\n+/)
        .map((line: string) => line.replace(/^[•*\-\d\.\)\s]+/, '').trim())
        .filter(Boolean)

      newData[arrayName][index].description = parsedItems.length > 0
        ? parsedItems.join('\n')
        : normalized.trim()
      newData[arrayName][index].description_items = parsedItems.length > 0 ? parsedItems : null
    }

    setEditData(newData)
  }

  const addArrayItem = (arrayName: string, newItem: any) => {
    const newData = JSON.parse(JSON.stringify(editData))
    newData[arrayName].push(newItem)
    setEditData(newData)
  }

  const removeArrayItem = (arrayName: string, index: number) => {
    const newData = JSON.parse(JSON.stringify(editData))
    newData[arrayName].splice(index, 1)
    setEditData(newData)
  }

  const currentData = isEditing ? editData : data

  // Generate personalized summary based on user answers
  // AI Recruiter Review - gets real feedback from experienced recruiter
  const generateExperienceImprovements = async () => {
    console.log('🔍 Starting AI recruiter review')
    setIsLoadingReview(true)
    setExperienceImprovementMode(true)
    
    try {
      const response = await fetch('/api/cv/review-experience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experienceData: currentData.experience,
          jobTitle: currentData.personalInfo.title || 'Professional'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('🤖 AI Review Result:', result)

      if (!result.success || !result.review) {
        throw new Error('Invalid AI review response')
      }

      // Convert AI review to our format
      const suggestions: { [key: string]: Array<{ original: string; improved: string; reason: string; severity: 'minor' | 'major'; actionType?: 'improve' | 'remove' | 'consolidate' | 'merge'; duplicateOf?: number; mergeWith?: string[] }> } = {}
      
      result.review.improvements.forEach((improvement: any) => {
        const key = `exp-${improvement.experienceIndex}`
        if (!suggestions[key]) {
          suggestions[key] = []
        }
        
        suggestions[key].push({
          original: improvement.originalText,
          improved: improvement.improvedText,
          reason: improvement.reason,
          severity: improvement.severity === 'critical' ? 'major' : 'minor',
          actionType: improvement.actionType || 'improve',
          duplicateOf: improvement.duplicateOf,
          mergeWith: improvement.mergeWith
        })
      })

      console.log('📊 AI Review Summary:', {
        overallScore: result.review.overallScore,
        summary: result.review.summary,
        totalImprovements: result.review.improvements.length
      })

      setImprovementSuggestions(suggestions)
      setAiReviewScore(result.review.overallScore)
      setAiReviewSummary(result.review.summary)
      setIsLoadingReview(false)
      
      console.log(`🎯 Overall Experience Score: ${result.review.overallScore}/10`)
      console.log(`📝 Recruiter Summary: ${result.review.summary}`)

      // Scroll to experience section after AI results are ready
      setTimeout(() => {
        const experienceElement = document.querySelector('[data-section="experience"]')
        if (experienceElement) {
          experienceElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)

    } catch (error) {
      console.error('❌ AI review failed:', error)
      
      // Fallback to basic review if AI fails
      const suggestions: { [key: string]: Array<{ original: string; improved: string; reason: string; severity: 'minor' | 'major' }> } = {}
      
      currentData.experience.forEach((exp, expIndex) => {
        const key = `exp-${expIndex}`
        suggestions[key] = []
        
        const items = exp.description_items || (exp.description ? exp.description.split('\n').filter(line => line.trim()) : [])
        
        items.forEach(item => {
          const trimmedItem = item.trim()
          if (trimmedItem && trimmedItem.toLowerCase().includes('responsible for')) {
            suggestions[key].push({
              original: trimmedItem,
              improved: trimmedItem.replace(/responsible for/gi, 'Led'),
              reason: 'AI review failed - basic passive language fix applied',
              severity: 'major'
            })
          }
        })
      })
      
      setImprovementSuggestions(suggestions)
      setIsLoadingReview(false)
      alert('AI review temporarily unavailable. Using basic review.')
      
      // Scroll to experience section after fallback results are ready
      setTimeout(() => {
        const experienceElement = document.querySelector('[data-section="experience"]')
        if (experienceElement) {
          experienceElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const generatePersonalizedSummary = () => {
    const { targetRole, keyAchievement, yearsExperience, specialization, industryFocus, uniqueValue } = summaryAnswers
    
    // Build summary components
    let summaryParts = []
    
    // Opening with role and experience
    if (targetRole && yearsExperience) {
      summaryParts.push(`${targetRole} with ${yearsExperience} years of experience`)
    } else if (targetRole) {
      summaryParts.push(`Experienced ${targetRole}`)
    } else {
      summaryParts.push('Experienced professional')
    }
    
    // Add specialization and industry focus
    if (specialization && industryFocus) {
      summaryParts.push(`specializing in ${specialization} within the ${industryFocus} industry`)
    } else if (specialization) {
      summaryParts.push(`specializing in ${specialization}`)
    } else if (industryFocus) {
      summaryParts.push(`with extensive experience in ${industryFocus}`)
    }
    
    // Add key achievement
    if (keyAchievement) {
      summaryParts.push(`Successfully ${keyAchievement.toLowerCase()}`)
    }
    
    // Add unique value proposition
    if (uniqueValue) {
      summaryParts.push(`${uniqueValue}`)
    }
    
    // Join parts into a coherent summary
    let summary = summaryParts[0]
    if (summaryParts.length > 1) {
      summary += ' ' + summaryParts.slice(1, -1).join(', ')
      if (summaryParts.length > 2) {
        summary += '. ' + summaryParts[summaryParts.length - 1]
      } else {
        summary += ' ' + summaryParts[summaryParts.length - 1]
      }
    }
    
    // Ensure it ends with a period
    if (!summary.endsWith('.')) {
      summary += '.'
    }
    
    return summary
  }

  return (
    <div className="relative">
      {/* Edit Button */}
      {isEditable && (
        <div className="absolute top-4 right-4 z-10">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Edit Resume
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto bg-white flex min-h-screen relative">
        {/* CV Improvement Task Panel */}
        {!isEditing && (
          <div className="fixed right-4 top-20 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 max-h-[80vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">CV Improvement Tasks</h3>
              <p className="text-sm text-gray-600">Complete these to optimize your CV</p>
            </div>
            
            <div className="space-y-3">
              {/* Task 1: Tagline - Only show if not completed */}
              {!currentData.personalInfo.tagline && (
                <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">Professional Tagline</span>
                    <span className="text-yellow-600 text-sm">⚠ Current</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Add a tagline to grab recruiter attention in 6 seconds
                  </p>
                  <button 
                    onClick={() => {
                      const taglineElement = document.querySelector('[data-section="tagline"]')
                      if (taglineElement) {
                        taglineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
                  >
                    Add Tagline
                  </button>
                </div>
              )}

              {/* Task 2: Summary - Show as current when tagline is done */}
              {currentData.personalInfo.tagline && (
                (() => {
                  const summary = currentData.personalInfo.summary || ''
                  const hasGoodLength = summary.length > 100 && summary.length < 600
                  const hasQuantifiedResults = /\d+[%$]|\d+\s*(years?|months?)|increased|improved|reduced|grew|achieved/i.test(summary)
                  const hasActionVerbs = /led|managed|developed|created|implemented|delivered|optimized|launched|spearheaded|established|recognized|driving|proven/i.test(summary)
                  const hasRelevantKeywords = /product\s*manager|digital|mobile|agile|strategy|roadmap|stakeholder|user\s*experience|data\s*driven|strategic|innovation|automation|engagement|leadership/i.test(summary)
                  const isWellStructured = summary.split('.').length >= 3
                  
                  const summaryComplete = hasGoodLength && hasQuantifiedResults && hasActionVerbs && hasRelevantKeywords && isWellStructured
                  
                  return (
                    <div className={`p-3 rounded-lg border ${summaryComplete ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">Professional Summary</span>
                        {summaryComplete ? (
                          <span className="text-green-600 text-sm">✓ Complete</span>
                        ) : (
                          <span className="text-blue-600 text-sm">→ Current</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {summaryComplete ? 
                          'Excellent summary with quantified achievements and keywords!' :
                          summary.length < 50 ? 
                            'Add a compelling summary that highlights your key achievements' :
                            'Improve your summary with specific metrics and action verbs'
                        }
                      </p>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => {
                            const summaryElement = document.querySelector('[data-section="summary"]')
                            if (summaryElement) {
                              summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                          }}
                          className={`text-xs px-2 py-1 rounded text-white flex-1 ${summaryComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {summaryComplete ? 'Review' : summary.length < 50 ? 'Add' : 'Improve'} Summary
                        </button>
                        {!summaryComplete && (
                          <button 
                            onClick={() => {
                              setShowSummaryQuestions(true)
                              setTimeout(() => {
                                const summaryElement = document.querySelector('[data-section="summary"]')
                                if (summaryElement) {
                                  summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 100)
                            }}
                            className="text-xs px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white"
                            title="Create personalized summary"
                          >
                            ✨
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })()
              )}

              {/* Completed Tagline - Show as collapsed completed task */}
              {currentData.personalInfo.tagline && (
                <div className="p-2 rounded-lg border bg-green-50 border-green-200 opacity-75">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">✓ Professional Tagline</span>
                    <span className="text-green-600 text-xs">Complete</span>
                  </div>
                </div>
              )}

              {/* Future tasks - only show when summary is complete */}
              {(() => {
                const summary = currentData.personalInfo.summary || ''
                const hasGoodLength = summary.length > 100 && summary.length < 600
                const hasQuantifiedResults = /\d+[%$]|\d+\s*(years?|months?)|increased|improved|reduced|grew|achieved/i.test(summary)
                const hasActionVerbs = /led|managed|developed|created|implemented|delivered|optimized|launched|spearheaded|established|recognized|driving|proven/i.test(summary)
                const hasRelevantKeywords = /product\s*manager|digital|mobile|agile|strategy|roadmap|stakeholder|user\s*experience|data\s*driven|strategic|innovation|automation|engagement|leadership/i.test(summary)
                const isWellStructured = summary.split('.').length >= 3
                
                const summaryComplete = hasGoodLength && hasQuantifiedResults && hasActionVerbs && hasRelevantKeywords && isWellStructured
                
                return summaryComplete && (() => {
                  const hasAchievements = currentData.awards && currentData.awards.length > 0
                  const achievementsCount = currentData.awards ? currentData.awards.length : 0
                  const achievementsComplete = achievementsCount >= 3
                  
                  if (achievementsComplete) {
                    return (
                      <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">✓ Key Achievements</span>
                          <span className="text-green-600 text-xs">Complete</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">Professional Experience</span>
                          <span className="text-blue-600 text-sm">→ Current</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          AI is scanning your experience for improvements
                        </p>
                        <button 
                          onClick={() => {
                            console.log('🚀 Improve Experience clicked')
                            generateExperienceImprovements()
                            setTimeout(() => {
                              const experienceElement = document.querySelector('[data-section="experience"]')
                              if (experienceElement) {
                                experienceElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              }
                            }, 100)
                          }}
                          className="text-xs px-2 py-1 rounded text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Improve Experience
                        </button>
                      </div>
                    )
                  } else {
                    return (
                      <div className={`p-3 rounded-lg border ${hasAchievements ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800">Key Achievements</span>
                          <span className={`text-sm ${hasAchievements ? 'text-blue-600' : 'text-yellow-600'}`}>
                            {hasAchievements ? '→ Current' : '⚠ Current'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {achievementsCount === 0 
                            ? 'Add 3 quantified achievements with metrics to stand out'
                            : `${achievementsCount}/3 achievements added. ${3 - achievementsCount} more recommended for optimal impact.`
                          }
                        </p>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => {
                              const achievementsElement = document.querySelector('[data-section="achievements"]')
                              if (achievementsElement) {
                                achievementsElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded text-white ${hasAchievements ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                          >
                            {achievementsCount === 0 ? 'Add Achievements' : 'Add More'}
                          </button>
                          {achievementsCount >= 1 && achievementsCount < 3 && (
                            <button 
                              onClick={() => {
                                console.log('🚀 Skip to Experience clicked')
                                console.log('📊 Current experience data:', currentData.experience)
                                generateExperienceImprovements()
                                console.log('✅ generateExperienceImprovements called')
                              }}
                              className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              Skip to Experience
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  }
                })()
              })()}
            </div>
          </div>
        )}

        {/* Left Sidebar */}
        <div className="w-80 bg-slate-800 text-white p-8 flex flex-col">
          {/* Profile Image */}
          <div className="mb-8 text-center">
            <div className="w-32 h-32 bg-gray-400 rounded-full mx-auto flex items-center justify-center text-gray-600 text-sm">
              Photo
            </div>
          </div>

          {/* Contact */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">CONTACT</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-16 text-xs text-gray-300 mr-2">Location:</span>
                {isEditing ? (
                  <textarea
                    value={currentData.personalInfo.address}
                    onChange={(e) => updateField('personalInfo.address', e.target.value)}
                    className="text-sm bg-slate-700 text-white rounded px-2 py-1 w-full"
                    rows={2}
                    placeholder="Address"
                  />
                ) : (
                  <div className="text-sm">{currentData.personalInfo.address}</div>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-16 text-xs text-gray-300 mr-2">Phone:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.personalInfo.phone}
                    onChange={(e) => updateField('personalInfo.phone', e.target.value)}
                    className="text-sm bg-slate-700 text-white rounded px-2 py-1 w-full"
                    placeholder="Phone"
                  />
                ) : (
                  <div className="text-sm">{currentData.personalInfo.phone}</div>
                )}
              </div>
              <div className="flex items-center">
                <span className="w-16 text-xs text-gray-300 mr-2">Email:</span>
                {isEditing ? (
                  <input
                    type="email"
                    value={currentData.personalInfo.email}
                    onChange={(e) => updateField('personalInfo.email', e.target.value)}
                    className="text-sm bg-slate-700 text-white rounded px-2 py-1 w-full"
                    placeholder="Email"
                  />
                ) : (
                  <div className="text-sm break-all">{currentData.personalInfo.email}</div>
                )}
              </div>
              
              {/* Website URL */}
              {currentData.personalInfo.website && (
                <div className="flex items-center">
                  <span className="w-16 text-xs text-gray-300 mr-2">Website:</span>
                  {isEditing ? (
                    <input
                      type="url"
                      value={currentData.personalInfo.website}
                      onChange={(e) => updateField('personalInfo.website', e.target.value)}
                      className="text-sm bg-slate-700 text-white rounded px-2 py-1 w-full"
                      placeholder="Website URL"
                    />
                  ) : (
                    <div className="text-sm">
                      <a href={currentData.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 break-all">
                        {currentData.personalInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {/* LinkedIn URL */}
              {currentData.personalInfo.linkedin && (
                <div className="flex items-center">
                  <span className="w-16 text-xs text-gray-300 mr-2">LinkedIn:</span>
                  {isEditing ? (
                    <input
                      type="url"
                      value={currentData.personalInfo.linkedin}
                      onChange={(e) => updateField('personalInfo.linkedin', e.target.value)}
                      className="text-sm bg-slate-700 text-white rounded px-2 py-1 w-full"
                      placeholder="LinkedIn URL"
                    />
                  ) : (
                    <div className="text-sm">
                      <a href={currentData.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 break-all">
                        {currentData.personalInfo.linkedin}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className={`mb-8 ${getCommentsForText?.('skills section')?.some(c => c.targetText.startsWith('SECTION:Skills')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <h3 className="text-lg font-bold mb-4">SKILLS</h3>
            
            {/* Handle both categorized skills (object) and simple skills (array) */}
            {typeof currentData.skills === 'object' && !Array.isArray(currentData.skills) ? (
              // New categorized format
              <div className="space-y-4">
                {Object.entries(currentData.skills).map(([category, skillList]) => {
                  if (!Array.isArray(skillList) || skillList.length === 0) return null
                  
                  const categoryDisplayNames = {
                    'programming_languages': 'Programming Languages',
                    'tools_software': 'Tools & Software', 
                    'frameworks_libraries': 'Frameworks & Libraries',
                    'databases': 'Databases',
                    'other': 'Other Skills'
                  }
                  
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                        {categoryDisplayNames[category] || category.replace('_', ' ')}
                      </h4>
                      <ul className="space-y-1 ml-2">
                        {skillList.map((skill, index) => (
                          <li key={`${category}-${index}`} className="text-sm text-white flex items-center group"
                            onMouseEnter={() => setHoveredSkillDelete(`${category}-${index}`)}
                            onMouseLeave={() => setHoveredSkillDelete(null)}
                          >
                            <span className="mr-2">•</span>
                            <input
                              type="text"
                              value={typeof skill === 'string' ? skill : skill.name}
                              onChange={(e) => {
                                const newData = { ...currentData }
                                if (typeof newData.skills === 'object' && !Array.isArray(newData.skills)) {
                                  if (Array.isArray(newData.skills[category])) {
                                    newData.skills[category][index] = typeof skill === 'string' ? e.target.value : { ...skill, name: e.target.value }
                                  }
                                }
                                if (onDataChange) {
                                  onDataChange(newData)
                                }
                              }}
                              className="flex-1 text-sm text-white bg-transparent border-none outline-none hover:bg-gray-600 focus:bg-gray-600 focus:border focus:border-blue-300 rounded px-2 py-1 -mx-2 -my-1"
                              placeholder="Skill name"
                            />
                            {hoveredSkillDelete === `${category}-${index}` && (
                              <span 
                                className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newData = { ...currentData }
                                  if (typeof newData.skills === 'object' && !Array.isArray(newData.skills)) {
                                    if (Array.isArray(newData.skills[category])) {
                                      newData.skills[category].splice(index, 1)
                                    }
                                  }
                                  if (onDataChange) {
                                    onDataChange(newData)
                                  }
                                  setHoveredSkillDelete(null)
                                }}
                                title="Delete skill"
                              >
                                ×
                              </span>
                            )}
                          </li>
                        ))}
                        <li>
                          <button
                            onClick={() => {
                              const newData = { ...currentData }
                              if (typeof newData.skills === 'object' && !Array.isArray(newData.skills)) {
                                if (Array.isArray(newData.skills[category])) {
                                  newData.skills[category].push('New Skill')
                                }
                              }
                              if (onDataChange) {
                                onDataChange(newData)
                              }
                            }}
                            className="text-xs text-blue-300 hover:text-blue-200 ml-2"
                          >
                            + Add
                          </button>
                        </li>
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Old simple array format (fallback)
              <ul className="space-y-2">
                {(Array.isArray(currentData.skills) ? currentData.skills : []).map((skill, index) => (
                  <li key={skill.id || index} className="flex items-center group"
                    onMouseEnter={() => setHoveredSkillDelete(index)}
                    onMouseLeave={() => setHoveredSkillDelete(null)}
                  >
                    <span className="mr-2 text-white">•</span>
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => {
                        const newData = { ...currentData }
                        if (Array.isArray(newData.skills)) {
                          newData.skills[index].name = e.target.value
                        }
                        if (onDataChange) {
                          onDataChange(newData)
                        }
                      }}
                      className="flex-1 text-sm text-white bg-transparent border-none outline-none hover:bg-gray-600 focus:bg-gray-600 focus:border focus:border-blue-300 rounded px-2 py-1 -mx-2 -my-1"
                      placeholder="Skill name"
                    />
                    {hoveredSkillDelete === index && (
                      <span 
                        className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          const newData = { ...currentData }
                          if (Array.isArray(newData.skills)) {
                            newData.skills.splice(index, 1)
                          }
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                          setHoveredSkillDelete(null)
                        }}
                        title="Delete skill"
                      >
                        ×
                      </span>
                    )}
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => {
                      const newData = { ...currentData }
                      if (Array.isArray(newData.skills)) {
                        newData.skills.push({
                          id: `skill-${Date.now()}`,
                          name: 'New Skill',
                          level: 80
                        })
                      }
                      if (onDataChange) {
                        onDataChange(newData)
                      }
                    }}
                    className="text-sm text-blue-300 hover:text-blue-200 mt-2"
                  >
                    + Add Skill
                  </button>
                </li>
              </ul>
            )}
          </div>


          {/* Hobbies */}
          {currentData.hobbies && currentData.hobbies.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">HOBBIES</h3>
              <ul className="space-y-1 text-sm">
                {currentData.hobbies.map((hobby, index) => (
                  <li key={index}>• {hobby}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8 bg-white">
          {/* Header */}
          <div className="mb-8">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={currentData.personalInfo.name}
                  onChange={(e) => updateField('personalInfo.name', e.target.value)}
                  className="text-4xl font-bold text-gray-900 mb-2 border-b-2 border-gray-300 w-full bg-transparent"
                  placeholder="Your Name"
                />
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  <SmartText 
                    text={currentData.personalInfo.name}
                    comments={getCommentsForText?.(currentData.personalInfo.name) || []}
                    onShowComments={onShowComments}
                  />
                </h1>
                
                {/* Tagline - Modern, compact design */}
                <div data-section="tagline" className={`mb-6 ${!currentData.personalInfo.tagline ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm' : ''}`}>
                  {!currentData.personalInfo.tagline ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Add Professional Tagline</h3>
                        <p className="text-sm text-gray-600">First thing recruiters see - make it count!</p>
                      </div>
                      
                      {/* AI Suggestion - Primary */}
                      <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">AI RECOMMENDED</span>
                        </div>
                        <p className="text-lg font-medium text-gray-800 mb-3">
                          Product Manager | Digital & Mobile Apps | Agile Expert
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // Force update the data directly since we're not in edit mode
                              const newData = { ...currentData }
                              newData.personalInfo.tagline = 'Product Manager | Digital & Mobile Apps | Agile Expert'
                              
                              // Call onDataChange if available to save to database
                              if (onDataChange) {
                                onDataChange(newData)
                              }
                              
                              // Scroll to summary section
                              setTimeout(() => {
                                const summaryElement = document.querySelector('[data-section="summary"]')
                                if (summaryElement) {
                                  summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 500)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Use This
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm font-medium">
                            Generate More Ideas
                          </button>
                        </div>
                      </div>

                      {/* Quick Alternatives */}
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          'Senior Product Manager | 8+ Years | Mobile & Web',
                          'Product Strategy Expert | Agile Delivery | Team Leadership'
                        ].map((suggestion, index) => (
                          <div key={index} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition-colors border"
                            onClick={() => {
                              const newData = { ...currentData }
                              newData.personalInfo.tagline = suggestion
                              if (onDataChange) {
                                onDataChange(newData)
                              }
                              setTimeout(() => {
                                const summaryElement = document.querySelector('[data-section="summary"]')
                                if (summaryElement) {
                                  summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 500)
                            }}
                          >
                            <p className="text-sm text-gray-700 font-medium">"{suggestion}"</p>
                          </div>
                        ))}
                      </div>

                      {/* Why it matters - compact */}
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                          <strong>Why this matters:</strong> Recruiters scan CVs in 6-8 seconds. A tagline instantly shows your value and helps ATS systems categorize you correctly.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Existing tagline - compact completed state
                    <div className="text-left mb-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={currentData.personalInfo.tagline}
                            onChange={(e) => updateField('personalInfo.tagline', e.target.value)}
                            className="text-lg italic text-gray-600 w-full text-left border-b border-gray-300 bg-transparent"
                            placeholder="Professional tagline..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateField('personalInfo.tagline', '')}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                            >
                              Remove Tagline
                            </button>
                            <button
                              onClick={() => updateField('personalInfo.tagline', originalData?.personalInfo?.tagline || '')}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs"
                            >
                              Reset to Original
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-lg text-gray-600 italic text-left">
                            <SmartText 
                              text={currentData.personalInfo.tagline}
                              comments={getCommentsForText?.(currentData.personalInfo.tagline) || []}
                              onShowComments={onShowComments}
                            />
                          </p>
                          
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div data-section="summary" className={`mb-8 ${getCommentsForText?.(currentData.personalInfo.summary)?.some(c => c.targetText.startsWith('SECTION:Professional Summary')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              PROFILE
            </h3>
            
            {/* Summary Analysis Section - Show when tagline is complete and summary is the next task */}
            {currentData.personalInfo.tagline && !isEditing && (
              (() => {
                const summary = currentData.personalInfo.summary || ''
                const hasGoodLength = summary.length > 100 && summary.length < 600
                const hasQuantifiedResults = /\d+[%$]|\d+\s*(years?|months?)|increased|improved|reduced|grew|achieved/i.test(summary)
                const hasActionVerbs = /led|managed|developed|created|implemented|delivered|optimized|launched|spearheaded|established|recognized|driving|proven/i.test(summary)
                const hasRelevantKeywords = /product\s*manager|digital|mobile|agile|strategy|roadmap|stakeholder|user\s*experience|data\s*driven|strategic|innovation|automation|engagement|leadership/i.test(summary)
                const isWellStructured = summary.split('.').length >= 3
                
                const improvementNeeded = !hasGoodLength || !hasQuantifiedResults || !hasActionVerbs || !hasRelevantKeywords || !isWellStructured
                
                if (summary.length < 50) {
                  // No summary or very short summary
                  return (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                      <div className="text-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">Add Professional Summary</h4>
                        <p className="text-sm text-gray-600">Recruiters read this first - make it count!</p>
                      </div>
                      
                      {!showSummaryQuestions ? (
                        <>
                          {/* Options to get started */}
                          <div className="space-y-3 mb-4">
                            <button
                              onClick={() => setShowSummaryQuestions(true)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                            >
                              ✨ Create Personalized Summary (Recommended)
                            </button>
                            <p className="text-xs text-gray-600 text-center">Answer 6 quick questions for a tailored summary</p>
                          </div>
                          
                          <div className="text-center text-xs text-gray-500 mb-3">or</div>
                          
                          {/* AI Suggested Summary */}
                          <div className="bg-white rounded-lg border border-blue-200 p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">GENERIC AI SUGGESTION</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                              Experienced Digital Product Manager with 8+ years driving product strategy and delivery for mobile apps and web platforms. Successfully delivered £1M+ cost savings through strategic self-service initiatives at iD Mobile, while increasing customer engagement and CLV. Expert in stakeholder management, agile delivery, and data-driven decision making across telecommunications, e-commerce, and fintech industries.
                            </p>
                            <button
                              onClick={() => {
                                const newData = { ...currentData }
                                newData.personalInfo.summary = 'Experienced Digital Product Manager with 8+ years driving product strategy and delivery for mobile apps and web platforms. Successfully delivered £1M+ cost savings through strategic self-service initiatives at iD Mobile, while increasing customer engagement and CLV. Expert in stakeholder management, agile delivery, and data-driven decision making across telecommunications, e-commerce, and fintech industries.'
                                if (onDataChange) {
                                  onDataChange(newData)
                                }
                              }}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Use Generic Version
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Interactive Questionnaire */
                        <div className="space-y-4">
                          <div className="text-center mb-4">
                            <h5 className="text-md font-semibold text-gray-800 mb-1">Let's Create Your Perfect Summary</h5>
                            <p className="text-xs text-gray-600">Answer these questions to get a personalized, compelling summary</p>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">What role are you targeting?</label>
                              <input
                                type="text"
                                placeholder="e.g., Senior Product Manager, Marketing Director"
                                value={summaryAnswers.targetRole}
                                onChange={(e) => setSummaryAnswers({...summaryAnswers, targetRole: e.target.value})}
                                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">How many years of relevant experience?</label>
                              <input
                                type="text"
                                placeholder="e.g., 8+, 5-7, 3"
                                value={summaryAnswers.yearsExperience}
                                onChange={(e) => setSummaryAnswers({...summaryAnswers, yearsExperience: e.target.value})}
                                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">What's your biggest professional achievement? (include numbers)</label>
                              <input
                                type="text"
                                placeholder="e.g., delivered £1M+ cost savings, increased conversion by 40%"
                                value={summaryAnswers.keyAchievement}
                                onChange={(e) => setSummaryAnswers({...summaryAnswers, keyAchievement: e.target.value})}
                                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">What's your key specialization/expertise?</label>
                              <input
                                type="text"
                                placeholder="e.g., mobile app development, digital transformation, agile delivery"
                                value={summaryAnswers.specialization}
                                onChange={(e) => setSummaryAnswers({...summaryAnswers, specialization: e.target.value})}
                                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">Which industry/sector?</label>
                              <input
                                type="text"
                                placeholder="e.g., telecommunications, e-commerce, fintech, healthcare"
                                value={summaryAnswers.industryFocus}
                                onChange={(e) => setSummaryAnswers({...summaryAnswers, industryFocus: e.target.value})}
                                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-700 block mb-1">What makes you unique? (skills, traits, approach)</label>
                              <input
                                type="text"
                                placeholder="e.g., data-driven decision making, stakeholder management, cross-functional leadership"
                                value={summaryAnswers.uniqueValue}
                                onChange={(e) => setSummaryAnswers({...summaryAnswers, uniqueValue: e.target.value})}
                                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 pt-3">
                            <button
                              onClick={() => {
                                const personalizedSummary = generatePersonalizedSummary()
                                const newData = { ...currentData }
                                newData.personalInfo.summary = personalizedSummary
                                if (onDataChange) {
                                  onDataChange(newData)
                                }
                                setShowSummaryQuestions(false)
                              }}
                              disabled={!summaryAnswers.targetRole || !summaryAnswers.yearsExperience}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Generate My Summary
                            </button>
                            <button
                              onClick={() => setShowSummaryQuestions(false)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Why it matters */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mt-4">
                        <p className="text-xs text-blue-800">
                          <strong>Why this matters:</strong> Your summary is the first substantial content recruiters read. It should immediately demonstrate your value, quantify your impact, and show relevant experience for the role.
                        </p>
                      </div>
                    </div>
                  )
                } else if (improvementNeeded) {
                  // Existing summary needs improvement
                  return (
                    <div className="space-y-4 mb-6">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <SmartText 
                          text={currentData.personalInfo.summary}
                          comments={getCommentsForText?.(currentData.personalInfo.summary) || []}
                          onShowComments={onShowComments}
                        />
                      </p>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 mb-3">
                          💡 Your summary could be stronger. Here's what's missing:
                        </p>
                        <ul className="text-xs text-yellow-700 space-y-1 mb-4">
                          {!hasGoodLength && <li>• Aim for 2-3 sentences (100-400 characters) for optimal impact</li>}
                          {!hasQuantifiedResults && <li>• Add specific numbers, percentages, or measurable achievements</li>}
                          {!hasActionVerbs && <li>• Use strong action verbs like "led," "delivered," "increased"</li>}
                          {!hasRelevantKeywords && <li>• Include relevant role keywords that ATS systems scan for</li>}
                          {!isWellStructured && <li>• Structure as: Role + Experience + Key Achievement + Value Proposition</li>}
                        </ul>
                        
                        <div className="space-y-2">
                          <div className="bg-white rounded-lg border border-yellow-300 p-3">
                            <div className="text-xs font-medium text-yellow-700 mb-2">✨ IMPROVED VERSION:</div>
                            <p className="text-sm text-gray-700 mb-3">
                              Strategic Digital Product Manager with 8+ years of proven expertise driving mobile app and web platform innovation. Delivered £1M+ in measurable cost savings through self-service automation at iD Mobile while boosting customer engagement by 25% and CLV by 18%. Recognized leader in stakeholder alignment, agile delivery, and data-driven product decisions across telecommunications, e-commerce, and fintech sectors.
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  console.log('🔄 Use Improved Version clicked')
                                  const newData = { ...currentData }
                                  const improvedSummary = 'Strategic Digital Product Manager with 8+ years of proven expertise driving mobile app and web platform innovation. Delivered £1M+ in measurable cost savings through self-service automation at iD Mobile while boosting customer engagement by 25% and CLV by 18%. Recognized leader in stakeholder alignment, agile delivery, and data-driven product decisions across telecommunications, e-commerce, and fintech sectors.'
                                  newData.personalInfo.summary = improvedSummary
                                  console.log('📝 Updated summary:', improvedSummary)
                                  console.log('🔄 Calling onDataChange with:', newData)
                                  if (onDataChange) {
                                    onDataChange(newData)
                                  }
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                Use Improved Version
                              </button>
                              <button
                                onClick={() => setShowSummaryQuestions(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                ✨ Create Personal Version
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Show questionnaire if requested */}
                        {showSummaryQuestions && (
                          <div className="bg-blue-50 rounded-lg border border-blue-300 p-4 mt-3">
                            <div className="text-center mb-4">
                              <h5 className="text-md font-semibold text-gray-800 mb-1">Let's Create Your Perfect Summary</h5>
                              <p className="text-xs text-gray-600">Answer these questions to get a personalized, compelling summary</p>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">What role are you targeting?</label>
                                <input
                                  type="text"
                                  placeholder="e.g., Senior Product Manager, Marketing Director"
                                  value={summaryAnswers.targetRole}
                                  onChange={(e) => setSummaryAnswers({...summaryAnswers, targetRole: e.target.value})}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">How many years of relevant experience?</label>
                                <input
                                  type="text"
                                  placeholder="e.g., 8+, 5-7, 3"
                                  value={summaryAnswers.yearsExperience}
                                  onChange={(e) => setSummaryAnswers({...summaryAnswers, yearsExperience: e.target.value})}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">What's your biggest professional achievement? (include numbers)</label>
                                <input
                                  type="text"
                                  placeholder="e.g., delivered £1M+ cost savings, increased conversion by 40%"
                                  value={summaryAnswers.keyAchievement}
                                  onChange={(e) => setSummaryAnswers({...summaryAnswers, keyAchievement: e.target.value})}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">What's your key specialization/expertise?</label>
                                <input
                                  type="text"
                                  placeholder="e.g., mobile app development, digital transformation, agile delivery"
                                  value={summaryAnswers.specialization}
                                  onChange={(e) => setSummaryAnswers({...summaryAnswers, specialization: e.target.value})}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Which industry/sector?</label>
                                <input
                                  type="text"
                                  placeholder="e.g., telecommunications, e-commerce, fintech, healthcare"
                                  value={summaryAnswers.industryFocus}
                                  onChange={(e) => setSummaryAnswers({...summaryAnswers, industryFocus: e.target.value})}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">What makes you unique? (skills, traits, approach)</label>
                                <input
                                  type="text"
                                  placeholder="e.g., data-driven decision making, stakeholder management, cross-functional leadership"
                                  value={summaryAnswers.uniqueValue}
                                  onChange={(e) => setSummaryAnswers({...summaryAnswers, uniqueValue: e.target.value})}
                                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                />
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 pt-3">
                              <button
                                onClick={() => {
                                  const personalizedSummary = generatePersonalizedSummary()
                                  const newData = { ...currentData }
                                  newData.personalInfo.summary = personalizedSummary
                                  if (onDataChange) {
                                    onDataChange(newData)
                                  }
                                  setShowSummaryQuestions(false)
                                }}
                                disabled={!summaryAnswers.targetRole || !summaryAnswers.yearsExperience}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Generate My Summary
                              </button>
                              <button
                                onClick={() => setShowSummaryQuestions(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  // Summary is good
                  return (
                    <div className="space-y-4 mb-6">
                      <textarea
                        value={currentData.personalInfo.summary}
                        onChange={(e) => {
                          const newData = { ...currentData }
                          newData.personalInfo.summary = e.target.value
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                        }}
                        className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 resize-none"
                        rows={4}
                        placeholder="Professional summary describing your experience and expertise"
                      />
                      
                      {showSummaryFeedback && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 transition-opacity duration-500 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-green-700">
                              ✓ Excellent summary! Good length, quantified results, and strong action verbs.
                            </p>
                            <button
                              onClick={() => setShowSummaryFeedback(false)}
                              className="text-green-500 hover:text-green-700 text-xs ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
              })()
            )}
            
            {/* Regular summary display when editing or tagline not complete */}
            {(isEditing || !currentData.personalInfo.tagline) && (
              <>
                {isEditing ? (
                  <textarea
                    value={currentData.personalInfo.summary}
                    onChange={(e) => updateField('personalInfo.summary', e.target.value)}
                    className="text-sm text-gray-700 leading-relaxed border border-gray-300 rounded px-3 py-2 w-full"
                    rows={4}
                    placeholder="Professional summary"
                  />
                ) : (
                  <>
                    <textarea
                      value={currentData.personalInfo.summary}
                      onChange={(e) => {
                        const newData = { ...currentData }
                        newData.personalInfo.summary = e.target.value
                        if (onDataChange) {
                          onDataChange(newData)
                        }
                      }}
                      className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 resize-none"
                      rows={4}
                      placeholder="Professional summary describing your experience and expertise"
                    />
                    
                  </>
                )}
              </>
            )}
          </div>

          {/* Achievements Section */}
          <div data-section="achievements" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              ACHIEVEMENTS
            </h3>
            
            {/* Display achievements as bullet points */}
            {currentData.awards && currentData.awards.length > 0 && (
              <ul className="space-y-1 ml-4">
                {currentData.awards.map((award, index) => (
                  <li key={award.id} className="text-gray-700 text-sm flex relative"
                    onMouseEnter={() => setHoveredAchievementDelete(index)}
                    onMouseLeave={() => setHoveredAchievementDelete(null)}
                  >
                    <span className="mr-2">•</span>
                    <div className="flex-1 flex items-center">
                      <input
                        type="text"
                        value={award.title}
                        onChange={(e) => {
                          const newData = { ...currentData }
                          newData.awards[index].title = e.target.value
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                        }}
                        className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1"
                        placeholder="Your achievement with specific metrics"
                      />
                      {hoveredAchievementDelete === index && (
                        <span 
                          className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newData = { ...currentData }
                            newData.awards.splice(index, 1)
                            if (onDataChange) {
                              onDataChange(newData)
                            }
                            setHoveredAchievementDelete(null)
                          }}
                          title="Delete achievement"
                        >
                          ×
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Add achievement input */}
            {showAddAchievement ? (
              <div className="flex items-start mb-3">
                <span className="mr-2 text-gray-600 mt-1">•</span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newAchievementText}
                    onChange={(e) => setNewAchievementText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newAchievementText.trim()) {
                        const newData = { ...currentData }
                        if (!newData.awards) newData.awards = []
                        newData.awards.push({
                          id: `achievement-${Date.now()}`,
                          title: newAchievementText.trim(),
                          year: '',
                          description: ''
                        })
                        if (onDataChange) {
                          onDataChange(newData)
                        }
                        setNewAchievementText('')
                        setShowAddAchievement(false)
                      } else if (e.key === 'Escape') {
                        setNewAchievementText('')
                        setShowAddAchievement(false)
                      }
                    }}
                    className="w-full text-sm text-gray-700 border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                    placeholder="e.g., Managed team of 6 developers, Increased sales by 25%"
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-1">
                    <button
                      onClick={() => {
                        if (newAchievementText.trim()) {
                          const newData = { ...currentData }
                          if (!newData.awards) newData.awards = []
                          newData.awards.push({
                            id: `achievement-${Date.now()}`,
                            title: newAchievementText.trim(),
                            year: '',
                            description: ''
                          })
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                          setNewAchievementText('')
                          setShowAddAchievement(false)
                        }
                      }}
                      className="text-green-600 hover:text-green-800 text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNewAchievementText('')
                        setShowAddAchievement(false)
                      }}
                      className="text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddAchievement(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Achievement
              </button>
            )}
            
            {(!currentData.awards || currentData.awards.length === 0) && (
              <div className="mt-3 text-sm text-gray-600">
                Add achievements like "Managed team of 8 developers" or "Increased revenue by 25%"
              </div>
            )}
          </div>

          {/* Professional Experience */}
          <div data-section="experience" className={`mb-8 ${getCommentsForText?.('work experience section')?.some(c => c.targetText.startsWith('SECTION:Work Experience')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 relative">
                <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                  PROFESSIONAL EXPERIENCE
                </h3>
                {isLoadingReview && (
                  <div className="absolute inset-0 bg-blue-50 bg-opacity-95 rounded-lg flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <div className="text-blue-800 text-sm font-medium">
                        <div>AI Recruiter is reviewing your experience...</div>
                        <div className="text-blue-700 text-xs mt-1">This may take 10-15 seconds</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* AI Recruiter Review Interface */}
              {experienceImprovementMode && !isLoadingReview && (
                <div className="ml-4">
                  {(() => {
                    const totalSuggestions = Object.values(improvementSuggestions).flat().length
                    const majorIssues = Object.values(improvementSuggestions).flat().filter(s => s.severity === 'major').length
                    const minorIssues = Object.values(improvementSuggestions).flat().filter(s => s.severity === 'minor').length
                    
                    if (totalSuggestions === 0) {
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-green-800 text-sm font-medium">✅ Excellent Experience Section!</div>
                            {aiReviewScore && (
                              <div className="text-green-700 text-sm font-bold">{aiReviewScore}/10</div>
                            )}
                          </div>
                          {aiReviewSummary && (
                            <div className="text-green-700 text-xs mb-2">"{aiReviewSummary}"</div>
                          )}
                          <button
                            onClick={() => {
                              setExperienceImprovementMode(false)
                              setAiReviewScore(null)
                              setAiReviewSummary(null)
                            }}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Continue
                          </button>
                        </div>
                      )
                    }
                    
                    const totalItems = currentData.experience.reduce((acc, exp) => {
                      const items = exp.description_items || (exp.description ? exp.description.split('\n').filter(line => line.trim()) : [])
                      return acc + items.length
                    }, 0)
                    
                    const issuePercentage = totalItems > 0 ? (totalSuggestions / totalItems) * 100 : 0
                    
                    // High percentage of issues - suggest bulk rewrite
                    if (issuePercentage > 60) {
                      return (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="text-orange-800 text-sm font-medium">🔄 Major Overhaul Recommended</div>
                          <div className="text-orange-700 text-xs mb-2">{totalSuggestions} issues found ({issuePercentage.toFixed(0)}% of content)</div>
                          <div className="flex space-x-2">
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs">
                              🤖 AI Rewrite All
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                              Review Individual Items
                            </button>
                            <button
                              onClick={() => setExperienceImprovementMode(false)}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )
                    }
                    
                    // Analyze suggestion types
                    const duplicateRemoval = Object.values(improvementSuggestions).flat().filter(s => s.actionType === 'remove').length
                    const consolidationSugs = Object.values(improvementSuggestions).flat().filter(s => s.actionType === 'consolidate').length
                    const mergeSuggestions = Object.values(improvementSuggestions).flat().filter(s => s.actionType === 'merge').length
                    const regularImprovements = Object.values(improvementSuggestions).flat().filter(s => !s.actionType || s.actionType === 'improve').length
                    
                    // Show consolidation summary if we have duplicates/consolidations/merges
                    if (duplicateRemoval > 0 || consolidationSugs > 0 || mergeSuggestions > 0) {
                      return (
                        <div className="space-y-3">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="text-purple-800 text-sm font-medium">🔄 CV Optimization Opportunities</div>
                            <div className="text-purple-700 text-xs mb-3">
                              {duplicateRemoval > 0 && `${duplicateRemoval} duplicates to remove`}
                              {duplicateRemoval > 0 && (consolidationSugs > 0 || mergeSuggestions > 0) && ', '}
                              {consolidationSugs > 0 && `${consolidationSugs} points to consolidate`}
                              {consolidationSugs > 0 && mergeSuggestions > 0 && ', '}
                              {mergeSuggestions > 0 && `${mergeSuggestions} bullet points to merge`}
                              {(duplicateRemoval > 0 || consolidationSugs > 0 || mergeSuggestions > 0) && regularImprovements > 0 && ', '}
                              {regularImprovements > 0 && `${regularImprovements} to improve`}
                            </div>
                            <div className="text-purple-600 text-xs mb-3 italic">
                              Scroll down to see crossed-out items and suggested changes highlighted in your CV
                            </div>
                            <div className="flex space-x-2 mb-3">
                              <button 
                                onClick={() => {
                                  // Apply all AI suggestions automatically
                                  const newData = { ...currentData }
                                  Object.entries(improvementSuggestions).forEach(([expKey, suggestions]) => {
                                    const expIndex = parseInt(expKey.replace('exp-', ''))
                                    suggestions.forEach((suggestion) => {
                                      if (suggestion.actionType === 'remove') {
                                        // Remove the item from description_items
                                        const items = newData.experience[expIndex].description_items || []
                                        const itemIndex = items.findIndex(item => item === suggestion.original)
                                        if (itemIndex !== -1) {
                                          newData.experience[expIndex].description_items.splice(itemIndex, 1)
                                        }
                                      } else if (suggestion.actionType === 'improve' || !suggestion.actionType) {
                                        // Replace with improved version
                                        const items = newData.experience[expIndex].description_items || []
                                        const itemIndex = items.findIndex(item => item === suggestion.original)
                                        if (itemIndex !== -1) {
                                          newData.experience[expIndex].description_items[itemIndex] = suggestion.improved
                                        }
                                      }
                                    })
                                  })
                                  if (onDataChange) {
                                    onDataChange(newData)
                                  }
                                  setExperienceImprovementMode(false)
                                  setImprovementSuggestions({})
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                              >
                                ✨ Apply All Changes
                              </button>
                              <button
                                onClick={() => {
                                  // User wants to review individual items - scroll them down to see the highlighted CV
                                  const experienceSection = document.querySelector('[data-section="experience"]')
                                  if (experienceSection) {
                                    experienceSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                              >
                                📝 Review One by One
                              </button>
                              <button
                                onClick={() => {
                                  setExperienceImprovementMode(false)
                                  setImprovementSuggestions({})
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    // Moderate issues - show individual highlights
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-blue-800 text-sm font-medium">📝 {totalSuggestions} Improvements Found</div>
                        <div className="text-blue-700 text-xs mb-2">
                          {majorIssues > 0 && `${majorIssues} major`}
                          {majorIssues > 0 && minorIssues > 0 && ', '}
                          {minorIssues > 0 && `${minorIssues} minor`}
                        </div>
                        <div className="text-blue-600 text-xs mb-3 italic">
                          Scroll down to see highlighted improvements in your CV
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // Apply all improvements
                              const newData = { ...currentData }
                              Object.entries(improvementSuggestions).forEach(([key, suggestions]) => {
                                const expIndex = parseInt(key.split('-')[1])
                                suggestions.forEach(suggestion => {
                                  if (suggestion.actionType === 'remove') {
                                    // Remove the item from description_items
                                    const items = newData.experience[expIndex].description_items || []
                                    const itemIndex = items.findIndex(item => item === suggestion.original)
                                    if (itemIndex !== -1) {
                                      newData.experience[expIndex].description_items.splice(itemIndex, 1)
                                    }
                                  } else if (suggestion.actionType === 'improve' || !suggestion.actionType) {
                                    // Replace with improved version
                                    if (newData.experience[expIndex].description_items) {
                                      newData.experience[expIndex].description_items = 
                                        newData.experience[expIndex].description_items.map(item => 
                                          item === suggestion.original ? suggestion.improved : item
                                        )
                                    } else if (newData.experience[expIndex].description) {
                                      newData.experience[expIndex].description = 
                                        newData.experience[expIndex].description.replace(suggestion.original, suggestion.improved)
                                    }
                                  }
                                })
                              })
                              if (onDataChange) {
                                onDataChange(newData)
                              }
                              setExperienceImprovementMode(false)
                              setImprovementSuggestions({})
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            ✨ Apply All Changes
                          </button>
                          <button
                            onClick={() => {
                              // User wants to review individual items - scroll them down to see the highlighted CV
                              const experienceSection = document.querySelector('[data-section="experience"]')
                              if (experienceSection) {
                                experienceSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                          >
                            📝 Review One by One
                          </button>
                          <button
                            onClick={() => {
                              setExperienceImprovementMode(false)
                              setImprovementSuggestions({})
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
            <div className="space-y-6">
            {currentData.experience.map((exp, index) => (
              <div key={exp.id} className="relative group"
                onMouseEnter={() => setHoveredExperienceDelete(index)}
                onMouseLeave={() => setHoveredExperienceDelete(null)}
              >
                {isEditing ? (
                  <div className="space-y-2 p-3 border border-gray-300 rounded">
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateArrayItem('experience', index, 'position', e.target.value)}
                      className="text-lg font-bold text-gray-900 border-b border-gray-300 w-full bg-transparent"
                      placeholder="Position"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateArrayItem('experience', index, 'company', e.target.value)}
                      className="text-gray-600 border-b border-gray-300 w-full bg-transparent"
                      placeholder="Company"
                    />
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => updateArrayItem('experience', index, 'duration', e.target.value)}
                      className="text-sm text-gray-500 border-b border-gray-300 w-full bg-transparent"
                      placeholder="Duration"
                    />
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateArrayItem('experience', index, 'description', e.target.value)}
                      className="text-gray-700 text-sm border border-gray-300 rounded px-3 py-2 w-full"
                      rows={3}
                      placeholder="Job description and achievements"
                    />
                    <button
                      onClick={() => removeArrayItem('experience', index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      × Remove Experience
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => {
                            const newData = { ...currentData }
                            newData.experience[index].position = e.target.value
                            if (onDataChange) {
                              onDataChange(newData)
                            }
                          }}
                          className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-full"
                          placeholder="Job Title"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newData = { ...currentData }
                            newData.experience[index].company = e.target.value
                            if (onDataChange) {
                              onDataChange(newData)
                            }
                          }}
                          className="text-gray-600 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-full"
                          placeholder="Company Name"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => {
                            const newData = { ...currentData }
                            newData.experience[index].duration = e.target.value
                            if (onDataChange) {
                              onDataChange(newData)
                            }
                          }}
                          className="text-sm text-gray-500 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-[200px]"
                          placeholder="Duration"
                        />
                        {hoveredExperienceDelete === index && (
                          <span 
                            className="text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newData = { ...currentData }
                              newData.experience.splice(index, 1)
                              if (onDataChange) {
                                onDataChange(newData)
                              }
                              setHoveredExperienceDelete(null)
                            }}
                            title="Delete entire experience"
                          >
                            ×
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-1 ml-4">
                      {/* Handle both new format (description_items array) and old format (description string) */}
                      {(() => {
                        const hasDescriptionItems = exp.description_items && exp.description_items.length > 0
                        const hasDescription = exp.description && exp.description.trim()
                        
                        if (hasDescriptionItems) {
                          // New format: separate bullet points/paragraphs
                          return exp.description_items.map((item, itemIndex) => {
                            const expKey = `exp-${index}`
                            const suggestions = improvementSuggestions[expKey] || []
                            const itemSuggestion = suggestions.find(s => s.original === item)
                            const isHighlighted = experienceImprovementMode && itemSuggestion
                            
                            return (
                              <li key={itemIndex} className="text-gray-700 text-sm flex relative">
                                <span className="mr-2">•</span>
                                <div className="flex-1 relative">
                                  {editingItem && editingItem.expIndex === index && editingItem.itemIndex === itemIndex ? (
                                    <div className="w-full">
                                      <textarea
                                        value={editingItem.text}
                                        onChange={(e) => setEditingItem({
                                          ...editingItem,
                                          text: e.target.value
                                        })}
                                        className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        autoFocus
                                        onBlur={() => {
                                          // Save changes when losing focus
                                          const newData = { ...currentData }
                                          newData.experience[index].description_items[itemIndex] = editingItem.text
                                          if (onDataChange) {
                                            onDataChange(newData)
                                          }
                                          setEditingItem(null)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && e.ctrlKey) {
                                            // Save with Ctrl+Enter
                                            const newData = { ...currentData }
                                            newData.experience[index].description_items[itemIndex] = editingItem.text
                                            if (onDataChange) {
                                              onDataChange(newData)
                                            }
                                            setEditingItem(null)
                                          } else if (e.key === 'Escape') {
                                            // Cancel editing
                                            setEditingItem(null)
                                          }
                                        }}
                                      />
                                      <div className="text-xs text-gray-500 mt-1">
                                        Press Ctrl+Enter to save, Esc to cancel
                                      </div>
                                    </div>
                                  ) : (
                                    <span 
                                      className={`${isHighlighted ? 
                                        itemSuggestion?.actionType === 'remove' 
                                          ? 'bg-red-100 border-b-2 border-red-600 cursor-pointer line-through' 
                                          : itemSuggestion?.actionType === 'consolidate'
                                          ? 'bg-purple-100 border-b-2 border-purple-400 cursor-pointer'
                                          : itemSuggestion?.actionType === 'merge'
                                          ? 'bg-blue-100 border-b-2 border-blue-400 cursor-pointer'
                                          : itemSuggestion?.severity === 'major' 
                                          ? 'bg-red-100 border-b-2 border-red-400 cursor-pointer' 
                                          : 'bg-yellow-100 border-b-2 border-yellow-400 cursor-pointer'
                                        : 'cursor-pointer hover:bg-gray-50 rounded px-1'}`}
                                      onMouseEnter={() => {
                                        if (isHighlighted) {
                                          setHoveredImprovement({
                                            expIndex: index,
                                            itemIndex,
                                            suggestion: itemSuggestion.improved,
                                            original: itemSuggestion.original
                                          })
                                        }
                                        setHoveredDeleteButton({ expIndex: index, itemIndex })
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredImprovement(null)
                                        setHoveredDeleteButton(null)
                                      }}
                                      onClick={() => {
                                        if (isHighlighted && itemSuggestion) {
                                          const newData = { ...currentData }
                                          
                                          if (itemSuggestion.actionType === 'remove') {
                                            // Remove the item completely
                                            newData.experience[index].description_items.splice(itemIndex, 1)
                                          } else {
                                            // Apply improvement
                                            newData.experience[index].description_items[itemIndex] = itemSuggestion.improved
                                          }
                                          
                                          if (onDataChange) {
                                            onDataChange(newData)
                                          }
                                          // Remove this suggestion from the list
                                          const newSuggestions = { ...improvementSuggestions }
                                          newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== itemSuggestion.original)
                                          setImprovementSuggestions(newSuggestions)
                                        } else {
                                          // Start inline editing
                                          setEditingItem({
                                            expIndex: index,
                                            itemIndex,
                                            text: item
                                          })
                                        }
                                      }}
                                      title="Click to edit"
                                    >
                                      <SmartText 
                                        text={item}
                                        comments={getCommentsForText?.(item) || []}
                                        onShowComments={onShowComments}
                                      />
                                      {hoveredDeleteButton?.expIndex === index && hoveredDeleteButton?.itemIndex === itemIndex && (
                                        <span 
                                          className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const newData = { ...currentData }
                                            newData.experience[index].description_items.splice(itemIndex, 1)
                                            if (onDataChange) {
                                              onDataChange(newData)
                                            }
                                            // Also remove any suggestions for this item
                                            const expKey = `exp-${index}`
                                            const newSuggestions = { ...improvementSuggestions }
                                            if (newSuggestions[expKey]) {
                                              newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== item)
                                              setImprovementSuggestions(newSuggestions)
                                            }
                                            setHoveredDeleteButton(null)
                                          }}
                                          title="Delete bullet point"
                                        >
                                          ×
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  
                                  {/* Hover overlay */}
                                  {hoveredImprovement && 
                                   hoveredImprovement.expIndex === index && 
                                   hoveredImprovement.itemIndex === itemIndex && (
                                    <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 mt-1 w-80 left-0">
                                      {(() => {
                                        const suggestion = suggestions.find(s => s.original === hoveredImprovement.original)
                                        const actionType = suggestion?.actionType || 'improve'
                                        
                                        if (actionType === 'remove') {
                                          return (
                                            <>
                                              <div className="text-xs font-semibold text-red-800 mb-2">🗑️ Suggested Removal:</div>
                                              <div className="text-sm text-red-700 mb-2">This bullet point should be removed</div>
                                              <div className="text-xs text-gray-600 mb-2">{suggestion?.reason}</div>
                                              <div className="text-xs text-blue-600 italic mb-2">Click the crossed-out text or use button below:</div>
                                              {suggestion?.duplicateOf !== undefined && (
                                                <div className="text-xs text-orange-600 mb-2">
                                                  Duplicate of content in Role {suggestion.duplicateOf + 1}
                                                </div>
                                              )}
                                              <button
                                                onClick={() => {
                                                  // Remove the item
                                                  const newData = { ...currentData }
                                                  newData.experience[index].description_items.splice(itemIndex, 1)
                                                  if (onDataChange) {
                                                    onDataChange(newData)
                                                  }
                                                  const newSuggestions = { ...improvementSuggestions }
                                                  newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== suggestion?.original)
                                                  setImprovementSuggestions(newSuggestions)
                                                  setHoveredImprovement(null)
                                                }}
                                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                              >
                                                Remove This
                                              </button>
                                            </>
                                          )
                                        } else if (actionType === 'consolidate') {
                                          return (
                                            <>
                                              <div className="text-xs font-semibold text-purple-800 mb-2">🔀 Suggested Consolidation:</div>
                                              <div className="text-sm text-green-700 mb-2">"{hoveredImprovement.suggestion}"</div>
                                              <div className="text-xs text-gray-600 mb-2">{suggestion?.reason}</div>
                                              <div className="text-xs text-blue-600 italic mb-2">Click the highlighted text or use button below:</div>
                                              <button
                                                onClick={() => {
                                                  if (suggestion) {
                                                    const newData = { ...currentData }
                                                    newData.experience[index].description_items[itemIndex] = suggestion.improved
                                                    if (onDataChange) {
                                                      onDataChange(newData)
                                                    }
                                                    const newSuggestions = { ...improvementSuggestions }
                                                    newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== suggestion.original)
                                                    setImprovementSuggestions(newSuggestions)
                                                    setHoveredImprovement(null)
                                                  }
                                                }}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                                              >
                                                Consolidate
                                              </button>
                                            </>
                                          )
                                        } else if (actionType === 'merge') {
                                          return (
                                            <>
                                              <div className="text-xs font-semibold text-blue-800 mb-2">🔗 Suggested Merge:</div>
                                              <div className="text-sm text-green-700 mb-2">"{hoveredImprovement.suggestion}"</div>
                                              <div className="text-xs text-gray-600 mb-2">{suggestion?.reason}</div>
                                              <div className="text-xs text-blue-600 italic mb-2">Click the highlighted text or use button below:</div>
                                              {suggestion?.mergeWith && (
                                                <div className="text-xs text-blue-600 mb-2">
                                                  Merge with: {suggestion.mergeWith.slice(0, 50)}...
                                                </div>
                                              )}
                                              <button
                                                onClick={() => {
                                                  if (suggestion) {
                                                    const newData = { ...currentData }
                                                    newData.experience[index].description_items[itemIndex] = suggestion.improved
                                                    if (onDataChange) {
                                                      onDataChange(newData)
                                                    }
                                                    // Remove the merged bullet points
                                                    if (suggestion.mergeWith) {
                                                      suggestion.mergeWith.forEach(mergeText => {
                                                        const mergeIndex = newData.experience[index].description_items.findIndex(item => item === mergeText)
                                                        if (mergeIndex !== -1 && mergeIndex !== itemIndex) {
                                                          newData.experience[index].description_items.splice(mergeIndex, 1)
                                                        }
                                                      })
                                                    }
                                                    const newSuggestions = { ...improvementSuggestions }
                                                    newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== suggestion.original)
                                                    setImprovementSuggestions(newSuggestions)
                                                    setHoveredImprovement(null)
                                                  }
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                              >
                                                Merge Points
                                              </button>
                                            </>
                                          )
                                        } else {
                                          return (
                                            <>
                                              <div className="text-xs font-semibold text-gray-800 mb-2">✨ Suggested Improvement:</div>
                                              <div className="text-sm text-green-700 mb-2">"{hoveredImprovement.suggestion}"</div>
                                              <div className="text-xs text-gray-600 mb-2">{suggestion?.reason}</div>
                                              <div className="text-xs text-blue-600 italic">Click the highlighted text to apply this change</div>
                                            </>
                                          )
                                        }
                                      })()}
                                    </div>
                                  )}
                                  
                                </div>
                              </li>
                            )
                          })
                        } else if (hasDescription) {
                          // Old format: split description string by lines  
                          return exp.description.split('\n').filter(line => line.trim()).map((line, lineIndex) => {
                            const trimmedLine = line.trim()
                            const expKey = `exp-${index}`
                            const suggestions = improvementSuggestions[expKey] || []
                            const lineSuggestion = suggestions.find(s => s.original === trimmedLine)
                            const isHighlighted = experienceImprovementMode && lineSuggestion
                            
                            return (
                              <li key={lineIndex} className="text-gray-700 text-sm flex relative">
                                <span className="mr-2">•</span>
                                <div className="flex-1 relative">
                                  <span 
                                    className={`${isHighlighted ? 
                                      lineSuggestion.severity === 'major' 
                                        ? 'bg-red-100 border-b-2 border-red-400 cursor-pointer' 
                                        : 'bg-yellow-100 border-b-2 border-yellow-400 cursor-pointer'
                                      : ''}`}
                                    onMouseEnter={() => {
                                      if (isHighlighted) {
                                        setHoveredImprovement({
                                          expIndex: index,
                                          itemIndex: lineIndex,
                                          suggestion: lineSuggestion.improved,
                                          original: lineSuggestion.original
                                        })
                                      }
                                      setHoveredDeleteButton({ expIndex: index, itemIndex: lineIndex })
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredImprovement(null)
                                      setHoveredDeleteButton(null)
                                    }}
                                  >
                                    <SmartText 
                                      text={trimmedLine}
                                      comments={getCommentsForText?.(trimmedLine) || []}
                                      onShowComments={onShowComments}
                                    />
                                    {hoveredDeleteButton?.expIndex === index && hoveredDeleteButton?.itemIndex === lineIndex && (
                                      <span 
                                        className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const newData = { ...currentData }
                                          // Convert to description_items format and remove the line
                                          const lines = exp.description.split('\n').filter(line => line.trim())
                                          lines.splice(lineIndex, 1)
                                          newData.experience[index].description_items = lines
                                          delete newData.experience[index].description // Remove old format
                                          if (onDataChange) {
                                            onDataChange(newData)
                                          }
                                          // Also remove any suggestions for this item
                                          const newSuggestions = { ...improvementSuggestions }
                                          if (newSuggestions[expKey]) {
                                            newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== trimmedLine)
                                            setImprovementSuggestions(newSuggestions)
                                          }
                                          setHoveredDeleteButton(null)
                                        }}
                                        title="Delete bullet point"
                                      >
                                        ×
                                      </span>
                                    )}
                                  </span>
                                  
                                </div>
                              </li>
                            )
                          })
                        } else {
                          // No content - show placeholder
                          return (
                            <li className="text-gray-500 text-sm italic">
                              • No job description available - click "Improve with AI" to add details
                            </li>
                          )
                        }
                      })()}
                    </ul>
                    
                    {/* Add more experience details button */}
                    <button
                      onClick={() => {
                        const newData = { ...currentData }
                        if (!newData.experience[index].description_items) {
                          newData.experience[index].description_items = []
                        }
                        newData.experience[index].description_items.push('New responsibility or achievement')
                        if (onDataChange) {
                          onDataChange(newData)
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 ml-4 mt-3 mb-2 flex items-center"
                    >
                      + Add more {exp.position || 'experience'}
                    </button>
                    
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const newData = { ...currentData }
                newData.experience.push({
                  id: `exp-${Date.now()}`,
                  position: 'New Position',
                  company: 'Company Name',
                  duration: 'January 2024 - Present',
                  description: 'Key responsibilities and achievements',
                  description_items: ['Key responsibility or achievement with specific results']
                })
                if (onDataChange) {
                  onDataChange(newData)
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 mt-8 flex items-center border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Add Position
            </button>
            </div>
          </div>

          {/* Education */}
          <div className={`${getCommentsForText?.('education section')?.some(c => c.targetText.startsWith('SECTION:Education')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              EDUCATION
            </h3>
            <div className="space-y-4">
              {currentData.education.map((edu, index) => (
                <div key={edu.id} className="relative group"
                  onMouseEnter={() => setHoveredEducationDelete(index)}
                  onMouseLeave={() => setHoveredEducationDelete(null)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newData = { ...currentData }
                          newData.education[index].degree = e.target.value
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                        }}
                        className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-full"
                        placeholder="Degree"
                      />
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => {
                          const newData = { ...currentData }
                          newData.education[index].school = e.target.value
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                        }}
                        className="text-gray-600 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-full"
                        placeholder="School/University"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={edu.duration}
                        onChange={(e) => {
                          const newData = { ...currentData }
                          newData.education[index].duration = e.target.value
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                        }}
                        className="text-sm text-gray-500 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-[200px]"
                        placeholder="Duration"
                      />
                      {hoveredEducationDelete === index && (
                        <span 
                          className="text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newData = { ...currentData }
                            newData.education.splice(index, 1)
                            if (onDataChange) {
                              onDataChange(newData)
                            }
                            setHoveredEducationDelete(null)
                          }}
                          title="Delete education"
                        >
                          ×
                        </span>
                      )}
                    </div>
                  </div>
                  {(edu.description || hoveredEducationDelete === index) && (
                    <textarea
                      value={edu.description || ''}
                      onChange={(e) => {
                        const newData = { ...currentData }
                        newData.education[index].description = e.target.value
                        if (onDataChange) {
                          onDataChange(newData)
                        }
                      }}
                      className="text-gray-700 text-sm bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-full"
                      rows={1}
                      placeholder="Additional details (optional)"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const newData = { ...currentData }
                  newData.education.push({
                    id: `edu-${Date.now()}`,
                    degree: 'Bachelor Degree',
                    school: 'University Name',
                    duration: '2018 - 2021',
                    description: ''
                  })
                  if (onDataChange) {
                    onDataChange(newData)
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 mt-4 flex items-center"
              >
                + Add Education
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
