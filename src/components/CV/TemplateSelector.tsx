'use client'

import { useState } from 'react'
import { Check, Star, Users, Briefcase, ArrowRight, FileText, Palette, Layout } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: 'professional' | 'creative' | 'academic' | 'modern'
  preview: string
  features: string[]
  recommended: boolean
  suitableFor: string[]
}

interface TemplateSelectorProps {
  onTemplateSelect: (templateId: string) => void
  personalizationData: {
    roleTypes: string[]
    market: string
  }
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean, contemporary design with subtle color accents',
    category: 'modern',
    preview: '/templates/modern-preview.png',
    features: ['ATS-friendly', 'Color customization', 'Modern typography', 'Skills visualization'],
    recommended: true,
    suitableFor: ['tech', 'marketing', 'consulting', 'finance']
  },
  {
    id: 'executive',
    name: 'Executive Elite',
    description: 'Sophisticated layout for senior-level positions',
    category: 'professional',
    preview: '/templates/executive-preview.png',
    features: ['Executive summary', 'Leadership focus', 'Achievement highlights', 'Premium layout'],
    recommended: true,
    suitableFor: ['management', 'executive', 'director', 'c-level']
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Bold, visual design for creative professionals',
    category: 'creative',
    preview: '/templates/creative-preview.png',
    features: ['Portfolio showcase', 'Creative layout', 'Visual hierarchy', 'Brand personality'],
    recommended: false,
    suitableFor: ['design', 'marketing', 'media', 'advertising']
  },
  {
    id: 'academic',
    name: 'Academic Research',
    description: 'Traditional format for academic and research positions',
    category: 'academic',
    preview: '/templates/academic-preview.png',
    features: ['Publications section', 'Research focus', 'Traditional layout', 'Detailed format'],
    recommended: false,
    suitableFor: ['academic', 'research', 'education', 'science']
  },
  {
    id: 'minimalist',
    name: 'Clean Minimalist',
    description: 'Simple, elegant design that focuses on content',
    category: 'professional',
    preview: '/templates/minimalist-preview.png',
    features: ['Clean design', 'Easy to read', 'ATS-optimized', 'Timeless style'],
    recommended: false,
    suitableFor: ['all', 'traditional', 'conservative']
  },
  {
    id: 'tech',
    name: 'Tech Innovator',
    description: 'Modern design optimized for technology roles',
    category: 'modern',
    preview: '/templates/tech-preview.png',
    features: ['Skills matrix', 'Project highlights', 'Tech-focused', 'Modern layout'],
    recommended: false,
    suitableFor: ['tech', 'engineering', 'development', 'data']
  }
]

export default function TemplateSelector({ 
  onTemplateSelect, 
  personalizationData 
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [hoveredTemplate, setHoveredTemplate] = useState<string>('')

  const getRecommendedTemplates = () => {
    const { roleTypes, market } = personalizationData
    
    // Filter templates based on role types
    const filtered = templates.filter(template => {
      if (roleTypes.length === 0) return true
      return roleTypes.some(roleType => 
        template.suitableFor.includes(roleType.toLowerCase()) || 
        template.suitableFor.includes('all')
      )
    })

    // Sort by recommended status
    return filtered.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return 0
    })
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleContinue = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate)
    }
  }

  const recommendedTemplates = getRecommendedTemplates()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Perfect Template</h2>
        <p className="text-gray-600">
          Select a template that matches your career goals and industry standards
        </p>
        {personalizationData.roleTypes.length > 0 && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
            <Users className="h-4 w-4" />
            <span>Filtered for: {personalizationData.roleTypes.join(', ')} roles</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {recommendedTemplates.map((template) => (
          <div
            key={template.id}
            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'border-blue-500 shadow-lg transform scale-105'
                : hoveredTemplate === template.id
                ? 'border-blue-300 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            } ${template.recommended ? 'ring-2 ring-yellow-400' : ''}`}
            onClick={() => handleTemplateSelect(template.id)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate('')}
          >
            {template.recommended && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>RECOMMENDED</span>
                </div>
              </div>
            )}

            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-blue-500 rounded-full p-1.5">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}

            {/* Template Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-40 flex items-center justify-center relative overflow-hidden">
              {/* Mock preview based on template type */}
              {template.category === 'creative' ? (
                <div className="text-center">
                  <Palette className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Creative Layout</div>
                </div>
              ) : template.category === 'modern' ? (
                <div className="text-center">
                  <Layout className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Modern Design</div>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500">Professional</div>
                </div>
              )}
              
              {/* Hover overlay */}
              {hoveredTemplate === template.id && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <button className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                    Preview
                  </button>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>
              
              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-900 uppercase tracking-wide">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                      +{template.features.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Suitable for */}
              <div className="mt-3 text-xs text-gray-500">
                Best for: {template.suitableFor.slice(0, 2).join(', ')}
                {template.suitableFor.length > 2 && ` +${template.suitableFor.length - 2}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedTemplate ? 'Template selected!' : 'Choose a template to continue'}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (selectedTemplate) {
                window.open(`/templates/preview/${selectedTemplate}`, '_blank')
              }
            }}
            disabled={!selectedTemplate}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTemplate
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Preview
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
              selectedTemplate
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Build My CV</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">🎯 Choosing the Right Template</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Modern/Tech:</strong> Great for startups, tech companies, and progressive industries</li>
          <li>• <strong>Professional/Executive:</strong> Perfect for corporate roles and traditional industries</li>
          <li>• <strong>Creative:</strong> Ideal for design, marketing, and creative positions</li>
          <li>• <strong>Academic:</strong> Best for research, education, and academic careers</li>
        </ul>
      </div>
    </div>
  )
}