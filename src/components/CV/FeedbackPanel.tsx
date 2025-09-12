'use client'

import { FeedbackType } from './FeedbackHighlight'

interface FeedbackItem {
  type: FeedbackType
  title: string
  message: string
  severity?: 'low' | 'medium' | 'high'
}

interface FeedbackPanelProps {
  feedback: FeedbackItem[] | null
  onClose: () => void
}

export function FeedbackPanel({ feedback, onClose }: FeedbackPanelProps) {
  if (!feedback || feedback.length === 0) return null

  const getTypeColor = (type: FeedbackType) => {
    switch (type) {
      case 'issue': return 'text-red-700 bg-red-100 border-red-200'
      case 'recommendation': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'strength': return 'text-green-700 bg-green-100 border-green-200'
    }
  }

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'issue': return '⚠'
      case 'recommendation': return '💡'
      case 'strength': return '✓'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-orange-500 text-white'
      case 'low': return 'bg-yellow-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="fixed right-4 top-24 bottom-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Section Feedback</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {/* Feedback List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {feedback.map((item, index) => (
          <div key={index} className={`border rounded-lg p-4 ${getTypeColor(item.type)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                <span className="text-sm font-medium capitalize">
                  {item.type === 'recommendation' ? 'Suggestion' : item.type}
                </span>
              </div>
              {item.severity && item.type === 'issue' && (
                <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(item.severity)}`}>
                  {item.severity.toUpperCase()}
                </span>
              )}
            </div>
            
            <h4 className="font-semibold mb-2">{item.title}</h4>
            <p className="text-sm leading-relaxed">{item.message}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-600 text-center">
          Click another highlighted section to view different feedback
        </p>
      </div>
    </div>
  )
}