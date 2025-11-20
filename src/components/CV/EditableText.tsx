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
    if (onTextChange && editValue !== text) {
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

  const handleBlur = () => {
    // Auto-save on blur (modern inline editing)
    handleSave()
  }

  const handleClick = () => {
    if (onTextChange) {
      setIsEditing(true)
      if (onEditModeChange) {
        onEditModeChange(true)
      }
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
            onBlur={handleBlur}
            className={`${className} border-2 border-blue-400 rounded px-2 py-1 w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50`}
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
            onBlur={handleBlur}
            className={`${className} border-2 border-blue-400 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50`}
            placeholder={placeholder}
          />
        )}
      </div>
    )
  }

  return (
    <div 
      onClick={handleClick}
      className={`${onTextChange ? 'cursor-text hover:bg-blue-50 rounded px-1 transition-colors' : ''} ${className}`}
      title={onTextChange ? 'Click to edit' : ''}
    >
      {text ? (
        <SmartText 
          text={text}
          comments={comments}
          onShowComments={onShowComments}
        />
      ) : (
        <span className="opacity-50">{placeholder}</span>
      )}
    </div>
  )
}