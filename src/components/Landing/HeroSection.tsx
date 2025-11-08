'use client'

import React from 'react'
import { ArrowRight, Star, Users, CheckCircle } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gray-400 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-slate-400 rounded-full filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-6 mb-8 text-white/80">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">10,000+ users</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm">AI-powered optimization</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm">Lightning-fast analysis</span>
          </div>
        </div>

        {/* Main Heading - NEW VALUE-FOCUSED */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Land Your Dream Job
        </h1>

        {/* Subheading - CLEARER PROCESS */}
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
          Professional resume optimization powered by AI to help you stand out
        </p>

        {/* CTA Button */}
        <div className="max-w-2xl mx-auto mb-12">
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-12 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started
          </button>
          <p className="text-white/60 text-sm mt-4">
            Join thousands of professionals landing their dream jobs
          </p>
        </div>

        {/* Quick Preview of Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-white/80">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <div className="font-semibold">Upload Resume</div>
            <div className="text-sm">Quick upload</div>
          </div>
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <div className="font-semibold">See Critical Issues</div>
            <div className="text-sm">Complete analysis in under 1 minute</div>
          </div>
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <div className="font-semibold">Get Professional Resume</div>
            <div className="text-sm">Download improved version</div>
          </div>
        </div>
      </div>
    </section>
  )
}