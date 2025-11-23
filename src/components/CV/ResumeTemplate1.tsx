'use client'

import { useState, useEffect } from 'react'

interface ResumeData {
  personalInfo: {
    name: string
    title: string
    email: string
    phone: string
    address: string
    summary: string
    linkedin?: string
    website?: string
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

interface ResumeTemplate1Props {
  data: ResumeData
  onDataChange: (data: ResumeData) => void
  isEditable?: boolean
}

export function ResumeTemplate1({ data, onDataChange, isEditable = false }: ResumeTemplate1Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(data)
  const [hoveredContactDelete, setHoveredContactDelete] = useState<string | null>(null)
  const [activeContactFields, setActiveContactFields] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    const fields = new Set<string>()
    if (currentData.personalInfo.phone && currentData.personalInfo.phone.trim()) fields.add('phone')
    if (currentData.personalInfo.email && currentData.personalInfo.email.trim()) fields.add('email')
    if (currentData.personalInfo.address && currentData.personalInfo.address.trim()) fields.add('address')
    if (currentData.personalInfo.linkedin && currentData.personalInfo.linkedin.trim()) fields.add('linkedin')
    if (currentData.personalInfo.website && currentData.personalInfo.website.trim()) fields.add('website')
    setActiveContactFields(fields)
  }, [currentData.personalInfo])

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

      <div className="w-full max-w-4xl mx-auto bg-white" style={{ minHeight: '297mm', aspectRatio: '210/297' }}>
        {/* Header Section */}
        <div className="flex h-48">
          {/* Left side - Photo placeholder */}
          <div className="w-48 bg-yellow-400 flex items-center justify-center">
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm">
              Photo
            </div>
          </div>
          
