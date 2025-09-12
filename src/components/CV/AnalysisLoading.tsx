'use client'

import { useState, useEffect } from 'react'

interface PersonalizationData {
  roleTypes: string[]
  market: string
  language: string
}

interface AnalysisLoadingProps {
  onPersonalizationUpdate?: (data: PersonalizationData) => void
}

export default function AnalysisLoading({ onPersonalizationUpdate }: AnalysisLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(0)
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData>({
    roleTypes: [],
    market: '',
    language: ''
  })

  const stages = [
    { text: "Analyzing CV structure...", icon: "📄" },
    { text: "Checking ATS compatibility...", icon: "🔍" },
    { text: "Evaluating content quality...", icon: "✨" },
    { text: "Generating recommendations...", icon: "💡" },
    { text: "Finalizing analysis...", icon: "🎯" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        // Show personalization questions around 60% progress
        if (prev === 60 && !showPersonalization) {
          setShowPersonalization(true)
        }
        return prev + 2
      })
    }, 100)

    const stageInterval = setInterval(() => {
      setStage(prev => (prev + 1) % stages.length)
    }, 2000)

    return () => {
      clearInterval(interval)
      clearInterval(stageInterval)
    }
  }, [showPersonalization])

  const handlePersonalizationChange = (field: keyof PersonalizationData, value: any) => {
    const updatedData = { ...personalizationData, [field]: value }
    setPersonalizationData(updatedData)
    if (onPersonalizationUpdate) {
      onPersonalizationUpdate(updatedData)
    }
  }

  const handleRoleToggle = (role: string) => {
    const updatedRoles = personalizationData.roleTypes.includes(role)
      ? personalizationData.roleTypes.filter(r => r !== role)
      : [...personalizationData.roleTypes, role]
    handlePersonalizationChange('roleTypes', updatedRoles)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center">
        {/* Animated Circle */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"
            style={{ 
              borderImage: `conic-gradient(from 0deg, #2563eb, #3b82f6, #60a5fa, #93c5fd, transparent) 1`,
              animation: 'spin 1.5s linear infinite'
            }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">{stages[stage].icon}</span>
          </div>
        </div>

        {/* Progress Text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Analysis in Progress
        </h2>
        
        <p className="text-gray-600 mb-6 animate-pulse">
          {stages[stage].text}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${Math.min(progress, 95)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {Math.min(progress, 95)}% complete • This usually takes 10-15 seconds
        </p>

        {/* Personalization Questions - Show during analysis */}
        {showPersonalization && (
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 text-left max-w-md mx-auto">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">✨ Help us personalize your recommendations</h3>
              <p className="text-sm text-purple-600">Answer these optional questions while we analyze your CV</p>
            </div>
            
            {/* Role Types */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of roles are you targeting? (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Management', 'Technical', 'Sales', 'Marketing', 'Design', 'Finance', 'Operations', 'Consulting'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      personalizationData.roleTypes.includes(role)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-purple-600 border-purple-300 hover:border-purple-500'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Market/Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which market are you applying in?
              </label>
              <select
                value={personalizationData.market}
                onChange={(e) => handlePersonalizationChange('market', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select market</option>
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="EU">European Union</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="text-xs text-purple-600 text-center">
              These answers will help us provide more targeted recommendations
            </div>
          </div>
        )}

        {/* Floating Dots Animation */}
        <div className="flex justify-center space-x-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1s' }}
            ></div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">🔒 Secure:</span> Your CV data is processed securely and never stored permanently
          </p>
        </div>
      </div>
    </div>
  )
}