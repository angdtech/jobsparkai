'use client'

import React, { useState } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Star, 
  Users, 
  TrendingUp, 
  Lock,
  CreditCard,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react'
import type { ATSAnalysis } from '@/lib/ats-analysis'

interface FreemiumAnalysisProps {
  analysis: ATSAnalysis
  onUpgrade: () => void
  fileName: string
}

export default function FreemiumAnalysis({ analysis, onUpgrade, fileName }: FreemiumAnalysisProps) {
  const [showingPreview, setShowingPreview] = useState(false)

  // Handle null/undefined analysis
  if (!analysis) {
    return <div className="p-8 text-center">Loading analysis...</div>
  }

  const totalIssues = analysis.issues?.length || 0
  const totalRecommendations = analysis.recommendations?.length || 0
  const previewIssues = analysis.issues?.slice(0, 2) || []
  const lockedIssues = totalIssues - previewIssues.length

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Great start! A few tweaks will make it perfect.'
    if (score >= 60) return 'Good foundation, but needs optimization for better results.'
    return 'Needs significant improvements to compete effectively.'
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header with Social Proof */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
        <div className="flex items-center justify-center space-x-6 mb-4 text-sm">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>10,000+ users</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>5X more interviews</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span>4.9/5 rating</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-2">CV Analysis Complete!</h2>
        <p className="text-blue-100">AI-powered analysis for {fileName}</p>
      </div>

      {/* Score Section */}
      <div className="p-8 border-b border-gray-100">
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysis.overall_score)}`}>
            {analysis.overall_score}%
          </div>
          <p className="text-xl text-gray-700 mb-4">Overall ATS Score</p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {getScoreMessage(analysis.overall_score)}
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.readability_score)}`}>
              {analysis.readability_score}%
            </div>
            <div className="text-sm text-gray-600">Readability</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.keyword_score)}`}>
              {analysis.keyword_score}%
            </div>
            <div className="text-sm text-gray-600">Keywords</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.format_score)}`}>
              {analysis.format_score}%
            </div>
            <div className="text-sm text-gray-600">Format</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.content_structure_score || 75)}`}>
              {analysis.content_structure_score || 75}%
            </div>
            <div className="text-sm text-gray-600">Structure</div>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            We Found {totalIssues} Critical Issues
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-600">These issues are</p>
            <p className="text-lg font-semibold text-red-600">costing you interviews</p>
          </div>
        </div>

        {/* Free Issues Preview */}
        <div className="space-y-4 mb-6">
          {previewIssues.map((issue, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Issue #{index + 1}</p>
                <p className="text-red-700">{issue.message}</p>
                {issue.severity && (
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                    issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                    issue.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {issue.severity} severity
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Locked Issues */}
        {lockedIssues > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {lockedIssues} More Critical Issues Found
                  </h4>
                  <p className="text-gray-600">
                    + {totalRecommendations} AI-powered improvement recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowingPreview(!showingPreview)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                {showingPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="text-sm">{showingPreview ? 'Hide' : 'Preview'}</span>
              </button>
            </div>

            {showingPreview && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid gap-2">
                  {analysis.issues?.slice(2, 6).map((issue, index) => (
                    <div key={index} className="flex items-center space-x-2 text-gray-600">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-sm blur-sm">{issue.message}</span>
                      <Lock className="h-3 w-3 text-gray-400" />
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-2">
                    Issues blurred - unlock to see details
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <CreditCard className="h-4 w-4" />
              <span>One-time payment</span>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Fix All Issues for Only $5
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Get AI-powered recommendations, step-by-step fixes, and professional templates
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>All {totalIssues} issues revealed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{totalRecommendations} AI recommendations</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Professional templates</span>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <CreditCard className="h-5 w-5" />
            <span>Unlock Full Analysis - $5</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-xs text-gray-500 mt-4">
            ✓ Secure payment ✓ Instant access ✓ 30-day money-back guarantee
          </p>
        </div>

        {/* Social Proof Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              "This saved me hours of work and got me 3 interviews in 2 weeks!" - Sarah, Marketing Manager
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}