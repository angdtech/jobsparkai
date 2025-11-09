'use client'

import React from 'react'
import { Upload, Sparkles, Download } from 'lucide-react'

const steps = [
  {
    icon: <Upload className="h-12 w-12" />,
    title: "Upload Your Resume",
    description: "Simply drag and drop your existing resume in any format.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Sparkles className="h-12 w-12" />,
    title: "Update & Use AI Assistant",
    description: "Make updates to your resume and use our AI assistant to optimize your content.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: <Download className="h-12 w-12" />,
    title: "Download Your Resume",
    description: "Once you're ready, download your professional resume and start applying.",
    color: "from-green-500 to-emerald-500"
  }
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get your professionally optimized resume in just 3 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center p-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Icon */}
              <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-r ${step.color} text-white mb-6 shadow-lg`}>
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-gray-900">That's it!</span> Simple, fast, and effective.
          </p>
        </div>
      </div>
    </section>
  )
}
