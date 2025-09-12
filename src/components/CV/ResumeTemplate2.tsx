'use client'

import { useState } from 'react'
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

  const handleSave = () => {
    onDataChange(editData)
    setIsEditing(false)
  }

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

      <div className="w-full max-w-4xl mx-auto bg-white flex min-h-screen">
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
                <span className="w-4 h-4 mr-3">📍</span>
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
                <span className="w-4 h-4 mr-3">📞</span>
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
                <span className="w-4 h-4 mr-3">✉️</span>
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
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">SKILLS</h3>
            <ul className="space-y-2">
              {currentData.skills.map((skill, index) => (
                <li key={skill.id} className="flex justify-between items-center group">
                  {isEditing ? (
                    <div className="w-full">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateArrayItem('skills', index, 'name', e.target.value)}
                        className="text-sm bg-slate-700 text-white rounded px-2 py-1 w-full mb-1"
                        placeholder="Skill name"
                      />
                      <button
                        onClick={() => removeArrayItem('skills', index)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        × Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm">{skill.name}</div>
                  )}
                </li>
              ))}
              {isEditing && (
                <li>
                  <button
                    onClick={() => addArrayItem('skills', {
                      id: `skill-${Date.now()}`,
                      name: 'New Skill',
                      level: 80
                    })}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    + Add Skill
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Languages */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">LANGUAGES</h3>
            <div className="space-y-2">
              {currentData.languages.map((lang, index) => (
                <div key={lang.id} className="group">
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={lang.name}
                        onChange={(e) => updateArrayItem('languages', index, 'name', e.target.value)}
                        className="text-sm font-medium bg-slate-700 text-white rounded px-2 py-1 w-full mb-1"
                        placeholder="Language"
                      />
                      <input
                        type="text"
                        value={lang.level}
                        onChange={(e) => updateArrayItem('languages', index, 'level', e.target.value)}
                        className="text-xs text-gray-300 bg-slate-700 text-white rounded px-2 py-1 w-full mb-1"
                        placeholder="Level"
                      />
                      <button
                        onClick={() => removeArrayItem('languages', index)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        × Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium">{lang.name}</div>
                      <div className="text-xs text-gray-300">{lang.level}</div>
                    </div>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={() => addArrayItem('languages', {
                    id: `lang-${Date.now()}`,
                    name: 'New Language',
                    level: 'Intermediate'
                  })}
                  className="text-sm text-blue-300 hover:text-blue-200"
                >
                  + Add Language
                </button>
              )}
            </div>
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
                <input
                  type="text"
                  value={currentData.personalInfo.title}
                  onChange={(e) => updateField('personalInfo.title', e.target.value)}
                  className="text-xl text-gray-600 mb-4 border-b border-gray-300 w-full bg-transparent"
                  placeholder="Job Title"
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
                <p className="text-xl text-gray-600 mb-4">
                  <SmartText 
                    text={currentData.personalInfo.title}
                    comments={getCommentsForText?.(currentData.personalInfo.title) || []}
                    onShowComments={onShowComments}
                  />
                </p>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              PROFILE
            </h3>
            {isEditing ? (
              <textarea
                value={currentData.personalInfo.summary}
                onChange={(e) => updateField('personalInfo.summary', e.target.value)}
                className="text-sm text-gray-700 leading-relaxed border border-gray-300 rounded px-3 py-2 w-full"
                rows={4}
                placeholder="Professional summary"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">
                <SmartText 
                  text={currentData.personalInfo.summary}
                  comments={getCommentsForText?.(currentData.personalInfo.summary) || []}
                  onShowComments={onShowComments}
                />
              </p>
            )}
          </div>

          {/* Professional Experience */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              PROFESSIONAL EXPERIENCE
            </h3>
            <div className="space-y-6">
            {currentData.experience.map((exp, index) => (
              <div key={exp.id} className="relative group">
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
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">{exp.duration}</span>
                    </div>
                    <ul className="space-y-1 ml-4">
                      {exp.description.split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                        <li key={lineIndex} className="text-gray-700 text-sm flex">
                          <span className="mr-2">•</span>
                          <SmartText 
                            text={line.trim()}
                            comments={getCommentsForText?.(line.trim()) || []}
                            onShowComments={onShowComments}
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={() => addArrayItem('experience', {
                  id: `exp-${Date.now()}`,
                  position: 'New Position',
                  company: 'Company Name',
                  duration: 'January 2024 - Present',
                  description: 'Key responsibilities and achievements'
                })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Experience
              </button>
            )}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              EDUCATION
            </h3>
            <div className="space-y-4">
              {currentData.education.map((edu, index) => (
                <div key={edu.id} className="relative group">
                  {isEditing ? (
                    <div className="space-y-2 p-3 border border-gray-300 rounded">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-b border-gray-300 w-full bg-transparent"
                        placeholder="Degree"
                      />
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => updateArrayItem('education', index, 'school', e.target.value)}
                        className="text-gray-600 border-b border-gray-300 w-full bg-transparent"
                        placeholder="School/University"
                      />
                      <input
                        type="text"
                        value={edu.duration}
                        onChange={(e) => updateArrayItem('education', index, 'duration', e.target.value)}
                        className="text-sm text-gray-500 border-b border-gray-300 w-full bg-transparent"
                        placeholder="Duration"
                      />
                      {edu.description && (
                        <textarea
                          value={edu.description}
                          onChange={(e) => updateArrayItem('education', index, 'description', e.target.value)}
                          className="text-gray-700 text-sm border border-gray-300 rounded px-3 py-2 w-full"
                          rows={2}
                          placeholder="Additional details"
                        />
                      )}
                      <button
                        onClick={() => removeArrayItem('education', index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        × Remove Education
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.school}</p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">{edu.duration}</span>
                      </div>
                      {edu.description && (
                        <p className="text-gray-700 text-sm">{edu.description}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={() => addArrayItem('education', {
                    id: `edu-${Date.now()}`,
                    degree: 'Bachelor Degree',
                    school: 'University Name',
                    duration: '2018 - 2021',
                    description: ''
                  })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Education
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}