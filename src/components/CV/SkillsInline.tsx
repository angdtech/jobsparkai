import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

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
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newSkillName, setNewSkillName] = useState('')

  const handleEdit = (skill: Skill) => {
    setEditingId(skill.id)
    setEditValue(skill.name)
  }

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      const updatedSkills = skills.map(skill =>
        skill.id === editingId ? { ...skill, name: editValue.trim() } : skill
      )
      onUpdate(updatedSkills)
      setEditingId(null)
      setEditValue('')
    }
  }

  const handleDelete = (skillId: string) => {
    const updatedSkills = skills.filter(skill => skill.id !== skillId)
    onUpdate(updatedSkills)
  }

  const handleAdd = () => {
    if (newSkillName.trim()) {
      const newSkill: Skill = {
        id: `skill_${Date.now()}`,
        name: newSkillName.trim(),
        level: 3
      }
      onUpdate([...skills, newSkill])
      setNewSkillName('')
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-gray-700">
        {skills.map((skill, index) => (
          <div key={skill.id} className="flex items-center gap-3">
            {editingId === skill.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-gray-900">{skill.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(skill)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
            {index < skills.length - 1 && (
              <span className="text-gray-400 text-xl font-bold">·</span>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Enter skill name..."
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewSkillName('')
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
