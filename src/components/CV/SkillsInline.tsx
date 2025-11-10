import { useState } from 'react'

interface Skill {
  id: string
  name: string
  level: number
}

interface SkillsInlineProps {
  skills: Skill[]
  onUpdate: (skills: Skill[]) => void
}

export function SkillsInline({ skills, onUpdate }: SkillsInlineProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleEdit = (skill: Skill) => {
    setEditingId(skill.id)
    setEditValue(skill.name)
  }

  const handleSave = () => {
    if (editingId && editValue.trim()) {
      const updatedSkills = skills.map(skill =>
        skill.id === editingId ? { ...skill, name: editValue.trim() } : skill
      )
      onUpdate(updatedSkills)
      setEditingId(null)
      setEditValue('')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>

      <div className="flex flex-wrap items-center gap-3 text-gray-700">
        {skills.map((skill, index) => (
          <div key={skill.id} className="flex items-center gap-3">
            {editingId === skill.id ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="px-2 py-1 border border-blue-300 rounded text-sm"
                autoFocus
              />
            ) : (
              <span 
                onClick={() => handleEdit(skill)}
                className="text-gray-900 cursor-pointer hover:bg-blue-50 rounded px-1"
              >
                {skill.name}
              </span>
            )}
            {index < skills.length - 1 && (
              <span className="text-gray-400 text-xl font-bold">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
