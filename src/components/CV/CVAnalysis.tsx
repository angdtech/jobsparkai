'use client'

import React from 'react'
import { Scan, Zap, CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import type { ATSAnalysis, Recommendation, Issue, Strength } from '@/lib/ats-analysis'

interface CVAnalysisProps {
  analysis: ATSAnalysis
  isLoading?: boolean
}

export default function CVAnalysis({ analysis, isLoading = false }: CVAnalysisProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <h3 className="text-lg font-semibold text-gray-800">Analyzing your CV...</h3>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-200 h-24 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'from-green-400 to-green-600'
    if (score >= 80) return 'from-blue-400 to-blue-600'
    if (score >= 70) return 'from-yellow-400 to-yellow-600'
    if (score >= 60) return 'from-orange-400 to-orange-600'
    return 'from-red-400 to-red-600'
  }

  const circumference = 2 * Math.PI * 40
  const strokeDasharray = `${(analysis.overall_score / 100) * circumference} ${circumference}`

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Scan className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-800">ATS Analysis Results</h3>
        </div>
        <p className="text-gray-600 mt-1">AI-powered insights to optimize your resume</p>
      </div>

      <div className="p-6">
        {/* Overall Score */}
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="#e5e7eb" 
                strokeWidth="8" 
                fill="none" 
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                className={getScoreColor(analysis.overall_score)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}%
              </span>
            </div>
          </div>
          <h4 className="text-xl font-semibold text-gray-800 mb-2">
            {analysis.rating} ATS Compatibility
          </h4>
          <p className="text-gray-600">
            Your resume has been analyzed for Applicant Tracking System optimization
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ScoreCard 
            title="Format" 
            score={analysis.format_score} 
            icon={<TrendingUp className="w-4 h-4" />} 
          />
          <ScoreCard 
            title="Content" 
            score={analysis.readability_score} 
            icon={<Zap className="w-4 h-4" />} 
          />
          <ScoreCard 
            title="Keywords" 
            score={analysis.keyword_score} 
            icon={<CheckCircle className="w-4 h-4" />} 
          />
          <ScoreCard 
            title="Structure" 
            score={analysis.content_structure_score} 
            icon={<Scan className="w-4 h-4" />} 
          />
        </div>

        {/* Analysis Details */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-800 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-600" />
                Recommendations
              </h5>
              {analysis.recommendations.slice(0, 4).map((rec, index) => (
                <RecommendationItem key={index} recommendation={rec} />
              ))}
            </div>
          )}

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-800 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                Issues to Fix
              </h5>
              {analysis.issues.slice(0, 4).map((issue, index) => (
                <IssueItem key={index} issue={issue} />
              ))}
            </div>
          )}

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-800 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Strengths
              </h5>
              {analysis.strengths.slice(0, 4).map((strength, index) => (
                <StrengthItem key={index} strength={strength} />
              ))}
            </div>
          )}
        </div>

        {/* Keywords Found */}
        {analysis.keywords_found.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-3">Keywords Found ({analysis.keywords_found.length})</h5>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords_found.slice(0, 20).map((keyword, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {analysis.keywords_found.length > 20 && (
                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                  +{analysis.keywords_found.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-600">
          <span>Word count: {analysis.total_words}</span>
          <span>Analyzed: {new Date(analysis.analyzed_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ title, score, icon }: { title: string; score: number; icon: React.ReactNode }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
        {score}%
      </div>
    </div>
  )
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
      {getIcon(recommendation.type)}
      <div className="flex-1">
        <p className="text-sm text-gray-800">{recommendation.text}</p>
        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
          recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
          recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {recommendation.priority} priority
        </span>
      </div>
    </div>
  )
}

function IssueItem({ issue }: { issue: Issue }) {
  return (
    <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-gray-800">{issue.message}</p>
        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
          issue.severity === 'high' ? 'bg-red-100 text-red-700' :
          issue.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {issue.severity} severity
        </span>
      </div>
    </div>
  )
}

function StrengthItem({ strength }: { strength: Strength }) {
  return (
    <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
      <p className="text-sm text-gray-800 flex-1">{strength.message}</p>
    </div>
  )
}