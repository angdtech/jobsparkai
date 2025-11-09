'use client'

import React from 'react'
import { 
  Zap, 
  Target, 
  FileText, 
  Award, 
  BarChart3, 
  Download, 
  Shield, 
  Clock,
  CheckCircle 
} from 'lucide-react'

interface FeaturesSectionProps {
  onGetStarted?: () => void
}

const features = [
  {
    icon: <Zap className="h-8 w-8" />,
    title: "AI-Powered Analysis",
    description: "Advanced AI technology analyzes your resume and provides intelligent recommendations for maximum impact.",
    color: "from-yellow-400 to-orange-500"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "ATS Optimization",
    description: "Ensure your resume passes through Applicant Tracking Systems with our proven optimization techniques (Coming Soon).",
    color: "from-blue-400 to-indigo-500"
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Professional Editing",
    description: "Edit and refine your resume with our intuitive interface designed to help you create a polished final document.",
    color: "from-green-400 to-emerald-500"
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "AI-Powered Feedback",
    description: "Get instant feedback and recommendations to improve your resume format, content, and keywords.",
    color: "from-orange-400 to-red-500"
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Job Matching",
    description: "Compare your resume against specific job descriptions and get targeted improvement suggestions.",
    color: "from-red-400 to-rose-500"
  },
  {
    icon: <Download className="h-8 w-8" />,
    title: "Multiple Formats",
    description: "Export your optimized resume in PDF or editable formats with professional quality.",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Privacy Secure",
    description: "Your data is encrypted and secure. We never share your information with third parties.",
    color: "from-indigo-400 to-purple-500"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Lightning Fast",
    description: "Get comprehensive analysis and recommendations in under 1 minute with our optimized AI pipeline.",
    color: "from-orange-400 to-red-500"
  }
]

export default function FeaturesSection({ onGetStarted }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Powered by AI</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our comprehensive suite of AI-powered tools transforms your resume into a job-landing machine. 
            From ATS optimization to AI feedback, we've got you covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-green-600 font-medium mb-4">
            <CheckCircle className="h-5 w-5" />
            <span>Join thousands of professionals who've improved their resumes</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button onClick={onGetStarted} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
              Get Started
            </button>
            <span className="text-sm text-gray-500">No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  )
}