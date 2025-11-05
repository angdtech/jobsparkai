'use client'

import { useState, useEffect } from 'react'
import { performanceMonitor, PerformanceMetrics } from '@/lib/performance-monitor'

interface ParallelAnalysisLoadingProps {
  isVisible: boolean
  operationType: 'cv-analysis' | 'experience-review'
  onComplete?: (metrics: PerformanceMetrics) => void
}

export default function ParallelAnalysisLoading({ 
  isVisible, 
  operationType, 
  onComplete 
}: ParallelAnalysisLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  const steps = operationType === 'cv-analysis' 
    ? [
        { name: 'Content Analysis', description: 'Analyzing CV content relevance and achievements', duration: 2000 },
        { name: 'Format Check', description: 'Checking formatting and ATS compatibility', duration: 2000 },
        { name: 'Language Review', description: 'Reviewing language style and grammar', duration: 2000 },
        { name: 'Action Plan', description: 'Generating improvement recommendations', duration: 1500 }
      ]
    : [
        { name: 'Duplicate Detection', description: 'Scanning for duplicate content using AI embeddings', duration: 3000 },
        { name: 'Length Analysis', description: 'Analyzing CV length and structure', duration: 1000 },
        { name: 'Experience Review', description: 'Detailed review of experience sections', duration: 3000 }
      ]

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    // Start performance monitoring
    const operationId = `${operationType}-${Date.now()}`
    const totalApiCalls = steps.length
    performanceMonitor.startOperation(operationId, totalApiCalls, totalApiCalls)

    let totalDuration = 0
    let currentDuration = 0

    // Calculate total estimated duration
    steps.forEach(step => {
      totalDuration += step.duration
    })

    // Simulate progress through each step
    const progressInterval = setInterval(() => {
      currentDuration += 100

      // Calculate current step based on elapsed time
      let stepStartTime = 0
      let newCurrentStep = 0
      
      for (let i = 0; i < steps.length; i++) {
        if (currentDuration >= stepStartTime && currentDuration < stepStartTime + steps[i].duration) {
          newCurrentStep = i
          break
        }
        stepStartTime += steps[i].duration
        if (i === steps.length - 1) {
          newCurrentStep = steps.length - 1
        }
      }

      setCurrentStep(newCurrentStep)
      
      // Calculate overall progress
      const overallProgress = Math.min((currentDuration / totalDuration) * 100, 95)
      setProgress(overallProgress)

      // Complete when we've gone through all steps
      if (currentDuration >= totalDuration) {
        clearInterval(progressInterval)
        setProgress(100)
        
        // End performance monitoring
        const finalMetrics = performanceMonitor.endOperation(operationId)
        if (finalMetrics) {
          setMetrics(finalMetrics)
          onComplete?.(finalMetrics)
        }
      }
    }, 100)

    return () => {
      clearInterval(progressInterval)
    }
  }, [isVisible, operationType, onComplete])

  if (!isVisible) return null

  return (
    <div className="bg-white rounded-lg shadow-md border border-blue-200 p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <div className="animate-spin">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          🚀 Parallel AI Processing
        </h3>
        <p className="text-gray-600">
          Running multiple AI analysis tasks simultaneously for faster results
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current Step */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
              index === currentStep 
                ? 'bg-blue-50 border border-blue-200' 
                : index < currentStep 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              index === currentStep 
                ? 'bg-blue-600 text-white' 
                : index < currentStep 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
            }`}>
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : index === currentStep ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${
                index === currentStep ? 'text-blue-900' : index < currentStep ? 'text-green-900' : 'text-gray-600'
              }`}>
                {step.name}
              </div>
              <div className={`text-sm ${
                index === currentStep ? 'text-blue-700' : index < currentStep ? 'text-green-700' : 'text-gray-500'
              }`}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Info */}
      {metrics && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Processing Time:</span>
              <span className="font-medium">{metrics.duration}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Parallel AI Calls:</span>
              <span className="font-medium">{metrics.parallelCalls}</span>
            </div>
            <div className="flex justify-between">
              <span>Efficiency:</span>
              <span className="font-medium text-green-600">
                {metrics.parallelCalls > 1 ? `${((metrics.apiCalls / metrics.parallelCalls) * 100).toFixed(0)}% faster` : 'Sequential'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="inline-flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Powered by parallel AI processing for maximum speed
        </div>
      </div>
    </div>
  )
}