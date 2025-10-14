import React, { useState } from 'react'
import { Wand2, Check, X, Edit3, Loader2, RefreshCw } from 'lucide-react'

interface SectionImproverProps {
  sectionType: 'tagline' | 'summary' | 'experience' | 'education' | 'skills' | 'achievements'
  currentContent: string
  onAcceptSuggestion: (newContent: string) => void
  onManualEdit: () => void
  context?: {
    jobTitle?: string
    industry?: string
    yearsExperience?: number
    targetRole?: string
  }
  className?: string
}

interface AIResponse {
  suggestion?: string
  suggestions?: string[]
  reasoning?: string
}

export const SectionImprover: React.FC<SectionImproverProps> = ({
  sectionType,
  currentContent,
  onAcceptSuggestion,
  onManualEdit,
  context,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<AIResponse | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('')

  const generateSuggestions = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/cv/improve-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionType,
          currentContent,
          context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate suggestions')
      }

      const data = await response.json()
      setSuggestions(data)
      setShowSuggestions(true)
      
      // Auto-select first suggestion for single-suggestion types
      if (data.suggestion) {
        setSelectedSuggestion(data.suggestion)
      } else if (data.suggestions && data.suggestions.length > 0) {
        setSelectedSuggestion(data.suggestions[0])
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      alert('Failed to generate suggestions. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAccept = () => {
    if (selectedSuggestion) {
      onAcceptSuggestion(selectedSuggestion)
      setShowSuggestions(false)
      setSuggestions(null)
      setSelectedSuggestion('')
    }
  }

  const handleReject = () => {
    setShowSuggestions(false)
    setSuggestions(null)
    setSelectedSuggestion('')
  }

  if (showSuggestions && suggestions) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI Suggestions</span>
          </div>
          <button
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Current vs Suggested */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Current</label>
            <div className="mt-1 p-2 bg-gray-100 rounded text-sm text-gray-800">
              {currentContent}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              AI Suggestion{suggestions.suggestions ? 's' : ''}
            </label>
            <div className="mt-1 space-y-2">
              {suggestions.suggestions ? (
                // Multiple suggestions (tagline, summary)
                suggestions.suggestions.map((suggestion, index) => (
                  <label key={index} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="suggestion"
                      value={suggestion}
                      checked={selectedSuggestion === suggestion}
                      onChange={(e) => setSelectedSuggestion(e.target.value)}
                      className="mt-1 h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1 p-2 bg-white border rounded text-sm hover:border-blue-300">
                      {suggestion}
                    </div>
                  </label>
                ))
              ) : (
                // Single suggestion (experience, education, etc.)
                <div className="p-2 bg-white border rounded text-sm">
                  {suggestions.suggestion}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reasoning */}
        {suggestions.reasoning && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Why this is better</label>
            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
              {suggestions.reasoning}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAccept}
            disabled={!selectedSuggestion}
            className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-3 w-3" />
            <span>Use This</span>
          </button>
          <button
            onClick={handleReject}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            <X className="h-3 w-3" />
            <span>Dismiss</span>
          </button>
          <button
            onClick={onManualEdit}
            className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            <Edit3 className="h-3 w-3" />
            <span>Edit Manually</span>
          </button>
        </div>
      </div>
    )
  }

  // Default state - show improve button
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={generateSuggestions}
        disabled={isGenerating || !currentContent.trim()}
        className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Wand2 className="h-3 w-3" />
        )}
        <span>{isGenerating ? 'Improving...' : 'Improve with AI'}</span>
      </button>
      <button
        onClick={onManualEdit}
        className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
      >
        <Edit3 className="h-3 w-3" />
        <span>Edit Manually</span>
      </button>
    </div>
  )
}