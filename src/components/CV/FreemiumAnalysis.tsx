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
  
  // Prioritize high-impact issues for the single preview
  const prioritizedIssues = analysis.issues?.sort((a, b) => {
    // Priority order: Grammar/Language > ATS > Content > Formatting
    const priorityOrder = {
      'Language': 1,
      'Grammar': 1,
      'Red Flag': 2,
      'ATS': 3,
      'Content': 4,
      'Formatting': 5
    }
    
    const aPriority = priorityOrder[a.type] || 6
    const bPriority = priorityOrder[b.type] || 6
    
    if (aPriority !== bPriority) return aPriority - bPriority
    
    // Within same type, prioritize by severity
    const severityOrder = { 'high': 1, 'medium': 2, 'low': 3 }
    return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
  }) || []
  
  const previewIssues = prioritizedIssues.slice(0, 1) // Show only 1 issue
  const lockedIssues = totalIssues - 1

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
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 text-center">
        <div className="flex items-center justify-center space-x-4 mb-3 text-xs">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>10k+ users</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>5X interviews</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span>4.9/5</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-1">CV Analysis Complete!</h2>
        <p className="text-blue-100 text-sm">{fileName}</p>
      </div>

      {/* Compact Critical Issues Summary */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-1 text-red-600">
              {analysis.detailed_analysis?.critical_issues_found || totalIssues}
            </div>
            <p className="text-lg text-gray-700 mb-2">Critical Issues</p>
            <p className="text-gray-600 text-sm max-w-xs">
              Issues that might be preventing interviews
            </p>
          </div>
          
          {/* Template Recommendation - Inline */}
          {analysis.detailed_analysis?.template_recommendation && analysis.detailed_analysis.template_recommendation !== 'keep_original' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs">
              <div className="text-center">
                <h4 className="font-semibold text-yellow-800 mb-1 text-sm">💡 Template Fix</h4>
                <p className="text-xs text-yellow-700">
                  Try our <strong>{analysis.detailed_analysis.template_recommendation}</strong> template
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Single High-Impact Issue Preview */}
        <div className="mb-4">
          {previewIssues.map((issue, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-red-800 mb-1">
                        🚨 Critical {issue.type || 'Issue'} Found
                      </h4>
                      <p className="text-red-700 font-medium text-sm">This might be costing you interviews</p>
                    </div>
                    {issue.severity && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800 border border-red-300' :
                        issue.severity === 'medium' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}>
                        {issue.severity}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
                    <p className="text-gray-800 font-medium mb-1 text-sm">❌ Problem:</p>
                    <p className="text-gray-700 text-sm mb-2">{issue.description || issue.message}</p>
                    
                    {issue.impact && (
                      <div className="bg-red-50 rounded p-2">
                        <p className="text-red-700 font-medium text-xs">
                          💥 Impact: {issue.impact}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <p className="text-green-800 font-bold text-sm">AI-Powered Rewrite Available</p>
                    </div>
                    <p className="text-green-700 text-xs leading-relaxed">
                      {issue.fix ? `We'll rewrite this section: "${issue.fix}"` : 
                       `Our AI will rewrite this section with industry-specific language that gets past ATS systems.`}
                    </p>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-green-600">
                      <span>🎯 Industry-specific</span>
                      <span>•</span>
                      <span>🤖 AI-powered</span>
                      <span>•</span>
                      <span>⚡ Instant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Locked Issues */}
        {lockedIssues > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-300 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                    🔒 {lockedIssues} More Issues Hidden
                  </h4>
                  <p className="text-gray-600 font-medium text-sm">
                    + {totalRecommendations} AI rewrites & fixes
                  </p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-700">
                    <span>✍️ Grammar</span>
                    <span>•</span>
                    <span>🎯 ATS</span>
                    <span>•</span>
                    <span>📈 Impact</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowingPreview(!showingPreview)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showingPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span className="text-xs">{showingPreview ? 'Hide' : 'Peek'}</span>
              </button>
            </div>

            {showingPreview && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="space-y-2">
                  {analysis.issues?.slice(1, 3).map((issue, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded border border-gray-200">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800 blur-sm truncate">{issue.type || 'Critical Issue'}</span>
                          <Lock className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-600 blur-sm">{(issue.description || issue.message || 'Additional critical issue').substring(0, 50)}...</p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center py-2">
                    <p className="text-xs text-blue-600 font-medium">🔐 Unlock for specific fixes & AI rewrites</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact Upgrade CTA */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 text-center">
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