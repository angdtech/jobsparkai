'use client'

import { useState, useEffect } from 'react'
import { SmartText } from './SmartText'
import { FeedbackType } from './CommentHighlight'
import { useTemplateStyle } from '@/hooks/useTemplateStyle'

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
  const [currentData, setCurrentData] = useState(data)
  
  // Database-driven styling
  const { styleConfig, isLoading } = useTemplateStyle('test-session')
  const [currentStyle, setCurrentStyle] = useState<string>('professional_sidebar')
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  
  useEffect(() => {
    if (styleConfig) {
      console.log('🎨 Style config loaded:', styleConfig)
    }
  }, [styleConfig])

  return (
    <div className="relative">
      {/* Layout: Single Column or Sidebar */}
      {currentStyle === 'clean_single_column' ? (
        /* Single Column Layout */
        <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
          {/* Header */}
          <div className="text-center mb-8 border-b border-gray-200 pb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {currentData.personalInfo.name}
            </h1>
            <div className="text-xl text-gray-600 mb-4">
              {currentData.personalInfo.title}
            </div>
            {/* Contact Info Row */}
            <div className="flex justify-center space-x-6 text-gray-600 text-sm">
              <span>{currentData.personalInfo.email}</span>
              <span>{currentData.personalInfo.phone}</span>
              <span>{currentData.personalInfo.address}</span>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">PROFESSIONAL SUMMARY</h2>
            <p className="text-gray-700 leading-relaxed">
              {currentData.personalInfo.summary}
            </p>
          </div>

          {/* Experience */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">PROFESSIONAL EXPERIENCE</h2>
            {currentData.experience.map((exp) => (
              <div key={exp.id} className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                    <div className="text-gray-700 font-medium">{exp.company}</div>
                  </div>
                  <div className="text-gray-600 text-sm">{exp.duration}</div>
                </div>
                {exp.description_items && exp.description_items.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {exp.description_items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-700">{exp.description}</div>
                )}
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">EDUCATION</h2>
            {currentData.education.map((edu) => (
              <div key={edu.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    <div className="text-gray-700">{edu.school}</div>
                  </div>
                  <div className="text-gray-600 text-sm">{edu.duration}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">SKILLS</h2>
            <div className="grid grid-cols-3 gap-4">
              {currentData.skills.map((skill) => (
                <div key={skill.id} className="text-center">
                  <div className="font-medium text-gray-900">{skill.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Sidebar Layout */
        <div className="flex h-full bg-white">
        {/* Left Sidebar */}
        <div className={`w-80 text-white p-8 flex flex-col ${
          currentStyle === 'professional_sidebar' ? 'bg-slate-800' : 'bg-blue-900'
        }`}>
          {/* Contact */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">CONTACT</h2>
            <div className="space-y-2 text-sm">
              <div>{currentData.personalInfo.email}</div>
              <div>{currentData.personalInfo.phone}</div>
              <div>{currentData.personalInfo.address}</div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">SKILLS</h2>
            <div className="space-y-3">
              {currentData.skills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{skill.name}</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="bg-gray-600 h-2 rounded-full">
                    <div 
                      className="bg-white h-2 rounded-full" 
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          {currentData.languages && currentData.languages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">LANGUAGES</h2>
              <div className="space-y-2 text-sm">
                {currentData.languages.map((lang) => (
                  <div key={lang.id} className="flex justify-between">
                    <span>{lang.name}</span>
                    <span>{lang.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8 bg-white">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {currentData.personalInfo.name}
            </h1>
            <div className="text-xl text-gray-600 mb-4">
              {currentData.personalInfo.title}
            </div>
          </div>

          {/* Professional Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">
              PROFESSIONAL SUMMARY
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {currentData.personalInfo.summary}
            </p>
          </div>

          {/* Experience */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">
              PROFESSIONAL EXPERIENCE
            </h2>
            {currentData.experience.map((exp) => (
              <div key={exp.id} className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                    <div className="text-gray-700 font-medium">{exp.company}</div>
                  </div>
                  <div className="text-gray-600 text-sm">{exp.duration}</div>
                </div>
                
                {exp.description_items && exp.description_items.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {exp.description_items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-700">{exp.description}</div>
                )}
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">
              EDUCATION
            </h2>
            {currentData.education.map((edu) => (
              <div key={edu.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    <div className="text-gray-700">{edu.school}</div>
                  </div>
                  <div className="text-gray-600 text-sm">{edu.duration}</div>
                </div>
                {edu.description && (
                  <p className="text-gray-600 text-sm mt-1">{edu.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Awards */}
          {currentData.awards && currentData.awards.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-4">
                AWARDS & ACHIEVEMENTS
              </h2>
              {currentData.awards.map((award) => (
                <div key={award.id} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{award.title}</h3>
                      <p className="text-gray-600 text-sm">{award.description}</p>
                    </div>
                    <div className="text-gray-600 text-sm">{award.year}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Style Menu */}
      {isEditable && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="mb-2 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center text-lg transition-colors"
          >
            🎨
          </button>

          {showStyleMenu && (
            <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose Template Style</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentStyle('professional_sidebar')
                    console.log('🎨 Switching to professional_sidebar')
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentStyle === 'professional_sidebar' 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">Professional Sidebar</span>
                  <div className="text-xs text-gray-500">Dark gray sidebar</div>
                </button>
                
                <button
                  onClick={() => {
                    setCurrentStyle('creative_sidebar')
                    console.log('🎨 Switching to creative_sidebar')
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentStyle === 'creative_sidebar' 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">Creative Sidebar</span>
                  <div className="text-xs text-gray-500">Blue sidebar</div>
                </button>

                <button
                  onClick={() => {
                    setCurrentStyle('clean_single_column')
                    console.log('🎨 Switching to clean_single_column')
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentStyle === 'clean_single_column' 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">Clean Single Column</span>
                  <div className="text-xs text-gray-500">Minimal, centered layout</div>
                </button>
              </div>

              <button
                onClick={() => setShowStyleMenu(false)}
                className="mt-3 w-full px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border-t border-gray-200 pt-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}