          {/* Right side - Name and title */}
          <div className="flex-1 bg-yellow-400 p-8 flex flex-col justify-center">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={currentData.personalInfo.name}
                  onChange={(e) => updateField('personalInfo.name', e.target.value)}
                  className="text-4xl font-bold text-black mb-2 bg-transparent border-b-2 border-black"
                  placeholder="Your Name"
                />
                <input
                  type="text"
                  value={currentData.personalInfo.title}
                  onChange={(e) => updateField('personalInfo.title', e.target.value)}
                  className="text-lg text-gray-800 bg-transparent border-b border-gray-600"
                  placeholder="Professional Title"
                />
                <textarea
                  value={currentData.personalInfo.summary}
                  onChange={(e) => updateField('personalInfo.summary', e.target.value)}
                  className="mt-4 text-sm text-gray-800 bg-transparent border border-gray-600 rounded p-2"
                  rows={3}
                  placeholder="Professional summary"
                />
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-black mb-2">{currentData.personalInfo.name}</h1>
                <p className="text-lg text-gray-800">{currentData.personalInfo.title}</p>
                <div className="mt-4 text-sm text-gray-800 leading-relaxed">
                  {currentData.personalInfo.summary}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-48 bg-gray-200 p-6 space-y-8">
            {/* Skills */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Skills</h3>
              <div className="space-y-3">
                {currentData.skills.map((skill, index) => (
                  <div key={skill.id}>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => updateArrayItem('skills', index, 'name', e.target.value)}
                          className="text-sm font-medium text-black bg-transparent border-b border-gray-600 w-full"
                        />
                        <div className="flex items-center mt-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={skill.level}
                            onChange={(e) => updateArrayItem('skills', index, 'level', parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                          />
                          <button
                            onClick={() => removeArrayItem('skills', index)}
                            className="ml-2 text-red-600 hover:text-red-800 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-black">{skill.name}</div>
                        <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${skill.level}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('skills', {
                      id: `skill-${Date.now()}`,
                      name: 'New Skill',
                      level: 80
                    })}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Skill
                  </button>
                )}
              </div>
            </div>

            {/* Awards */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Awards</h3>
              <div className="space-y-4">
                {currentData.awards.map((award, index) => (
                  <div key={award.id} className="relative group">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={award.year}
                          onChange={(e) => updateArrayItem('awards', index, 'year', e.target.value)}
                          className="text-xs font-bold text-gray-600 bg-transparent border-b border-gray-400 w-full mb-1"
                          placeholder="Year"
                        />
                        <input
                          type="text"
                          value={award.title}
                          onChange={(e) => updateArrayItem('awards', index, 'title', e.target.value)}
                          className="text-sm font-bold text-black bg-transparent border-b border-gray-600 w-full mb-1"
                          placeholder="Award Title"
                        />
                        <textarea
                          value={award.description}
                          onChange={(e) => updateArrayItem('awards', index, 'description', e.target.value)}
                          className="text-xs text-gray-700 bg-transparent border border-gray-400 rounded w-full"
                          rows={2}
                          placeholder="Description"
                        />
                        <button
                          onClick={() => removeArrayItem('awards', index)}
                          className="text-red-600 hover:text-red-800 text-sm mt-1"
                        >
                          × Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-gray-600">{award.year}</div>
                        <div className="text-sm font-bold text-black">{award.title}</div>
                        <div className="text-xs text-gray-700 mt-1">{award.description}</div>
                      </>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('awards', {
                      id: `award-${Date.now()}`,
                      title: 'New Award',
                      year: '2024',
                      description: 'Award description'
                    })}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Award
                  </button>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-xs">
                {activeContactFields.has('phone') && (
                <div className="flex items-center group"
                  onMouseEnter={() => setHoveredContactDelete('phone')}
                  onMouseLeave={() => setHoveredContactDelete(null)}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentData.personalInfo.phone || ''}
                      onChange={(e) => updateField('personalInfo.phone', e.target.value)}
                      className="text-black bg-transparent border-b border-gray-400 w-full hover:bg-gray-50 focus:bg-white"
                      placeholder="Phone"
                    />
                  </div>
                  {hoveredContactDelete === 'phone' && (
                    <span
                      className="ml-2 text-red-600 hover:text-red-800 cursor-pointer text-sm font-bold"
                      onClick={() => {
                        updateField('personalInfo.phone', '')
                        setActiveContactFields(prev => {
                          const newSet = new Set(prev)
                          newSet.delete('phone')
                          return newSet
                        })
                      }}
                      title="Delete phone"
                    >
                      ×
                    </span>
                  )}
                </div>
                )}
                {activeContactFields.has('email') && (
                <div className="flex items-center group"
                  onMouseEnter={() => setHoveredContactDelete('email')}
                  onMouseLeave={() => setHoveredContactDelete(null)}
                >
                  <div className="flex-1">
                    <input
                      type="email"
                      value={currentData.personalInfo.email || ''}
                      onChange={(e) => updateField('personalInfo.email', e.target.value)}
                      className="text-black bg-transparent border-b border-gray-400 w-full hover:bg-gray-50 focus:bg-white break-all"
                      placeholder="Email"
                    />
                  </div>
                  {hoveredContactDelete === 'email' && (
                    <span
                      className="ml-2 text-red-600 hover:text-red-800 cursor-pointer text-sm font-bold"
                      onClick={() => {
                        updateField('personalInfo.email', '')
                        setActiveContactFields(prev => {
                          const newSet = new Set(prev)
                          newSet.delete('email')
                          return newSet
                        })
                      }}
                      title="Delete email"
                    >
                      ×
                    </span>
                  )}
                </div>
                )}
                {activeContactFields.has('address') && (
                <div className="flex items-start group"
                  onMouseEnter={() => setHoveredContactDelete('address')}
                  onMouseLeave={() => setHoveredContactDelete(null)}
                >
                  <div className="flex-1">
                    <textarea
                      value={currentData.personalInfo.address || ''}
                      onChange={(e) => updateField('personalInfo.address', e.target.value)}
                      className="text-black bg-transparent border border-gray-400 rounded w-full hover:bg-gray-50 focus:bg-white"
                      rows={2}
                      placeholder="Address"
                    />
                  </div>
                  {hoveredContactDelete === 'address' && (
                    <span
                      className="ml-2 text-red-600 hover:text-red-800 cursor-pointer text-sm font-bold"
                      onClick={() => {
                        updateField('personalInfo.address', '')
                        setActiveContactFields(prev => {
                          const newSet = new Set(prev)
                          newSet.delete('address')
                          return newSet
                        })
                      }}
                      title="Delete address"
                    >
                      ×
                    </span>
                  )}
                </div>
                )}
                {activeContactFields.has('linkedin') && (
                <div className="flex items-center group"
                  onMouseEnter={() => setHoveredContactDelete('linkedin')}
                  onMouseLeave={() => setHoveredContactDelete(null)}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentData.personalInfo.linkedin || ''}
                      onChange={(e) => updateField('personalInfo.linkedin', e.target.value)}
                      className="text-black bg-transparent border-b border-gray-400 w-full hover:bg-gray-50 focus:bg-white break-all"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  {hoveredContactDelete === 'linkedin' && (
                    <span
                      className="ml-2 text-red-600 hover:text-red-800 cursor-pointer text-sm font-bold"
                      onClick={() => {
                        updateField('personalInfo.linkedin', '')
                        setActiveContactFields(prev => {
                          const newSet = new Set(prev)
                          newSet.delete('linkedin')
                          return newSet
                        })
                      }}
                      title="Delete LinkedIn"
                    >
                      ×
                    </span>
                  )}
                </div>
                )}
                {activeContactFields.has('website') && (
                <div className="flex items-center group"
                  onMouseEnter={() => setHoveredContactDelete('website')}
                  onMouseLeave={() => setHoveredContactDelete(null)}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentData.personalInfo.website || ''}
                      onChange={(e) => updateField('personalInfo.website', e.target.value)}
                      className="text-black bg-transparent border-b border-gray-400 w-full hover:bg-gray-50 focus:bg-white break-all"
                      placeholder="Website URL"
                    />
                  </div>
                  {hoveredContactDelete === 'website' && (
                    <span
                      className="ml-2 text-red-600 hover:text-red-800 cursor-pointer text-sm font-bold"
                      onClick={() => {
                        updateField('personalInfo.website', '')
                        setActiveContactFields(prev => {
                          const newSet = new Set(prev)
                          newSet.delete('website')
                          return newSet
                        })
                      }}
                      title="Delete website"
                    >
                      ×
                    </span>
                  )}
                </div>
                )}
                
                {(activeContactFields.size < 5) && (
                <div className="relative mt-4">
                  <button 
                    onClick={() => setHoveredContactDelete('addField')}
                    className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    + Add Contact Field ▼
                  </button>
                  {hoveredContactDelete === 'addField' && (
                    <div 
                      className="absolute left-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                      onMouseLeave={() => setHoveredContactDelete(null)}
                    >
                      <div className="py-1">
                        {!activeContactFields.has('phone') && (
                          <button
                            onClick={() => {
                              setActiveContactFields(prev => new Set(prev).add('phone'))
                              setHoveredContactDelete(null)
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            + Phone
                          </button>
                        )}
                        {!activeContactFields.has('email') && (
                          <button
                            onClick={() => {
                              setActiveContactFields(prev => new Set(prev).add('email'))
                              setHoveredContactDelete(null)
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            + Email
                          </button>
                        )}
                        {!activeContactFields.has('address') && (
                          <button
                            onClick={() => {
                              setActiveContactFields(prev => new Set(prev).add('address'))
                              setHoveredContactDelete(null)
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            + Address
                          </button>
                        )}
                        {!activeContactFields.has('linkedin') && (
                          <button
                            onClick={() => {
                              setActiveContactFields(prev => new Set(prev).add('linkedin'))
                              setHoveredContactDelete(null)
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            + LinkedIn
                          </button>
                        )}
                        {!activeContactFields.has('website') && (
                          <button
                            onClick={() => {
                              setActiveContactFields(prev => new Set(prev).add('website'))
                              setHoveredContactDelete(null)
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            + Website
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 bg-yellow-400 p-6">
            {/* Experience */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-black mb-6 border-b-2 border-black pb-2">
                Experience
              </h3>
              <div className="space-y-6">
                {currentData.experience.map((exp, index) => (
                  <div key={exp.id} className="relative group">
                    {isEditing ? (
                      <div className="space-y-2 p-3 border border-gray-600 rounded">
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => updateArrayItem('experience', index, 'duration', e.target.value)}
                          className="text-sm font-bold text-gray-800 bg-transparent border-b border-gray-600 w-full"
                          placeholder="Duration"
                        />
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateArrayItem('experience', index, 'position', e.target.value)}
                          className="text-lg font-bold text-black bg-transparent border-b border-black w-full"
                          placeholder="Position"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateArrayItem('experience', index, 'company', e.target.value)}
                          className="text-sm font-bold text-gray-800 bg-transparent border-b border-gray-600 w-full"
                          placeholder="Company"
                        />
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateArrayItem('experience', index, 'description', e.target.value)}
                          className="text-sm text-black bg-transparent border border-gray-600 rounded w-full p-2"
                          rows={3}
                          placeholder="Description"
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
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-bold text-gray-800">{exp.duration}</div>
                          <div className="text-lg font-bold text-black">{exp.position}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-800 mb-2">{exp.company}</div>
                        <div className="text-sm text-black leading-relaxed">{exp.description}</div>
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
                      duration: '2024 - Present',
                      description: 'Job responsibilities and achievements'
                    })}
                    className="text-sm text-blue-800 hover:text-blue-900 font-medium"
                  >
                    + Add Experience
                  </button>
                )}
              </div>
            </div>

            {/* Education */}
            <div>
              <h3 className="text-2xl font-bold text-black mb-6 border-b-2 border-black pb-2">
                Education
              </h3>
              <div className="space-y-6">
                {currentData.education.map((edu, index) => (
                  <div key={edu.id} className="relative group">
                    {isEditing ? (
                      <div className="space-y-2 p-3 border border-gray-600 rounded">
                        <input
                          type="text"
                          value={edu.duration}
                          onChange={(e) => updateArrayItem('education', index, 'duration', e.target.value)}
                          className="text-sm font-bold text-gray-800 bg-transparent border-b border-gray-600 w-full"
                          placeholder="Duration"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)}
                          className="text-lg font-bold text-black bg-transparent border-b border-black w-full"
                          placeholder="Degree"
                        />
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateArrayItem('education', index, 'school', e.target.value)}
                          className="text-sm font-bold text-gray-800 bg-transparent border-b border-gray-600 w-full"
                          placeholder="School"
                        />
                        <textarea
                          value={edu.description}
                          onChange={(e) => updateArrayItem('education', index, 'description', e.target.value)}
                          className="text-sm text-black bg-transparent border border-gray-600 rounded w-full p-2"
                          rows={2}
                          placeholder="Description"
                        />
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
                          <div className="text-sm font-bold text-gray-800">{edu.duration}</div>
                          <div className="text-lg font-bold text-black">{edu.degree}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-800 mb-2">{edu.school}</div>
                        {edu.description && (
                          <div className="text-sm text-black leading-relaxed">{edu.description}</div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('education', {
                      id: `edu-${Date.now()}`,
                      degree: 'Degree Name',
                      school: 'University Name',
                      duration: '2020 - 2024',
                      description: 'Additional details about education'
                    })}
                    className="text-sm text-blue-800 hover:text-blue-900 font-medium"
                  >
                    + Add Education
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}