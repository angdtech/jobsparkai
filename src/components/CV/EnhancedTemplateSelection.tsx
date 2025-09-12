'use client'

import { useState } from 'react'
import { X, Check, Star, Users, Briefcase, ArrowRight } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: 'professional' | 'creative' | 'academic' | 'modern'
  preview: string
  features: string[]
  recommended: boolean
}

interface EnhancedTemplateSelectionProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  roleType: string
  market: string
  cvData: any
}

const templates: Template[] = [
  {
    id: 'professional',
    name: 'Professional Executive',
    description: 'Clean, corporate design perfect for senior positions',
    category: 'professional',
    preview: '/templates/professional-preview.png',
    features: ['ATS-friendly', 'Executive Summary', 'Skills Matrix', 'Two-column layout'],
    recommended: true
  },
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Contemporary design with subtle color accents',
    category: 'modern',
    preview: '/templates/modern-preview.png',
    features: ['Eye-catching design', 'Color customization', 'Icon integration', 'Modern typography'],
    recommended: false
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Bold design for creative professionals',
    category: 'creative',
    preview: '/templates/creative-preview.png',
    features: ['Portfolio section', 'Custom colors', 'Creative layout', 'Social links'],
    recommended: false
  },
  {
    id: 'classic',
    name: 'Classic Traditional',
    description: 'Traditional format trusted by recruiters',
    category: 'professional',
    preview: '/templates/classic-preview.png',
    features: ['Traditional layout', 'Black & white', 'ATS-optimized', 'Simple format'],
    recommended: false
  }
]

export default function EnhancedTemplateSelection({ 
  isOpen, 
  onClose, 
  sessionId, 
  roleType, 
  market, 
  cvData 
}: EnhancedTemplateSelectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const getRecommendedTemplates = () => {
    if (roleType === 'creative') {
      return templates.filter(t => t.category === 'creative' || t.category === 'modern')
    } else if (roleType === 'professional') {
      return templates.filter(t => t.category === 'professional' || t.category === 'modern')
    }
    return templates
  }

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleGenerate = async () => {
    if (!selectedTemplate) return

    setIsGenerating(true)
    try {
      // Navigate to resume page with selected template
      window.location.href = `/resume?session=${sessionId}&template=${selectedTemplate}`
    } catch (error) {
      console.error('Error generating CV:', error)
      alert('Failed to generate CV. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const recommendedTemplates = getRecommendedTemplates()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your CV Template</h2>
              <p className="text-gray-600">
                Select a professional template optimized for {roleType} roles in the {market.toUpperCase()} market
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Market-specific info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Customized for You</h3>
                <p className="text-blue-800">
                  These templates are optimized for {roleType} positions and formatted according to {market.toUpperCase()} hiring standards.
                </p>
              </div>
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {recommendedTemplates.map((template) => (
              <div
                key={template.id}
                className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                } ${template.recommended ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                {template.recommended && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>RECOMMENDED</span>
                    </div>
                  </div>
                )}

                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-blue-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Template Preview */}
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Template Preview</p>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Key Features:</h4>
                    <ul className="space-y-1">
                      {template.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (selectedTemplate) {
                    window.location.href = `/resume?session=${sessionId}&template=${selectedTemplate}&preview=true`
                  }
                }}
                disabled={!selectedTemplate}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTemplate
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Preview
              </button>
              
              <button
                onClick={handleGenerate}
                disabled={!selectedTemplate || isGenerating}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedTemplate && !isGenerating
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>{isGenerating ? 'Generating...' : 'Generate CV'}</span>
                {!isGenerating && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Your CV content will be professionally formatted using the selected template</li>
              <li>• You'll be able to edit and customize every section</li>
              <li>• Download as PDF when you're satisfied with the result</li>
              <li>• Generate multiple versions for different applications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}