'use client'

import { useState } from 'react'

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
}

interface ResumeTemplateSimpleProps {
  data: ResumeData
  onDataChange: (data: ResumeData) => void
  isEditable?: boolean
}

export function ResumeTemplateSimple({ data, onDataChange, isEditable = false }: ResumeTemplateSimpleProps) {
  const [editingField, setEditingField] = useState<string | null>(null)

  const updateField = (path: string, value: any) => {
    const pathArray = path.split('.')
    const newData = JSON.parse(JSON.stringify(data))
    
    let current = newData
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]]
    }
    current[pathArray[pathArray.length - 1]] = value
    
    onDataChange(newData)
    setEditingField(null)
  }

  const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(data))
    newData[arrayName][index][field] = value
    onDataChange(newData)
    setEditingField(null)
  }

  const addArrayItem = (arrayName: string, newItem: any) => {
    const newData = JSON.parse(JSON.stringify(data))
    newData[arrayName].push(newItem)
    onDataChange(newData)
  }

  const removeArrayItem = (arrayName: string, index: number) => {
    const newData = JSON.parse(JSON.stringify(data))
    newData[arrayName].splice(index, 1)
    onDataChange(newData)
  }

  const EditableText = ({ 
    value, 
    onSave, 
    className = "", 
    multiline = false,
    fieldKey
  }: {
    value: string
    onSave: (value: string) => void
    className?: string
    multiline?: boolean
    fieldKey: string
  }) => {
    if (!isEditable) {
      return multiline ? (
        <div className={className} style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
      ) : (
        <span className={className}>{value}</span>
      )
    }

    if (editingField === fieldKey) {
      return multiline ? (
        <textarea
          value={value}
          onChange={(e) => onSave(e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              setEditingField(null)
            }
            if (e.key === 'Escape') {
              setEditingField(null)
            }
          }}
          className={`${className} border-2 border-blue-400 rounded px-2 py-1 resize-none`}
          autoFocus
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onSave(e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              setEditingField(null)
            }
          }}
          className={`${className} border-2 border-blue-400 rounded px-2 py-1`}
          autoFocus
        />
      )
    }

    return multiline ? (
      <div
        className={`${className} cursor-pointer hover:bg-gray-100 rounded px-2 py-1`}
        onClick={() => setEditingField(fieldKey)}
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {value || 'Click to edit...'}
      </div>
    ) : (
      <span
        className={`${className} cursor-pointer hover:bg-gray-100 rounded px-2 py-1`}
        onClick={() => setEditingField(fieldKey)}
      >
        {value || 'Click to edit...'}
      </span>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8" style={{ minHeight: '297mm', aspectRatio: '210/297' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
        <EditableText
          value={data.personalInfo.name}
          onSave={(value) => updateField('personalInfo.name', value)}
          className="text-3xl font-bold text-gray-900 mb-2 block"
          fieldKey="personalInfo.name"
        />
        <EditableText
          value={data.personalInfo.title}
          onSave={(value) => updateField('personalInfo.title', value)}
          className="text-lg text-gray-600 mb-4 block"
          fieldKey="personalInfo.title"
        />
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          <EditableText
            value={data.personalInfo.email}
            onSave={(value) => updateField('personalInfo.email', value)}
            className=""
            fieldKey="personalInfo.email"
          />
          <EditableText
            value={data.personalInfo.phone}
            onSave={(value) => updateField('personalInfo.phone', value)}
            className=""
            fieldKey="personalInfo.phone"
          />
          <EditableText
            value={data.personalInfo.address}
            onSave={(value) => updateField('personalInfo.address', value)}
            className=""
            fieldKey="personalInfo.address"
          />
        </div>
      </div>

      {/* Summary */}
      {data.personalInfo.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            SUMMARY
          </h2>
          <EditableText
            value={data.personalInfo.summary}
            onSave={(value) => updateField('personalInfo.summary', value)}
            className="text-gray-700 leading-relaxed"
            fieldKey="personalInfo.summary"
            multiline
          />
        </div>
      )}

      {/* Experience */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-1">
          PROFESSIONAL EXPERIENCE
        </h2>
        <div className="space-y-6">
          {data.experience.map((exp, index) => (
            <div key={exp.id} className="relative group">
              {isEditable && (
                <button
                  onClick={() => removeArrayItem('experience', index)}
                  className="absolute -right-2 -top-2 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 z-10"
                >
                  ×
                </button>
              )}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <EditableText
                    value={exp.position}
                    onSave={(value) => updateArrayItem('experience', index, 'position', value)}
                    className="text-lg font-bold text-gray-900"
                    fieldKey={`experience.${index}.position`}
                  />
                  <div className="text-gray-600">
                    <EditableText
                      value={exp.company}
                      onSave={(value) => updateArrayItem('experience', index, 'company', value)}
                      className="font-medium"
                      fieldKey={`experience.${index}.company`}
                    />
                  </div>
                </div>
                <EditableText
                  value={exp.duration}
                  onSave={(value) => updateArrayItem('experience', index, 'duration', value)}
                  className="text-sm text-gray-500 font-medium whitespace-nowrap ml-4"
                  fieldKey={`experience.${index}.duration`}
                />
              </div>
              <EditableText
                value={exp.description}
                onSave={(value) => updateArrayItem('experience', index, 'description', value)}
                className="text-gray-700 text-sm leading-relaxed ml-4"
                fieldKey={`experience.${index}.description`}
                multiline
              />
            </div>
          ))}
          {isEditable && (
            <button
              onClick={() => addArrayItem('experience', {
                id: `exp-${Date.now()}`,
                position: 'New Position',
                company: 'Company Name',
                duration: '2024 - Present',
                description: 'Job responsibilities and achievements'
              })}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded"
            >
              + Add Experience
            </button>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-1">
          EDUCATION
        </h2>
        <div className="space-y-4">
          {data.education.map((edu, index) => (
            <div key={edu.id} className="relative group">
              {isEditable && (
                <button
                  onClick={() => removeArrayItem('education', index)}
                  className="absolute -right-2 -top-2 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 z-10"
                >
                  ×
                </button>
              )}
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1">
                  <EditableText
                    value={edu.degree}
                    onSave={(value) => updateArrayItem('education', index, 'degree', value)}
                    className="text-lg font-bold text-gray-900"
                    fieldKey={`education.${index}.degree`}
                  />
                  <div className="text-gray-600">
                    <EditableText
                      value={edu.school}
                      onSave={(value) => updateArrayItem('education', index, 'school', value)}
                      className="font-medium"
                      fieldKey={`education.${index}.school`}
                    />
                  </div>
                </div>
                <EditableText
                  value={edu.duration}
                  onSave={(value) => updateArrayItem('education', index, 'duration', value)}
                  className="text-sm text-gray-500 font-medium whitespace-nowrap ml-4"
                  fieldKey={`education.${index}.duration`}
                />
              </div>
              {edu.description && (
                <EditableText
                  value={edu.description}
                  onSave={(value) => updateArrayItem('education', index, 'description', value)}
                  className="text-gray-700 text-sm leading-relaxed ml-4"
                  fieldKey={`education.${index}.description`}
                  multiline
                />
              )}
            </div>
          ))}
          {isEditable && (
            <button
              onClick={() => addArrayItem('education', {
                id: `edu-${Date.now()}`,
                degree: 'Degree Name',
                school: 'University Name',
                duration: '2020 - 2024',
                description: ''
              })}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded"
            >
              + Add Education
            </button>
          )}
        </div>
      </div>

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-1">
            SKILLS
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data.skills.map((skill, index) => (
              <div key={skill.id} className="flex justify-between items-center group">
                <EditableText
                  value={skill.name}
                  onSave={(value) => updateArrayItem('skills', index, 'name', value)}
                  className="text-gray-700"
                  fieldKey={`skills.${index}.name`}
                />
                {isEditable && (
                  <button
                    onClick={() => removeArrayItem('skills', index)}
                    className="text-red-600 hover:text-red-800 text-sm opacity-0 group-hover:opacity-100 ml-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditable && (
            <button
              onClick={() => addArrayItem('skills', {
                id: `skill-${Date.now()}`,
                name: 'New Skill',
                level: 80
              })}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded mt-4"
            >
              + Add Skill
            </button>
          )}
        </div>
      )}

      {/* Awards */}
      {data.awards && data.awards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-1">
            AWARDS & ACHIEVEMENTS
          </h2>
          <div className="space-y-3">
            {data.awards.map((award, index) => (
              <div key={award.id} className="relative group">
                {isEditable && (
                  <button
                    onClick={() => removeArrayItem('awards', index)}
                    className="absolute -right-2 -top-2 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 z-10"
                  >
                    ×
                  </button>
                )}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <EditableText
                      value={award.title}
                      onSave={(value) => updateArrayItem('awards', index, 'title', value)}
                      className="font-bold text-gray-900"
                      fieldKey={`awards.${index}.title`}
                    />
                    {award.description && (
                      <EditableText
                        value={award.description}
                        onSave={(value) => updateArrayItem('awards', index, 'description', value)}
                        className="text-gray-700 text-sm"
                        fieldKey={`awards.${index}.description`}
                        multiline
                      />
                    )}
                  </div>
                  <EditableText
                    value={award.year}
                    onSave={(value) => updateArrayItem('awards', index, 'year', value)}
                    className="text-sm text-gray-500 font-medium whitespace-nowrap ml-4"
                    fieldKey={`awards.${index}.year`}
                  />
                </div>
              </div>
            ))}
          </div>
          {isEditable && (
            <button
              onClick={() => addArrayItem('awards', {
                id: `award-${Date.now()}`,
                title: 'New Award',
                year: '2024',
                description: 'Award description'
              })}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded mt-4"
            >
              + Add Award
            </button>
          )}
        </div>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-1">
            LANGUAGES
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data.languages.map((lang, index) => (
              <div key={lang.id} className="flex justify-between items-center group">
                <div>
                  <EditableText
                    value={lang.name}
                    onSave={(value) => updateArrayItem('languages', index, 'name', value)}
                    className="text-gray-700 font-medium"
                    fieldKey={`languages.${index}.name`}
                  />
                  <div className="text-sm text-gray-500">
                    <EditableText
                      value={lang.level}
                      onSave={(value) => updateArrayItem('languages', index, 'level', value)}
                      className=""
                      fieldKey={`languages.${index}.level`}
                    />
                  </div>
                </div>
                {isEditable && (
                  <button
                    onClick={() => removeArrayItem('languages', index)}
                    className="text-red-600 hover:text-red-800 text-sm opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditable && (
            <button
              onClick={() => addArrayItem('languages', {
                id: `lang-${Date.now()}`,
                name: 'New Language',
                level: 'Intermediate'
              })}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded mt-4"
            >
              + Add Language
            </button>
          )}
        </div>
      )}
    </div>
  )
}