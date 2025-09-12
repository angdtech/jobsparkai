'use client'

import { useState } from 'react'

export type FeedbackType = 'issue' | 'recommendation' | 'strength'

interface FeedbackItem {
  type: FeedbackType
  title: string
  message: string
  severity?: 'low' | 'medium' | 'high'
}

interface FeedbackHighlightProps {
  feedback: FeedbackItem[]
  children: React.ReactNode
  className?: string
  onShowFeedback?: (feedback: FeedbackItem[]) => void
}

export function FeedbackHighlight({ feedback, children, className = '', onShowFeedback }: FeedbackHighlightProps) {
  if (!feedback || feedback.length === 0) {
    return <div className={className}>{children}</div>
  }

  // Get highlight color based on feedback types (prioritize issues)
  const getHighlightColor = () => {
    const hasIssue = feedback.some(f => f.type === 'issue')
    const hasRecommendation = feedback.some(f => f.type === 'recommendation')
    const hasStrength = feedback.some(f => f.type === 'strength')

    if (hasIssue) return 'border-l-4 border-red-400 bg-red-50 hover:bg-red-100'
    if (hasRecommendation) return 'border-l-4 border-blue-400 bg-blue-50 hover:bg-blue-100'
    if (hasStrength) return 'border-l-4 border-green-400 bg-green-50 hover:bg-green-100'
    return ''
  }

  const handleClick = () => {
    if (onShowFeedback) {
      onShowFeedback(feedback)
    }
  }

  return (
    <div
      className={`${className} ${getHighlightColor()} cursor-pointer transition-colors duration-200 pl-3`}
      onClick={handleClick}
      title="Click to view feedback"
    >
      {children}
    </div>
  )
}