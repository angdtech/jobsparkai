'use client'

import { useState } from 'react'

export type FeedbackType = 'issue' | 'recommendation' | 'strength'

interface FeedbackItem {
  type: FeedbackType
  title: string
  message: string
  severity?: 'low' | 'medium' | 'high'
}

interface FeedbackTooltipProps {
  feedback: FeedbackItem[]
  children: React.ReactNode
  className?: string
}

export function FeedbackTooltip({ feedback, children, className = '' }: FeedbackTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  if (!feedback || feedback.length === 0) {
    return <div className={className}>{children}</div>
  }

  // Get border color based on feedback types
  const getBorderColor = () => {
    const hasIssue = feedback.some(f => f.type === 'issue')
    const hasRecommendation = feedback.some(f => f.type === 'recommendation')
    const hasStrength = feedback.some(f => f.type === 'strength')

    if (hasIssue) return 'border-red-300 bg-red-50'
    if (hasRecommendation) return 'border-blue-300 bg-blue-50'
    if (hasStrength) return 'border-green-300 bg-green-50'
    return 'border-gray-300'
  }

  const getTypeColor = (type: FeedbackType) => {
    switch (type) {
      case 'issue': return 'text-red-700 bg-red-100'
      case 'recommendation': return 'text-blue-700 bg-blue-100'
      case 'strength': return 'text-green-700 bg-green-100'
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    })
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false)
    }
  }

  const handleClick = () => {
    setIsPinned(!isPinned)
  }

  const shouldShowTooltip = isHovered || isPinned

  return (
    <>
      <div
        className={`${className} relative transition-all duration-200 ${getBorderColor()} ${
          shouldShowTooltip ? 'border-2 shadow-sm' : 'border border-transparent'
        } cursor-pointer`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        
        {/* Feedback indicator dot */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
          feedback.some(f => f.type === 'issue') ? 'bg-red-500' :
          feedback.some(f => f.type === 'recommendation') ? 'bg-blue-500' :
          'bg-green-500'
        }`} />
      </div>

      {/* Tooltip */}
      {shouldShowTooltip && (
        <>
          {/* Backdrop for pinned tooltips */}
          {isPinned && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsPinned(false)}
            />
          )}
          
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm"
            style={{
              left: `${position.x}px`,
              top: `${position.y - 10}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200" />
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white absolute -top-1" />
            </div>

            <div className="p-4 space-y-3">
              {feedback.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(item.type)}`}>
                      {item.type === 'issue' ? 'Issue' : 
                       item.type === 'recommendation' ? 'Suggestion' : 'Strength'}
                    </span>
                    {item.severity && item.type === 'issue' && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.severity === 'high' ? 'bg-red-100 text-red-700' :
                        item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.severity}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>
                  {index < feedback.length - 1 && <hr className="border-gray-100" />}
                </div>
              ))}
              
              {isPinned && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Click outside to close, or click section to edit</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}