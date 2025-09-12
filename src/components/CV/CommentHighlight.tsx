'use client'

import { useState } from 'react'

export type FeedbackType = 'issue' | 'recommendation' | 'strength'

interface CommentItem {
  type: FeedbackType
  category: string // "Grammar", "Tone", "Action Verbs", etc.
  title: string
  message: string
  suggestion?: string // AI's suggested replacement text
  severity?: 'low' | 'medium' | 'high'
}

interface CommentHighlightProps {
  text: string
  comments: CommentItem[]
  onShowComments?: (comments: CommentItem[], text: string, position: {x: number, y: number}) => void
  onApplySuggestion?: (originalText: string, newText: string) => void
  className?: string
}

export function CommentHighlight({ text, comments, onShowComments, onApplySuggestion, className = '' }: CommentHighlightProps) {
  if (!comments || comments.length === 0) {
    return <span className={className}>{text}</span>
  }

  // Get highlight color based on severity/type (prioritize issues)
  const getHighlightColor = () => {
    const hasHighIssue = comments.some(c => c.type === 'issue' && c.severity === 'high')
    const hasMediumIssue = comments.some(c => c.type === 'issue' && c.severity === 'medium')
    const hasIssue = comments.some(c => c.type === 'issue')
    const hasRecommendation = comments.some(c => c.type === 'recommendation')

    if (hasHighIssue) return 'bg-red-200 border-b-2 border-red-400 hover:bg-red-300'
    if (hasMediumIssue) return 'bg-orange-200 border-b-2 border-orange-400 hover:bg-orange-300'
    if (hasIssue) return 'bg-yellow-200 border-b-2 border-yellow-400 hover:bg-yellow-300'
    if (hasRecommendation) return 'bg-blue-200 border-b-2 border-blue-400 hover:bg-blue-300'
    return 'bg-green-200 border-b-2 border-green-400 hover:bg-green-300'
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onShowComments) {
      const rect = e.currentTarget.getBoundingClientRect()
      const position = {
        x: rect.right + 10, // Position to the right of the highlight
        y: rect.top
      }
      onShowComments(comments, text, position)
    }
  }

  return (
    <span
      className={`${className} ${getHighlightColor()} cursor-pointer transition-colors duration-200 rounded-sm px-1`}
      onClick={handleClick}
      title="Click to view suggestions"
    >
      {text}
    </span>
  )
}