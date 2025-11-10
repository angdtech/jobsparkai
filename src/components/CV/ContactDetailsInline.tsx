import { useState } from 'react'

interface ContactDetail {
  type: 'location' | 'phone' | 'email' | 'linkedin' | 'website'
  value: string
}

interface ContactDetailsInlineProps {
  personalInfo: {
    address?: string
    phone?: string
    email?: string
    linkedin?: string
    website?: string
  }
  onUpdate: (field: string, value: string) => void
}

export function ContactDetailsInline({ personalInfo, onUpdate }: ContactDetailsInlineProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const contactDetails: ContactDetail[] = [
    { type: 'location', value: personalInfo.address || '' },
    { type: 'phone', value: personalInfo.phone || '' },
    { type: 'email', value: personalInfo.email || '' },
    { type: 'linkedin', value: personalInfo.linkedin || '' },
    { type: 'website', value: personalInfo.website || '' }
  ].filter(detail => detail.value)

  const fieldMap = {
    location: 'address',
    phone: 'phone',
    email: 'email',
    linkedin: 'linkedin',
    website: 'website'
  }

  const handleEdit = (detail: ContactDetail) => {
    setEditingField(detail.type)
    setEditValue(detail.value)
  }

  const handleSave = () => {
    if (editingField) {
      onUpdate(fieldMap[editingField], editValue)
      setEditingField(null)
      setEditValue('')
    }
  }

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <div className="flex flex-wrap items-center justify-center gap-3 text-gray-700">
        {contactDetails.map((detail, index) => (
          <div key={detail.type} className="flex items-center gap-3">
            {editingField === detail.type ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') setEditingField(null)
                }}
                className="px-2 py-1 border border-blue-300 rounded text-sm"
                autoFocus
              />
            ) : (
              <span 
                onClick={() => handleEdit(detail)}
                className="text-gray-900 cursor-pointer hover:bg-blue-50 rounded px-1"
              >
                {detail.value}
              </span>
            )}
            {index < contactDetails.length - 1 && (
              <span className="text-gray-400 text-xl font-bold">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
