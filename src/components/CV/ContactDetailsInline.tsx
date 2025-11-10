import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

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
  const [isAdding, setIsAdding] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newDetailType, setNewDetailType] = useState<'location' | 'phone' | 'email' | 'linkedin' | 'website'>('phone')
  const [newDetailValue, setNewDetailValue] = useState('')

  const contactDetails: ContactDetail[] = [
    { type: 'location', value: personalInfo.address || '' },
    { type: 'phone', value: personalInfo.phone || '' },
    { type: 'email', value: personalInfo.email || '' },
    { type: 'linkedin', value: personalInfo.linkedin || '' },
    { type: 'website', value: personalInfo.website || '' }
  ].filter(detail => detail.value)

  const fieldLabels = {
    location: 'Location',
    phone: 'Phone',
    email: 'Email',
    linkedin: 'LinkedIn',
    website: 'Website'
  }

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

  const handleSaveEdit = () => {
    if (editingField) {
      onUpdate(fieldMap[editingField], editValue)
      setEditingField(null)
      setEditValue('')
    }
  }

  const handleDelete = (detail: ContactDetail) => {
    onUpdate(fieldMap[detail.type], '')
  }

  const handleAdd = () => {
    if (newDetailValue.trim()) {
      onUpdate(fieldMap[newDetailType], newDetailValue.trim())
      setNewDetailValue('')
      setIsAdding(false)
    }
  }

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-500">CONTACT DETAILS</div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Contact Detail
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-gray-700">
        {contactDetails.map((detail, index) => (
          <div key={detail.type} className="flex items-center gap-3">
            {editingField === detail.type ? (
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
                  onClick={() => setEditingField(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-gray-900">{detail.value}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(detail)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(detail)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
            {index < contactDetails.length - 1 && (
              <span className="text-gray-400 text-xl font-bold">·</span>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 mt-2">
            <select
              value={newDetailType}
              onChange={(e) => setNewDetailType(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="location">Location</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
              <option value="website">Website</option>
            </select>
            <input
              type="text"
              value={newDetailValue}
              onChange={(e) => setNewDetailValue(e.target.value)}
              placeholder="Enter value..."
              className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
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
                setNewDetailValue('')
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
