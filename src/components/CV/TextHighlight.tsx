'use client'

import { FeedbackType } from './FeedbackHighlight'

interface FeedbackItem {
  type: FeedbackType
  title: string
  message: string
  severity?: 'low' | 'medium' | 'high'
  targetText?: string // Specific text to highlight
  startIndex?: number // Character position start
  endIndex?: number // Character position end
}

interface TextHighlightProps {
  text: string
  feedback: FeedbackItem[]
  onShowFeedback?: (feedback: FeedbackItem[]) => void
  className?: string
}

export function TextHighlight({ text, feedback, onShowFeedback, className = '' }: TextHighlightProps) {
  if (!feedback || feedback.length === 0) {
    return <span className={className}>{text}</span>
  }

  // Find highlights in the text
  const highlights: Array<{
    start: number
    end: number
    feedback: FeedbackItem[]
    type: FeedbackType
  }> = []

  feedback.forEach(item => {
    if (item.targetText) {
      // Find all occurrences of the target text
      let index = text.toLowerCase().indexOf(item.targetText.toLowerCase())
      while (index !== -1) {
        highlights.push({
          start: index,
          end: index + item.targetText.length,
          feedback: [item],
          type: item.type
        })
        index = text.toLowerCase().indexOf(item.targetText.toLowerCase(), index + 1)
      }
    } else if (item.startIndex !== undefined && item.endIndex !== undefined) {
      // Use specific character positions
      highlights.push({
        start: item.startIndex,
        end: item.endIndex,
        feedback: [item],
        type: item.type
      })
    }
  })

  // If no specific highlights found, highlight the whole text
  if (highlights.length === 0) {
    const getHighlightClass = (type: FeedbackType) => {
      switch (type) {
        case 'issue': return 'bg-red-100 border-b-2 border-red-300'
        case 'recommendation': return 'bg-blue-100 border-b-2 border-blue-300'
        case 'strength': return 'bg-green-100 border-b-2 border-green-300'
      }
    }

    const primaryType = feedback.find(f => f.type === 'issue')?.type ||
                       feedback.find(f => f.type === 'recommendation')?.type ||
                       feedback[0].type

    return (
      <span
        className={`${className} ${getHighlightClass(primaryType)} cursor-pointer`}
        onClick={() => onShowFeedback?.(feedback)}
        title="Click to view feedback"
      >
        {text}
      </span>
    )
  }

  // Sort highlights by start position
  highlights.sort((a, b) => a.start - b.start)

  // Merge overlapping highlights
  const mergedHighlights: typeof highlights = []
  highlights.forEach(highlight => {
    const last = mergedHighlights[mergedHighlights.length - 1]
    if (last && highlight.start <= last.end) {
      // Overlapping - merge
      last.end = Math.max(last.end, highlight.end)
      last.feedback = [...last.feedback, ...highlight.feedback]
    } else {
      mergedHighlights.push(highlight)
    }
  })

  // Render text with highlights
  const parts: React.ReactNode[] = []
  let currentIndex = 0

  mergedHighlights.forEach((highlight, index) => {
    // Add text before highlight
    if (currentIndex < highlight.start) {
      parts.push(
        <span key={`text-${index}`}>
          {text.slice(currentIndex, highlight.start)}
        </span>
      )
    }

    // Add highlighted text
    const getHighlightClass = (type: FeedbackType) => {
      switch (type) {
        case 'issue': return 'bg-red-100 border-b-2 border-red-300 hover:bg-red-200'
        case 'recommendation': return 'bg-blue-100 border-b-2 border-blue-300 hover:bg-blue-200'
        case 'strength': return 'bg-green-100 border-b-2 border-green-300 hover:bg-green-200'
      }
    }

    const primaryType = highlight.feedback.find(f => f.type === 'issue')?.type ||
                       highlight.feedback.find(f => f.type === 'recommendation')?.type ||
                       highlight.feedback[0].type

    parts.push(
      <span
        key={`highlight-${index}`}
        className={`${getHighlightClass(primaryType)} cursor-pointer transition-colors duration-200`}
        onClick={() => onShowFeedback?.(highlight.feedback)}
        title="Click to view feedback"
      >
        {text.slice(highlight.start, highlight.end)}
      </span>
    )

    currentIndex = highlight.end
  })

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.slice(currentIndex)}
      </span>
    )
  }

  return <span className={className}>{parts}</span>
}