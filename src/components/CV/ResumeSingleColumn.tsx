import { useState } from 'react'
import { ContactDetailsInline } from './ContactDetailsInline'
import { SkillsInline } from './SkillsInline'

// Simple inline editable text component with auto-expanding textarea
function SimpleEditableText({ value, onChange, multiline = false, className = '', fullWidth = false }: {
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  className?: string
  fullWidth?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const textareaRef = useState<HTMLTextAreaElement | null>(null)[0]

  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }

  // Auto-resize textarea to fit content
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  if (isEditing) {
    // Always use textarea for fullWidth items (like experience bullets) so they can expand
    if (multiline || fullWidth) {
      return (
        <textarea
          ref={(el) => {
            if (el) {
              autoResize(el)
            }
          }}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            autoResize(e.target)
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditValue(value)
              setIsEditing(false)
            }
          }}
          className={`${className} border border-blue-300 rounded px-2 py-1 w-full resize-none overflow-hidden`}
          autoFocus
        />
      )
    }
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') {
            setEditValue(value)
            setIsEditing(false)
          }
        }}
        className={`${className} border border-blue-300 rounded px-2 py-1 min-w-[200px]`}
        autoFocus
      />
    )
  }

  return (
    <span
      onClick={() => {
        setEditValue(value)
        setIsEditing(true)
      }}
      className={`${className} cursor-pointer hover:bg-blue-50 rounded px-1 ${fullWidth ? 'block' : 'inline'}`}
    >
      {value || 'Click to edit...'}
    </span>
  )
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

interface ResumeSingleColumnProps {
  data: ResumeData
  onDataChange: (data: ResumeData) => void
}

export function ResumeSingleColumn({ data, onDataChange }: ResumeSingleColumnProps) {
  const updatePersonalInfo = (field: string, value: string) => {
    onDataChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    })
  }

  const updateSkills = (skills: any[]) => {
    onDataChange({
      ...data,
      skills
    })
  }

  return (
    <div className="bg-white p-12">
      {/* Name and Title */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          <SimpleEditableText
            value={data.personalInfo.name}
            onChange={(value) => updatePersonalInfo('name', value)}
            className="text-4xl font-bold text-gray-900"
          />
        </h1>
        <div className="text-xl text-gray-600 relative group inline-block">
          <SimpleEditableText
            value={data.personalInfo.tagline || data.personalInfo.title}
            onChange={(value) => updatePersonalInfo(data.personalInfo.tagline ? 'tagline' : 'title', value)}
            className="text-xl text-gray-600"
          />
          {(data.personalInfo.tagline || data.personalInfo.title) && (
            <button
              onClick={() => updatePersonalInfo(data.personalInfo.tagline ? 'tagline' : 'title', '')}
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
              title="Remove title"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Contact Details Inline */}
      <ContactDetailsInline
        personalInfo={data.personalInfo}
        onUpdate={updatePersonalInfo}
      />

      {/* Summary */}
      {data.personalInfo.summary && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="text-gray-700">
            <SimpleEditableText
              value={data.personalInfo.summary}
              onChange={(value) => updatePersonalInfo('summary', value)}
              multiline
              className="text-gray-700"
            />
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience</h3>
          {data.experience
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
            .map((exp) => {
              const actualIndex = data.experience.findIndex(e => e.id === exp.id)
              return (
            <div key={exp.id} className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    <SimpleEditableText
                      value={exp.position}
                      onChange={(value) => {
                        const newExp = [...data.experience]
                        newExp[actualIndex] = { ...exp, position: value }
                        onDataChange({ ...data, experience: newExp })
                      }}
                      className="font-semibold text-gray-900"
                    />
                  </h4>
                  <p className="text-gray-600">
                    <SimpleEditableText
                      value={exp.company}
                      onChange={(value) => {
                        const newExp = [...data.experience]
                        newExp[actualIndex] = { ...exp, company: value }
                        onDataChange({ ...data, experience: newExp })
                      }}
                      className="text-gray-600"
                    />
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  <SimpleEditableText
                    value={exp.duration}
                    onChange={(value) => {
                      const newExp = [...data.experience]
                      newExp[actualIndex] = { ...exp, duration: value }
                      onDataChange({ ...data, experience: newExp })
                    }}
                    className="text-sm text-gray-500"
                  />
                </span>
              </div>
              {exp.description_items && exp.description_items.length > 0 ? (
                <ul className="list-disc ml-5 space-y-1 text-gray-700">
                  {exp.description_items.map((item, itemIdx) => {
                    // Convert to string format only
                    const itemText = typeof item === 'string' ? item : (item?.text || JSON.stringify(item) || 'Invalid item')
                    
                    return (
                      <li key={itemIdx} className="pl-2 relative">
                        <div className="group relative">
                          <SimpleEditableText
                            value={itemText}
                            onChange={(value) => {
                              const newExp = [...data.experience]
                              const newItems = [...(exp.description_items || [])]
                              newItems[itemIdx] = typeof value === 'string' ? value : String(value)
                              newExp[actualIndex] = { ...exp, description_items: newItems }
                              onDataChange({ ...data, experience: newExp })
                            }}
                            className="text-gray-700"
                            fullWidth
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : exp.description ? (
                <p className="text-gray-700">
                  <SimpleEditableText
                    value={exp.description}
                    onChange={(value) => {
                      const newExp = [...data.experience]
                      newExp[actualIndex] = { ...exp, description: value }
                      onDataChange({ ...data, experience: newExp })
                    }}
                    multiline
                    className="text-gray-700"
                  />
                </p>
              ) : null}
            </div>
          )
            })}
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
          {data.education.map((edu, index) => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    <SimpleEditableText
                      value={edu.degree}
                      onChange={(value) => {
                        const newEdu = [...data.education]
                        newEdu[index] = { ...edu, degree: value }
                        onDataChange({ ...data, education: newEdu })
                      }}
                      className="font-semibold text-gray-900"
                    />
                  </h4>
                  <p className="text-gray-600">
                    <SimpleEditableText
                      value={edu.school}
                      onChange={(value) => {
                        const newEdu = [...data.education]
                        newEdu[index] = { ...edu, school: value }
                        onDataChange({ ...data, education: newEdu })
                      }}
                      className="text-gray-600"
                    />
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  <SimpleEditableText
                    value={edu.duration}
                    onChange={(value) => {
                      const newEdu = [...data.education]
                      newEdu[index] = { ...edu, duration: value }
                      onDataChange({ ...data, education: newEdu })
                    }}
                    className="text-sm text-gray-500"
                  />
                </span>
              </div>
              {edu.description && (
                <p className="text-gray-700 text-sm">
                  <SimpleEditableText
                    value={edu.description}
                    onChange={(value) => {
                      const newEdu = [...data.education]
                      newEdu[index] = { ...edu, description: value }
                      onDataChange({ ...data, education: newEdu })
                    }}
                    multiline
                    className="text-gray-700 text-sm"
                  />
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills Inline */}
      <SkillsInline
        skills={data.skills}
        onUpdate={updateSkills}
      />
    </div>
  )
}
