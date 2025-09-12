'use client'

import { useState, useEffect, useRef } from 'react'
import { SmartText } from './SmartText'
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

interface EditableTextProps {
  text: string
  comments: CommentItem[]
  onShowComments?: (comments: CommentItem[], text: string, position: { x: number; y: number }) => void
  onTextChange?: (newText: string) => void
  className?: string
  isEditMode?: boolean
  onEditModeChange?: (isEditing: boolean) => void
  multiline?: boolean
  placeholder?: string
}

export function EditableText({ 
  text, 
  comments, 
  onShowComments, 
  onTextChange,
  className = '',
  isEditMode = false,
  onEditModeChange,
  multiline = false,
  placeholder = ''
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(isEditMode)
  const [editValue, setEditValue] = useState(text)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsEditing(isEditMode)
    if (isEditMode) {
      setEditValue(text)
    }
  }, [isEditMode, text])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (onTextChange) {
      onTextChange(editValue)
    }
    setIsEditing(false)
    if (onEditModeChange) {
      onEditModeChange(false)
    }
  }

  const handleCancel = () => {
    setEditValue(text)
    setIsEditing(false)
    if (onEditModeChange) {
      onEditModeChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="inline-block w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} border border-blue-300 rounded px-2 py-1 w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder={placeholder}
          />
        )}
        <div className="flex space-x-2 mt-2">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <SmartText 
      text={text}
      comments={comments}
      onShowComments={onShowComments}
      className={className}
    />
  )
}