'use client'

import { useState, useEffect } from 'react'
import { X, MousePointer, MessageSquare, Sparkles, ArrowRight } from 'lucide-react'

interface FirstTimeGuideProps {
  isVisible: boolean
  onDismiss: () => void
  totalIssues: number
}

export default function FirstTimeGuide({ isVisible, onDismiss, totalIssues }: FirstTimeGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPulsing, setIsPulsing] = useState(true)

  useEffect(() => {
    // Stop pulsing after a few seconds
    const timer = setTimeout(() => setIsPulsing(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const steps = [
    {
      title: "🎯 Issues Found!",
      description: `We found ${totalIssues} issues that could be costing you interviews. Let's fix them together!`,
      instruction: "Look for red and yellow highlighted text on your CV",
      visual: "Red = Critical • Yellow = Improvement"
    },
    {
      title: "👆 Click to Fix",
      description: "Click any highlighted text to see what's wrong and get AI-powered suggestions",
      instruction: "Try clicking on a red or yellow highlight now",
      visual: "Each click shows specific recommendations"
    },
    {
      title: "🚀 Apply or Edit",
      description: "Choose to apply our AI suggestion instantly, or edit manually for full control",
      instruction: "You can always generate more AI options if needed",
      visual: "Your CV improves with each fix"
    }
  ]

  if (!isVisible) return null

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onDismiss} />
      
      {/* Guide Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">{currentStepData.title}</h2>
                <p className="text-blue-100 text-sm">{currentStepData.description}</p>
              </div>
              <button
                onClick={onDismiss}
                className="text-blue-100 hover:text-white text-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step Indicator */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-blue-600'
                        : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Visual Demo Based on Step */}
            <div className="text-center mb-6">
              {currentStep === 0 && (
                <div className="space-y-3">
                  <div className="flex justify-center space-x-4">
                    <div className={`px-3 py-1 rounded text-sm ${isPulsing ? 'animate-pulse' : ''}`}>
                      <span className="bg-red-200 text-red-800 px-2 py-1 rounded">responsible for</span>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm ${isPulsing ? 'animate-pulse' : ''}`}>
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">team player</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{currentStepData.visual}</div>
                </div>
              )}
              
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded cursor-pointer border-2 border-red-400">
                      responsible for
                    </span>
                    <div className={`absolute -top-8 -right-4 ${isPulsing ? 'animate-bounce' : ''}`}>
                      <MousePointer className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>Click → See AI suggestions</span>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800 font-medium mb-1">AI Suggestion:</div>
                    <div className="text-sm text-green-700">"Managed team of 15 developers"</div>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Multiple options available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Instruction */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium text-center">
                {currentStepData.instruction}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Previous
              </button>

              {isLastStep ? (
                <button
                  onClick={onDismiss}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <span>Start Fixing Issues</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Skip Option */}
            <div className="text-center mt-4">
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Skip tutorial, I'll figure it out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}