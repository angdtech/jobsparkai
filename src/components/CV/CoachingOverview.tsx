'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, ArrowRight, FileText, Shield, Target } from 'lucide-react'
import type { ATSAnalysis } from '@/lib/ats-analysis'

interface CoachingOverviewProps {
  analysis: ATSAnalysis
  personalizationData?: {
    roleTypes: string[]
    market: string
  }
  onContinue: () => void
  onViewFullAnalysis: () => void
}

export default function CoachingOverview({ 
  analysis, 
  personalizationData, 
  onContinue, 
  onViewFullAnalysis 
}: CoachingOverviewProps) {
  
  // Generate first impression summary based on analysis
  const generateFirstImpression = () => {
    const score = analysis.overall_score
    const issues = analysis.issues?.length || 0
    const strengths = analysis.strengths?.length || 0
    
    if (score >= 85) {
      return "Strong professional presentation with clear structure and impactful content. Your CV effectively communicates your value proposition."
    } else if (score >= 70) {
      return "Good foundation with room for improvement. The technical skills come through well, but some formatting and content tweaks will increase impact."
    } else if (score >= 55) {
      return "Solid experience is evident, but the layout and presentation could be optimized to better highlight your key achievements and make a stronger first impression."
    } else {
      return "Strong technical background comes through, but the layout hides key achievements and the CV feels generic. Significant improvements needed for maximum impact."
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200'
    if (score >= 60) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  const criticalIssues = analysis.issues?.filter(issue => issue.severity === 'high').length || 0
  const totalIssues = analysis.issues?.length || 0

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center space-x-3 mb-2">
          <Target className="w-6 h-6" />
          <h2 className="text-2xl font-bold">CV Analysis Complete</h2>
        </div>
        <p className="text-blue-100">Here's how your CV comes across at first glance</p>
      </div>

      <div className="p-6">
        {/* First Impression */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              👁️
            </div>
            First Impression
          </h3>
          <div className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-gray-700 leading-relaxed italic">
              "{generateFirstImpression()}"
            </p>
          </div>
          
          {personalizationData?.market && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">Tailored for:</span> {personalizationData.market} market
              {personalizationData.roleTypes.length > 0 && (
                <span> • {personalizationData.roleTypes.join(', ')} roles</span>
              )}
            </div>
          )}
        </div>

        {/* Score Summary */}
        <div className="mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className={`p-6 rounded-lg border-2 ${getScoreBgColor(analysis.overall_score)}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)} mb-2`}>
                  {analysis.overall_score}%
                </div>
                <div className="text-sm font-medium text-gray-600">Overall ATS Score</div>
                <div className={`text-xs mt-1 font-semibold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.rating}
                </div>
              </div>
            </div>

            {/* Issues Found */}
            <div className="p-6 rounded-lg border-2 bg-orange-50 border-orange-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {totalIssues}
                </div>
                <div className="text-sm font-medium text-gray-600">Issues Found</div>
                <div className="text-xs mt-1 text-orange-600 font-semibold">
                  {criticalIssues} Critical
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="p-6 rounded-lg border-2 bg-green-50 border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analysis.strengths?.length || 0}
                </div>
                <div className="text-sm font-medium text-gray-600">Strengths</div>
                <div className="text-xs mt-1 text-green-600 font-semibold">
                  Good foundation
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CV Content Summary */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              📋
            </div>
            Your CV Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Content Overview</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• <span className="font-medium">{analysis.total_words || 0}</span> words total</li>
                <li>• <span className="font-medium">{analysis.issues?.length || 0}</span> areas for improvement</li>
                <li>• <span className="font-medium">{analysis.strengths?.length || 0}</span> strong points identified</li>
                <li>• ATS compatibility: <span className={`font-medium ${analysis.overall_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.overall_score >= 70 ? 'Good' : 'Needs Work'}
                </span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Target Market</h4>
              <div className="text-sm text-gray-600">
                {personalizationData?.market ? (
                  <p>Optimized for: <span className="font-medium capitalize">{personalizationData.market}</span> market</p>
                ) : (
                  <p className="text-gray-500 italic">Market preferences not set yet</p>
                )}
                {personalizationData?.roleTypes && personalizationData.roleTypes.length > 0 && (
                  <p className="mt-1">Role focus: <span className="font-medium">{personalizationData.roleTypes.join(', ')}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Issues */}
            {analysis.issues && analysis.issues.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Top Issues</h4>
                    <ul className="space-y-1 text-sm text-red-700">
                      {analysis.issues.slice(0, 3).map((issue, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                    {analysis.issues.length > 3 && (
                      <p className="text-xs text-red-600 mt-2 italic">+{analysis.issues.length - 3} more issues to address</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Top Strengths */}
            {analysis.strengths && analysis.strengths.length > 0 ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Your Strengths</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      {analysis.strengths.slice(0, 3).map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {strength.message}
                        </li>
                      ))}
                    </ul>
                    {analysis.strengths.length > 3 && (
                      <p className="text-xs text-green-600 mt-2 italic">+{analysis.strengths.length - 3} more strengths found</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Improvement Potential</h4>
                    <p className="text-sm text-blue-700">
                      Your CV has great potential! We'll help you identify and highlight your key strengths 
                      to make them more visible to recruiters.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ATS Information */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Understanding CV Usage</h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div>
                  <div className="font-semibold">📧 This CV Version:</div>
                  <p>Perfect for applying directly via email, recruitment agencies, or networking. Optimized for human readers with great visual appeal.</p>
                </div>
                <div>
                  <div className="font-semibold">🤖 ATS Version (Coming Soon):</div>
                  <p>For big corporations and online applications. Stripped-down format that passes through Applicant Tracking Systems more effectively.</p>
                </div>
                <div className="p-3 bg-blue-100 rounded border-l-4 border-blue-400">
                  <p className="font-medium text-blue-800">💡 Pro Tip:</p>
                  <p>We'll help you identify which companies use ATS systems so you can choose the right version for each application.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onViewFullAnalysis}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>View Full Analysis</span>
          </button>
          
          <button
            onClick={onContinue}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors shadow-lg"
          >
            <span>Continue to Fix Issues</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Next Steps Guide */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              🎯
            </div>
            What Happens Next?
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-2">🔧</div>
              <h4 className="font-semibold text-gray-800 mb-2">Fix Issues</h4>
              <p className="text-sm text-gray-600">We'll guide you through fixing each issue with specific recommendations</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="font-semibold text-gray-800 mb-2">Choose Template</h4>
              <p className="text-sm text-gray-600">Select from professional templates that suit your industry and role</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-2">📄</div>
              <h4 className="font-semibold text-gray-800 mb-2">Generate CV</h4>
              <p className="text-sm text-gray-600">Get both a beautiful CV and an ATS-optimized version</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Ready to make your CV stand out? Let's fix these issues and get you more interviews.
          </p>
        </div>
      </div>
    </div>
  )
}