'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, ArrowRight, FileText, Users, Briefcase } from 'lucide-react'

interface CVOverviewModalProps {
  isOpen: boolean
  onClose: () => void
  cvData: any
  analysis: any
  onContinue: (roleType: string, market: string) => void
}

export default function CVOverviewModal({ 
  isOpen, 
  onClose, 
  cvData, 
  analysis, 
  onContinue 
}: CVOverviewModalProps) {
  const [selectedRoleType, setSelectedRoleType] = useState<string>('')
  const [selectedMarket, setSelectedMarket] = useState<string>('')

  if (!isOpen) return null

  // Generate first impression summary based on CV data and analysis
  const generateFirstImpression = () => {
    const criticalIssues = analysis?.issues?.filter((issue: any) => issue.severity === 'critical')?.length || 0
    const totalIssues = analysis?.issues?.length || 0
    const hasExperience = cvData?.work_experience?.length > 0
    const hasSkills = cvData?.skills?.length > 0
    const hasEducation = cvData?.education?.length > 0

    if (criticalIssues > 5) {
      return "Your CV shows potential but needs significant improvements. The content is there, but formatting and presentation issues are hiding your strengths from recruiters."
    } else if (criticalIssues > 2) {
      return "Good foundation with relevant experience, but several key areas need attention to make your CV stand out to hiring managers."
    } else if (totalIssues > 3) {
      return "Strong professional background comes through, but minor formatting and content tweaks will significantly boost your interview chances."
    } else {
      return "Impressive CV with solid experience and skills. Just a few strategic improvements will make this recruitment-ready."
    }
  }

  const criticalIssues = analysis?.issues?.filter((issue: any) => issue.severity === 'critical')?.length || 0
  const totalIssues = analysis?.issues?.length || 0
  const overallScore = analysis?.overall_score || 0

  const getRatingColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600' 
    return 'text-red-600'
  }

  const getRatingText = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">CV Analysis Complete</h2>
              <p className="text-gray-600">Here's how your CV looks to recruiters</p>
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
                  {generateFirstImpression()}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getRatingColor(overallScore)} mb-1`}>
                {overallScore}%
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className={`text-xs font-medium ${getRatingColor(overallScore)}`}>
                {getRatingText(overallScore)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">{criticalIssues}</div>
              <div className="text-sm text-gray-600">Critical Issues</div>
              <div className="text-xs text-red-600 font-medium">Must Fix</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{totalIssues}</div>
              <div className="text-sm text-gray-600">Total Issues</div>
              <div className="text-xs text-yellow-600 font-medium">All Types</div>
            </div>
          </div>

          {/* Key Issues Preview */}
          {analysis?.issues && analysis.issues.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Issues Found</h3>
              <div className="space-y-2">
                {analysis.issues.slice(0, 3).map((issue: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-900">{issue.type || 'Content Issue'}</div>
                      <div className="text-xs text-red-700">{issue.message || 'Needs improvement'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {analysis.issues.length > 3 && (
                <div className="text-sm text-gray-500 mt-2">
                  +{analysis.issues.length - 3} more issues to address
                </div>
              )}
            </div>
          )}

          {/* Role Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What type of roles are you applying for?</h3>
            <p className="text-sm text-gray-600 mb-4">This helps us recommend the best template for your industry</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedRoleType('professional')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedRoleType === 'professional'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Briefcase className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Professional</span>
                </div>
                <p className="text-sm text-gray-600">
                  Corporate, Finance, Consulting, Management, Sales, etc.
                </p>
              </button>
              
              <button
                onClick={() => setSelectedRoleType('creative')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedRoleType === 'creative'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Creative</span>
                </div>
                <p className="text-sm text-gray-600">
                  Design, Marketing, Tech, Startups, Media, etc.
                </p>
              </button>
            </div>
          </div>

          {/* Market/Language Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Which market are you targeting?</h3>
            <p className="text-sm text-gray-600 mb-4">We'll customize language, format, and content recommendations for your target market</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'uk', name: 'United Kingdom', flag: '🇬🇧', description: 'CV format, British English' },
                { code: 'us', name: 'United States', flag: '🇺🇸', description: 'Resume format, American English' },
                { code: 'ca', name: 'Canada', flag: '🇨🇦', description: 'Resume format, Canadian English' },
                { code: 'au', name: 'Australia', flag: '🇦🇺', description: 'CV format, Australian English' }
              ].map((market) => (
                <button
                  key={market.code}
                  onClick={() => setSelectedMarket(market.code)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedMarket === market.code
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{market.flag}</span>
                    <span className="font-medium text-gray-900 text-sm">{market.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{market.description}</p>
                </button>
              ))}
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
              onClick={() => {
                if (selectedRoleType && selectedMarket) {
                  onContinue(selectedRoleType, selectedMarket)
                }
              }}
              disabled={!selectedRoleType || !selectedMarket}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedRoleType && selectedMarket
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Continue to Template Selection</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* ATS Information */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 rounded-full p-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 mb-1">About ATS Systems</h4>
                <p className="text-xs text-yellow-800">
                  We'll create both a beautifully formatted CV for agencies/email applications, 
                  and an ATS-optimized version for large corporations. We'll help you identify which to use when.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}