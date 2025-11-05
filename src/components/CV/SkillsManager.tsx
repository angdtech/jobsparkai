'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface Skill {
  id: string
  name: string
  level: number
}

interface SkillsManagerProps {
  skills: Skill[]
  onUpdate: (skills: Skill[]) => void
}

export function SkillsManager({ skills, onUpdate }: SkillsManagerProps) {
  const [newSkill, setNewSkill] = useState('')
  const [newLevel, setNewLevel] = useState(80)

  const addSkill = () => {
    if (!newSkill.trim()) return

    const skill: Skill = {
      id: `skill-${Date.now()}`,
      name: newSkill.trim(),
      level: newLevel
    }

    onUpdate([...skills, skill])
    setNewSkill('')
    setNewLevel(80)
  }

  const removeSkill = (id: string) => {
    onUpdate(skills.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Skills</h3>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          placeholder="Skill name (e.g. React, Project Management)"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <input
          type="number"
          value={newLevel}
          onChange={(e) => setNewLevel(Number(e.target.value))}
          min="0"
          max="100"
          className="w-20 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={addSkill}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        {skills.map((skill) => (
          <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <span className="font-medium">{skill.name}</span>
              <span className="ml-2 text-sm text-gray-600">({skill.level}%)</span>
            </div>
            <button
              onClick={() => removeSkill(skill.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
