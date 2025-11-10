import { ContactDetailsInline } from './ContactDetailsInline'
import { SkillsInline } from './SkillsInline'
import { EditableText } from './EditableText'
import { SmartText } from './SmartText'
import { Plus, Trash2 } from 'lucide-react'

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
          <EditableText
            value={data.personalInfo.name}
            onChange={(value) => updatePersonalInfo('name', value)}
            className="text-4xl font-bold text-gray-900"
          />
        </h1>
        <p className="text-xl text-gray-600">
          <EditableText
            value={data.personalInfo.title}
            onChange={(value) => updatePersonalInfo('title', value)}
            className="text-xl text-gray-600"
          />
        </p>
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
            <EditableText
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
          {data.experience.map((exp, index) => (
            <div key={exp.id} className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    <EditableText
                      value={exp.position}
                      onChange={(value) => {
                        const newExp = [...data.experience]
                        newExp[index] = { ...exp, position: value }
                        onDataChange({ ...data, experience: newExp })
                      }}
                      className="font-semibold text-gray-900"
                    />
                  </h4>
                  <p className="text-gray-600">
                    <EditableText
                      value={exp.company}
                      onChange={(value) => {
                        const newExp = [...data.experience]
                        newExp[index] = { ...exp, company: value }
                        onDataChange({ ...data, experience: newExp })
                      }}
                      className="text-gray-600"
                    />
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  <EditableText
                    value={exp.duration}
                    onChange={(value) => {
                      const newExp = [...data.experience]
                      newExp[index] = { ...exp, duration: value }
                      onDataChange({ ...data, experience: newExp })
                    }}
                    className="text-sm text-gray-500"
                  />
                </span>
              </div>
              {exp.description_items && exp.description_items.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {exp.description_items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <EditableText
                        value={item}
                        onChange={(value) => {
                          const newExp = [...data.experience]
                          const newItems = [...(exp.description_items || [])]
                          newItems[itemIdx] = value
                          newExp[index] = { ...exp, description_items: newItems }
                          onDataChange({ ...data, experience: newExp })
                        }}
                        className="text-gray-700"
                      />
                    </li>
                  ))}
                </ul>
              ) : exp.description ? (
                <p className="text-gray-700">
                  <EditableText
                    value={exp.description}
                    onChange={(value) => {
                      const newExp = [...data.experience]
                      newExp[index] = { ...exp, description: value }
                      onDataChange({ ...data, experience: newExp })
                    }}
                    multiline
                    className="text-gray-700"
                  />
                </p>
              ) : null}
            </div>
          ))}
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
                    <EditableText
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
                    <EditableText
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
                  <EditableText
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
                  <EditableText
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
