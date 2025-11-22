'use client'

import { useState, useEffect, useRef } from 'react'
import { SmartText } from './SmartText'
import { EditableText } from './EditableText'
import { FeedbackType } from './CommentHighlight'
import { Trash2, Upload } from 'lucide-react'

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
    photoUrl?: string
  }
  sectionHeadings?: {
    profile?: string
    achievements?: string
    experience?: string
    education?: string
    skills?: string
    languages?: string
    contact?: string
  }
  experience: Array<{
    id: string
    position: string
    company: string
    duration: string
    description: string
    description_items?: Array<string | { text: string; type?: string }> | null
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
  hideContactDetails?: boolean
  hidePhoto?: boolean
  sectionLayout?: any
  onSectionLayoutChange?: (layout: any) => void
}

export function ResumeTemplate2({ 
  data, 
  onDataChange, 
  isEditable = false, 
  getCommentsForText, 
  onShowComments, 
  editModeText, 
  onEditModeTextChange,
  hideContactDetails = false,
  hidePhoto = false,
  sectionLayout,
  onSectionLayoutChange
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
  const [hoveredContactDelete, setHoveredContactDelete] = useState<string | null>(null)
  const [showSummaryFeedback, setShowSummaryFeedback] = useState(true)
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null)
  const summaryChangeTimerRef = useRef<NodeJS.Timeout | null>(null)

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
    if (onDataChange) {
      onDataChange(newData)
    }
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

  // Auto-resize summary textarea on mount and content change
  useEffect(() => {
    if (summaryTextareaRef.current) {
      summaryTextareaRef.current.style.height = 'auto'
      summaryTextareaRef.current.style.height = summaryTextareaRef.current.scrollHeight + 'px'
    }
  }, [currentData.personalInfo.summary])

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
          const itemText = typeof item === 'string' ? item : (item?.text || '')
          const trimmedItem = itemText.trim()
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
      {isEditable && isEditing && (
        <div className="absolute top-4 right-4 z-10">
          {isEditing && (
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

      <div className="w-full bg-white flex min-h-screen relative">

        {/* Left Sidebar */}
        <div className="w-[35%] bg-slate-800 text-white py-10 px-10 flex flex-col">
          {/* Profile Image */}
          {!hidePhoto && (
            <div className="mb-8 text-center">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.photoUrl = event.target?.result as string
                      onDataChange(newData)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer block relative group"
              >
                {currentData.personalInfo.photoUrl ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <img
                      src={currentData.personalInfo.photoUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover shadow-lg group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-400 rounded-full mx-auto flex items-center justify-center text-gray-600 text-sm hover:bg-gray-500 transition-colors">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Upload photo</span>
                    </div>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Contact */}
          {!hideContactDetails && (
          <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">
                <EditableText
                  text={currentData.sectionHeadings?.contact || 'CONTACT'}
                  comments={[]}
                  onTextChange={(newText) => {
                    const newData = JSON.parse(JSON.stringify(currentData))
                    if (!newData.sectionHeadings) newData.sectionHeadings = {}
                    newData.sectionHeadings.contact = newText
                    onDataChange(newData)
                  }}
                  className="text-lg font-bold"
                />
              </h3>
            <div className="space-y-2">
              <div className="flex items-center group"
                onMouseEnter={() => setHoveredContactDelete('location')}
                onMouseLeave={() => setHoveredContactDelete(null)}
              >
                <span className="w-16 text-xs text-gray-300 mr-2">Location:</span>
                <div className="text-sm flex-1">
                  <EditableText
                    text={currentData.personalInfo.address || ''}
                    comments={[]}
                    onTextChange={(newText) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.address = newText
                      onDataChange(newData)
                    }}
                    className="text-sm text-white"
                    hoverClassName="hover:bg-slate-700"
                    inputClassName="bg-slate-700 text-white"
                    placeholder="City, Country"
                  />
                </div>
                {hoveredContactDelete === 'location' && (
                  <span
                    className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.address = ''
                      onDataChange(newData)
                      setHoveredContactDelete(null)
                    }}
                    title="Delete location"
                  >
                    ×
                  </span>
                )}
              </div>
              <div className="flex items-center group"
                onMouseEnter={() => setHoveredContactDelete('phone')}
                onMouseLeave={() => setHoveredContactDelete(null)}
              >
                <span className="w-16 text-xs text-gray-300 mr-2">Phone:</span>
                <div className="text-sm flex-1">
                  <EditableText
                    text={currentData.personalInfo.phone || ''}
                    comments={[]}
                    onTextChange={(newText) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.phone = newText
                      onDataChange(newData)
                    }}
                    className="text-sm text-white"
                    hoverClassName="hover:bg-slate-700"
                    inputClassName="bg-slate-700 text-white"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                {hoveredContactDelete === 'phone' && (
                  <span
                    className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.phone = ''
                      onDataChange(newData)
                      setHoveredContactDelete(null)
                    }}
                    title="Delete phone"
                  >
                    ×
                  </span>
                )}
              </div>
              <div className="flex items-center group"
                onMouseEnter={() => setHoveredContactDelete('email')}
                onMouseLeave={() => setHoveredContactDelete(null)}
              >
                <span className="w-16 text-xs text-gray-300 mr-2">Email:</span>
                <div className="text-sm break-all flex-1">
                  <EditableText
                    text={currentData.personalInfo.email || ''}
                    comments={[]}
                    onTextChange={(newText) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.email = newText
                      onDataChange(newData)
                    }}
                    className="text-sm text-white"
                    hoverClassName="hover:bg-slate-700"
                    inputClassName="bg-slate-700 text-white"
                    placeholder="you@example.com"
                  />
                </div>
                {hoveredContactDelete === 'email' && (
                  <span
                    className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.email = ''
                      onDataChange(newData)
                      setHoveredContactDelete(null)
                    }}
                    title="Delete email"
                  >
                    ×
                  </span>
                )}
              </div>
              
              
              {/* LinkedIn URL */}
              <div className="flex items-center group"
                onMouseEnter={() => setHoveredContactDelete('linkedin')}
                onMouseLeave={() => setHoveredContactDelete(null)}
              >
                <span className="w-16 text-xs text-gray-300 mr-2">LinkedIn:</span>
                <div className="text-sm flex-1">
                  <EditableText
                    text={currentData.personalInfo.linkedin || ''}
                    comments={[]}
                    onTextChange={(newText) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.linkedin = newText
                      onDataChange(newData)
                    }}
                    className="text-sm text-white"
                    hoverClassName="hover:bg-slate-700"
                    inputClassName="bg-slate-700 text-white"
                    placeholder="linkedin.com/in/yourprofile"
                  />
                </div>
                {hoveredContactDelete === 'linkedin' && (
                  <span
                    className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.linkedin = ''
                      onDataChange(newData)
                      setHoveredContactDelete(null)
                    }}
                    title="Delete LinkedIn"
                  >
                    ×
                  </span>
                )}
              </div>
              
              {/* Website URL */}
              <div className="flex items-center group"
                onMouseEnter={() => setHoveredContactDelete('website')}
                onMouseLeave={() => setHoveredContactDelete(null)}
              >
                <span className="w-16 text-xs text-gray-300 mr-2">Website:</span>
                <div className="text-sm flex-1">
                  <EditableText
                    text={currentData.personalInfo.website || ''}
                    comments={[]}
                    onTextChange={(newText) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.website = newText
                      onDataChange(newData)
                    }}
                    className="text-sm text-white"
                    hoverClassName="hover:bg-slate-700"
                    inputClassName="bg-slate-700 text-white"
                    placeholder="yourwebsite.com"
                  />
                </div>
                {hoveredContactDelete === 'website' && (
                  <span
                    className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newData = JSON.parse(JSON.stringify(currentData))
                      newData.personalInfo.website = ''
                      onDataChange(newData)
                      setHoveredContactDelete(null)
                    }}
                    title="Delete website"
                  >
                    ×
                  </span>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Skills */}
          <div className={`mb-8 ${getCommentsForText?.('skills section')?.some(c => c.targetText.startsWith('SECTION:Skills')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <h3 className="text-lg font-bold mb-4">
              <EditableText
                text={currentData.sectionHeadings?.skills || 'SKILLS'}
                comments={[]}
                onTextChange={(newText) => {
                  const newData = JSON.parse(JSON.stringify(currentData))
                  if (!newData.sectionHeadings) newData.sectionHeadings = {}
                  newData.sectionHeadings.skills = newText
                  onDataChange(newData)
                }}
                className="text-lg font-bold"
              />
            </h3>
            
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
                      <ul className="space-y-2">
                        {skillList.map((skill, index) => (
                          <li 
                            key={`${category}-${index}`}
                            className="flex items-center group"
                            onMouseEnter={() => setHoveredSkillDelete(`${category}-${index}`)}
                            onMouseLeave={() => setHoveredSkillDelete(null)}
                          >
                            <span className="mr-2 text-white">•</span>
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
                              className="flex-1 text-white bg-transparent border-none outline-none hover:bg-gray-600 focus:bg-gray-600 focus:border focus:border-blue-300 rounded px-2 py-1"
                              placeholder="Skill"
                            />
                            {hoveredSkillDelete === `${category}-${index}` && (
                              <span 
                                className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer"
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
                        </ul>
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
                          className="text-xs text-blue-300 hover:text-blue-200 mt-2"
                        >
                          + Add
                        </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Old simple array format (fallback)
              <div>
                <ul className="space-y-2">
                  {(Array.isArray(currentData.skills) ? currentData.skills : []).map((skill, index) => (
                    <li 
                      key={skill.id || index}
                      className="flex items-center group"
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
                        className="flex-1 text-white bg-transparent border-none outline-none hover:bg-gray-600 focus:bg-gray-600 focus:border focus:border-blue-300 rounded px-2 py-1"
                        placeholder="Skill"
                      />
                      {hoveredSkillDelete === index && (
                        <span 
                          className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer"
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
                </ul>
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
                  className="text-xs text-blue-300 hover:text-blue-200 ml-2 mt-2"
                >
                  + Add
                </button>
              </div>
            )}
          </div>


          {/* Hobbies */}
          {currentData.hobbies && currentData.hobbies.length > 0 && (
            <div data-section="hobbies">
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
        <div className="w-[65%] py-10 px-10 bg-white">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <EditableText
                text={currentData.personalInfo.name}
                comments={getCommentsForText?.(currentData.personalInfo.name) || []}
                onShowComments={onShowComments}
                onTextChange={(newText) => updateField('personalInfo.name', newText)}
                className="text-4xl font-bold text-gray-900"
                placeholder="Your Name"
              />
            </h1>
            <div className="text-lg text-gray-700 mt-2">
              <EditableText
                text={currentData.personalInfo.tagline || ''}
                comments={getCommentsForText?.(currentData.personalInfo.tagline || '') || []}
                onShowComments={onShowComments}
                onTextChange={(newText) => updateField('personalInfo.tagline', newText)}
                className="text-lg text-gray-700"
                placeholder="Add Professional Title or Tagline"
              />
            </div>
          </div>

          {/* Profile */}
          <div data-section="summary" className={`mb-8 ${getCommentsForText?.(currentData.personalInfo.summary)?.some(c => c.targetText.startsWith('SECTION:Professional Summary')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              <EditableText
                text={currentData.sectionHeadings?.profile || 'SUMMARY'}
                comments={[]}
                onTextChange={(newText) => {
                  const newData = JSON.parse(JSON.stringify(currentData))
                  if (!newData.sectionHeadings) newData.sectionHeadings = {}
                  newData.sectionHeadings.profile = newText
                  onDataChange(newData)
                }}
                className="text-xl font-bold"
              />
            </h3>
            
            {/* Simple summary display */}
            {!isEditing && (
              <div className="mb-6">
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto'
                      el.style.height = el.scrollHeight + 'px'
                    }
                  }}
                  value={currentData.personalInfo.summary}
                  onChange={(e) => {
                    const newData = { ...currentData }
                    newData.personalInfo.summary = e.target.value
                    if (onDataChange) {
                      onDataChange(newData)
                    }
                  }}
                  className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 resize-none"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                  placeholder="Professional summary describing your experience and expertise"
                />
              </div>
            )}
            
          </div>

          {/* Achievements Section */}
          <div data-section="achievements" className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              <EditableText
                text={currentData.sectionHeadings?.achievements || 'ACHIEVEMENTS'}
                comments={[]}
                onTextChange={(newText) => {
                  const newData = JSON.parse(JSON.stringify(currentData))
                  if (!newData.sectionHeadings) newData.sectionHeadings = {}
                  newData.sectionHeadings.achievements = newText
                  onDataChange(newData)
                }}
                className="text-xl font-bold"
              />
            </h3>
            
            {/* Display achievements as bullet points */}
            {currentData.awards && currentData.awards.length > 0 && (
              <ul className="space-y-1 ml-4">
                {currentData.awards.map((award, index) => (
                  <li key={award.id} className="text-gray-700 text-sm flex relative"
                    onMouseEnter={() => setHoveredAchievementDelete(index)}
                    onMouseLeave={() => setHoveredAchievementDelete(null)}
                  >
                    <span className="mr-2 flex-shrink-0">•</span>
                    <div className="flex-1 flex items-start">
                      <textarea
                        value={award.title}
                        onChange={(e) => {
                          const newData = { ...currentData }
                          newData.awards[index].title = e.target.value
                          if (onDataChange) {
                            onDataChange(newData)
                          }
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement
                          target.style.height = 'auto'
                          target.style.height = target.scrollHeight + 'px'
                        }}
                        className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 resize-none overflow-hidden"
                        placeholder="Your achievement with specific metrics"
                        rows={1}
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
                  <EditableText
                    text={currentData.sectionHeadings?.experience || 'PROFESSIONAL EXPERIENCE'}
                    comments={[]}
                    onTextChange={(newText) => {
                      const newData = JSON.parse(JSON.stringify(currentData))
                      if (!newData.sectionHeadings) newData.sectionHeadings = {}
                      newData.sectionHeadings.experience = newText
                      onDataChange(newData)
                    }}
                    className="text-xl font-bold"
                  />
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
            
            {/* Add Position button at top */}
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
              className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Add Position
            </button>
            
            <div className="space-y-6">
            {currentData.experience
              .slice()
              .sort((a, b) => {
                const aHasPresent = a.duration.toLowerCase().includes('present')
                const bHasPresent = b.duration.toLowerCase().includes('present')
                if (aHasPresent && !bHasPresent) return -1
                if (!aHasPresent && bHasPresent) return 1
                const aYear = parseInt(a.duration.match(/\d{4}/)?.[0] || '0')
                const bYear = parseInt(b.duration.match(/\d{4}/)?.[0] || '0')
                return bYear - aYear
              })
              .map((exp, sortedIndex) => {
                const actualIndex = data.experience.findIndex(item => item.id === exp.id)
                return (
                  <div key={`exp-${exp.id}-${sortedIndex}`} className="relative group"
                    onMouseEnter={() => setHoveredExperienceDelete(sortedIndex)}
                    onMouseLeave={() => setHoveredExperienceDelete(null)}
                  >
                {isEditing ? (
                  <div className="space-y-2 p-3 border border-gray-300 rounded">
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateArrayItem('experience', actualIndex, 'position', e.target.value)}
                      className="text-lg font-bold text-gray-900 border-b border-gray-300 w-full bg-transparent"
                      placeholder="Position"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateArrayItem('experience', actualIndex, 'company', e.target.value)}
                      className="text-gray-600 border-b border-gray-300 w-full bg-transparent"
                      placeholder="Company"
                    />
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => updateArrayItem('experience', actualIndex, 'duration', e.target.value)}
                      className="text-sm text-gray-500 border-b border-gray-300 w-full bg-transparent"
                      placeholder="Duration"
                    />
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateArrayItem('experience', actualIndex, 'description', e.target.value)}
                      className="text-gray-700 text-sm border border-gray-300 rounded px-3 py-2 w-full"
                      rows={3}
                      placeholder="Job description and achievements"
                    />
                    <button
                      onClick={() => removeArrayItem('experience', actualIndex)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      × Remove Experience
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <button 
                        className="text-red-500 hover:text-red-700 cursor-pointer mr-2 p-1 transition-colors flex-shrink-0"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const newData = JSON.parse(JSON.stringify(data))
                          const actualIndex = data.experience.findIndex(item => item.id === exp.id)
                          newData.experience.splice(actualIndex, 1)
                          onDataChange(newData)
                        }}
                        title="Delete job"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex-1 mr-4 min-w-0">
                        <textarea
                          value={exp.position}
                          onChange={(e) => {
                            const newData = JSON.parse(JSON.stringify(data))
                            // Find the actual index in unsorted data
                            const actualIndex = data.experience.findIndex(item => item.id === exp.id)
                            newData.experience[actualIndex].position = e.target.value
                            onDataChange(newData)
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement
                            target.style.height = 'auto'
                            target.style.height = target.scrollHeight + 'px'
                          }}
                          className="text-lg font-bold text-gray-900 bg-transparent border border-transparent outline-none hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 -mx-2 -my-1 w-full cursor-text transition-all resize-none overflow-hidden"
                          placeholder="Job Title"
                          rows={1}
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newData = JSON.parse(JSON.stringify(data))
                            const actualIndex = data.experience.findIndex(item => item.id === exp.id)
                            newData.experience[actualIndex].company = e.target.value
                            onDataChange(newData)
                          }}
                          className="text-gray-600 bg-transparent border border-transparent outline-none hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 -mx-2 -my-1 w-full cursor-text transition-all"
                          placeholder="Company Name"
                        />
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => {
                            const newData = JSON.parse(JSON.stringify(data))
                            const actualIndex = data.experience.findIndex(item => item.id === exp.id)
                            newData.experience[actualIndex].duration = e.target.value
                            onDataChange(newData)
                          }}
                          className="text-sm text-gray-500 bg-transparent border border-transparent outline-none hover:bg-gray-50 hover:border-gray-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 -mx-2 -my-1 text-right min-w-[180px] cursor-text transition-all"
                          placeholder="Duration"
                        />
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
                            // Convert to string format only
                            const itemText = typeof item === 'string' ? item : (item?.text || JSON.stringify(item) || 'Invalid item')
                            
                            const expKey = `exp-${sortedIndex}`
                            const suggestions = improvementSuggestions[expKey] || []
                            const itemSuggestion = suggestions.find(s => s.original === itemText)
                            const isHighlighted = experienceImprovementMode && itemSuggestion
                            
                            return (
                              <li key={itemIndex} className="text-gray-700 text-sm flex items-start relative">
                                <span className="mr-2 flex-shrink-0 mt-0.5">•</span>
                                <div className="flex-1 relative group">
                                  
                                  {editingItem && editingItem.expIndex === actualIndex && editingItem.itemIndex === itemIndex ? (
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
                                          const currentItem = newData.experience[actualIndex].description_items[itemIndex]
                                          // Preserve type when saving
                                          if (typeof currentItem === 'object') {
                                            newData.experience[actualIndex].description_items[itemIndex] = {
                                              ...currentItem,
                                              text: editingItem.text
                                            }
                                          } else {
                                            newData.experience[actualIndex].description_items[itemIndex] = editingItem.text
                                          }
                                          if (onDataChange) {
                                            onDataChange(newData)
                                          }
                                          setEditingItem(null)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && e.ctrlKey) {
                                            // Save with Ctrl+Enter
                                            const newData = { ...currentData }
                                            const currentItem = newData.experience[actualIndex].description_items[itemIndex]
                                            // Preserve type when saving
                                            if (typeof currentItem === 'object') {
                                              newData.experience[actualIndex].description_items[itemIndex] = {
                                                ...currentItem,
                                                text: editingItem.text
                                              }
                                            } else {
                                              newData.experience[actualIndex].description_items[itemIndex] = editingItem.text
                                            }
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
                                      title="Click to edit"
                                      onMouseEnter={() => {
                                        if (isHighlighted) {
                                          setHoveredImprovement({
                                            expIndex: actualIndex,
                                            itemIndex,
                                            suggestion: itemSuggestion.improved,
                                            original: itemSuggestion.original
                                          })
                                        }
                                        setHoveredDeleteButton({ expIndex: actualIndex, itemIndex })
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
                                            newData.experience[actualIndex].description_items.splice(itemIndex, 1)
                                          } else {
                                            // Apply improvement
                                            newData.experience[actualIndex].description_items[itemIndex] = itemSuggestion.improved
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
                                            expIndex: actualIndex,
                                            itemIndex,
                                            text: itemText
                                          })
                                        }
                                      }}
                                      title="Click to edit"
                                    >
                                      <SmartText 
                                        text={itemText}
                                        comments={getCommentsForText?.(itemText) || []}
                                        onShowComments={onShowComments}
                                      />
                                      {hoveredDeleteButton?.expIndex === actualIndex && hoveredDeleteButton?.itemIndex === itemIndex && (
                                        <span 
                                          className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const newData = { ...currentData }
                                            newData.experience[actualIndex].description_items.splice(itemIndex, 1)
                                            if (onDataChange) {
                                              onDataChange(newData)
                                            }
                                            // Also remove any suggestions for this item
                                            const expKey = `exp-${sortedIndex}`
                                            const newSuggestions = { ...improvementSuggestions }
                                            if (newSuggestions[expKey]) {
                                              newSuggestions[expKey] = newSuggestions[expKey].filter(s => s.original !== itemText)
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
                                   hoveredImprovement.expIndex === actualIndex && 
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
                                                  newData.experience[actualIndex].description_items.splice(itemIndex, 1)
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
                                                    newData.experience[actualIndex].description_items[itemIndex] = suggestion.improved
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
                                                    newData.experience[actualIndex].description_items[itemIndex] = suggestion.improved
                                                    if (onDataChange) {
                                                      onDataChange(newData)
                                                    }
                                                    // Remove the merged bullet points
                                                    if (suggestion.mergeWith) {
                                                      suggestion.mergeWith.forEach(mergeText => {
                                                        const mergeIndex = newData.experience[actualIndex].description_items.findIndex(item => item === mergeText)
                                                        if (mergeIndex !== -1 && mergeIndex !== itemIndex) {
                                                          newData.experience[actualIndex].description_items.splice(mergeIndex, 1)
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
                            const expKey = `exp-${sortedIndex}`
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
                                          expIndex: actualIndex,
                                          itemIndex: lineIndex,
                                          suggestion: lineSuggestion.improved,
                                          original: lineSuggestion.original
                                        })
                                      }
                                      setHoveredDeleteButton({ expIndex: actualIndex, itemIndex: lineIndex })
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
                                    {hoveredDeleteButton?.expIndex === actualIndex && hoveredDeleteButton?.itemIndex === lineIndex && (
                                      <span 
                                        className="ml-2 text-blue-400 hover:text-blue-600 cursor-pointer transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const newData = { ...currentData }
                                          // Convert to description_items format and remove the line
                                          const lines = exp.description.split('\n').filter(line => line.trim())
                                          lines.splice(lineIndex, 1)
                                          newData.experience[actualIndex].description_items = lines
                                          delete newData.experience[actualIndex].description // Remove old format
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
                          return null
                        }
                      })()}
                    </ul>
                    
                    {/* Add more experience details button */}
                    <button
                      onClick={() => {
                        const newData = JSON.parse(JSON.stringify(data))
                        const actualIndex = data.experience.findIndex(item => item.id === exp.id)
                        if (!newData.experience[actualIndex].description_items) {
                          newData.experience[actualIndex].description_items = []
                        }
                        newData.experience[actualIndex].description_items.push('New responsibility or achievement')
                        if (onDataChange) {
                          onDataChange(newData)
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 ml-4 mt-3 mb-2 flex items-center"
                    >
                      + Add
                    </button>
                    
                  </>
                )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Education */}
          <div className={`${getCommentsForText?.('education section')?.some(c => c.targetText.startsWith('SECTION:Education')) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' : ''}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              <EditableText
                text={currentData.sectionHeadings?.education || 'EDUCATION'}
                comments={[]}
                onTextChange={(newText) => {
                  const newData = JSON.parse(JSON.stringify(currentData))
                  if (!newData.sectionHeadings) newData.sectionHeadings = {}
                  newData.sectionHeadings.education = newText
                  onDataChange(newData)
                }}
                className="text-xl font-bold"
              />
            </h3>
            <div className="space-y-4">
              {currentData.education.map((edu, index) => (
                <div key={edu.id} className="relative group"
                  onMouseEnter={() => setHoveredEducationDelete(index)}
                  onMouseLeave={() => setHoveredEducationDelete(null)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 mr-4">
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
                    <div className="flex items-center space-x-2 flex-shrink-0">
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
                        className="text-sm text-gray-500 bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-200 rounded px-2 py-1 -mx-2 -my-1 w-auto text-right"
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
