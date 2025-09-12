'use client'

import { X, FileText, AlertTriangle, ArrowRight } from 'lucide-react'

interface CVCoachingSummaryProps {
  isOpen: boolean
  onClose: () => void
  analysis: any
  cvData?: any
  onContinue: () => void
}

export default function CVCoachingSummary({ 
  isOpen, 
  onClose, 
  analysis, 
  cvData,
  onContinue 
}: CVCoachingSummaryProps) {
  
  if (!isOpen) return null

  // Generate coach-style first impression
  const generateCoachSummary = () => {
    const score = analysis.overall_score
    const issues = analysis.issues?.length || 0
    
    if (score >= 80) {
      return "Your CV shows strong professional experience and is well-structured. Just a few tweaks and you'll be ready to impress recruiters."
    } else if (score >= 60) {
      return "Strong technical background comes through, but the layout hides key achievements and the CV feels generic."
    } else if (score >= 40) {
      return "Good experience is evident, but the formatting and presentation need work to make a stronger first impression with hiring managers."
    } else {
      return "Your experience has potential, but the CV needs significant improvements to stand out and pass initial screening filters."
    }
  }

  const issueCount = analysis.issues?.length || 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">CV Analysis Complete</h2>
              <p className="text-gray-600">Here's how your CV comes across at first glance</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* First Impression Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">First Impression</h3>
                <p className="text-blue-800 leading-relaxed">
                  {generateCoachSummary()}
                </p>
              </div>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">{issueCount}</div>
              <div className="text-sm text-gray-600">Issues Found</div>
              <div className="text-xs text-red-600 font-medium">Need Attention</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">✓</div>
              <div className="text-sm text-gray-600">Ready to Fix</div>
              <div className="text-xs text-green-600 font-medium">Step by Step</div>
            </div>
          </div>

          {/* ATS Information */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 rounded-full p-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 mb-1">About CV Usage</h4>
                <p className="text-xs text-yellow-800 mb-2">
                  <strong>This CV version:</strong> Perfect for agencies, email applications, and networking. 
                  Optimized for human readers.
                </p>
                <p className="text-xs text-yellow-800">
                  <strong>ATS version (coming soon):</strong> For large corporations with online applications. 
                  We'll help you identify which companies use ATS systems.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              I'll review this later
            </button>
            
            <button
              onClick={onContinue}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              <span>Continue to Improvements</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}