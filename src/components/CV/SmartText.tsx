'use client'

import { CommentHighlight } from './CommentHighlight'
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

interface SmartTextProps {
  text: string
  comments: CommentItem[]
  onShowComments?: (comments: CommentItem[], text: string, position: { x: number; y: number }) => void
  className?: string
}

export function SmartText({ text, comments, onShowComments, className = '' }: SmartTextProps) {
  // Find all highlights in the text
  const highlights: Array<{
    start: number
    end: number
    comments: CommentItem[]
  }> = []

  comments.forEach(comment => {
    const index = text.toLowerCase().indexOf(comment.targetText.toLowerCase())
    if (index !== -1) {
      highlights.push({
        start: index,
        end: index + comment.targetText.length,
        comments: [comment]
      })
    }
  })

  // If no highlights, return plain text
  if (highlights.length === 0) {
    return <span className={className}>{text}</span>
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
      last.comments = [...last.comments, ...highlight.comments]
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
    const highlightedText = text.slice(highlight.start, highlight.end)
    parts.push(
      <CommentHighlight
        key={`highlight-${index}`}
        text={highlightedText}
        comments={highlight.comments}
        onShowComments={onShowComments}
      />
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