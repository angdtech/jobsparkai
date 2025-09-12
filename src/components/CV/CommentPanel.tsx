'use client'

import { useState } from 'react'
import { FeedbackType } from './CommentHighlight'

interface CommentItem {
  type: FeedbackType
  category: string
  title: string
  message: string
  suggestion?: string
  severity?: 'low' | 'medium' | 'high'
}

interface CommentPanelProps {
  comments: CommentItem[] | null
  originalText: string
  position: { x: number; y: number } | null
  onClose: () => void
  onApplySuggestion?: (originalText: string, newText: string) => void
  onGenerateMore?: (text: string) => void
  onEditManually?: (text: string) => void
}

export function CommentPanel({ 
  comments, 
  originalText, 
  position, 
  onClose, 
  onApplySuggestion,
  onGenerateMore,
  onEditManually 
}: CommentPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  if (!comments || !position) return null

  const getCategoryColor = (category: string, type: FeedbackType) => {
    if (type === 'issue') {
      if (category.toLowerCase().includes('spelling') || category.toLowerCase().includes('grammar')) {
        return 'bg-red-100 text-red-700 border-red-200'
      }
      return 'bg-orange-100 text-orange-700 border-orange-200'
    }
    if (type === 'recommendation') return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const handleApplySuggestion = (suggestion: string) => {
    if (onApplySuggestion) {
      onApplySuggestion(originalText, suggestion)
      onClose()
    }
  }

  const handleGenerateMore = async () => {
    setIsGenerating(true)
    if (onGenerateMore) {
      onGenerateMore(originalText)
    }
    // Simulate API call
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Comment Panel */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto"
        style={{
          left: `${Math.min(position.x, window.innerWidth - 320)}px`,
          top: `${Math.min(position.y, window.innerHeight - 400)}px`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Suggestions</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        </div>


        {/* Comments */}
        <div className="p-4 space-y-4">
          {comments.map((comment, index) => (
            <div key={index} className="space-y-3">
              {/* Category Badge */}
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(comment.category, comment.type)}`}>
                {comment.category}
                {comment.severity && (
                  <span className="ml-1 uppercase">
                    {comment.severity}
                  </span>
                )}
              </div>
              
              {/* Title & Message */}
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{comment.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{comment.message}</p>
              </div>

              {/* Suggestion */}
              {comment.suggestion && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Suggested replacement:</p>
                  <p className="text-sm font-medium text-gray-900 mb-3 bg-white p-2 rounded border">
                    "{comment.suggestion}"
                  </p>
                  <button
                    onClick={() => handleApplySuggestion(comment.suggestion!)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded font-medium"
                  >
                    Apply Suggestion
                  </button>
                </div>
              )}

              {index < comments.length - 1 && <hr className="border-gray-100" />}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={() => onEditManually?.(originalText)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded font-medium"
          >
            Edit Manually
          </button>
          <button
            onClick={handleGenerateMore}
            disabled={isGenerating}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded font-medium disabled:bg-gray-400"
          >
            {isGenerating ? 'Generating...' : 'Generate More Suggestions'}
          </button>
        </div>
      </div>
    </>
  )
}