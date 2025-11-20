'use client'

import React from 'react'
import { ArrowRight, Star, Users, CheckCircle } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-20">
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
        <div className="flex flex-col md:flex-row items-center justify-center md:space-x-6 space-y-2 md:space-y-0 mb-12 text-white/80">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="text-xs md:text-sm">Thousands of professionals</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-xs md:text-sm">AI-powered optimization</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-xs md:text-sm">Lightning-fast analysis</span>
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
            Try Free - No Credit Card Required
          </button>
          <p className="text-white/60 text-sm mt-4">
            ✓ Free trial • ✓ No payment needed • ✓ Cancel anytime
          </p>
        </div>

        {/* Quick Preview of Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-white/80 mb-16">
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

        {/* Template Preview */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-semibold text-white mb-8">Professional Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-2xl p-8 transform hover:scale-105 transition-transform">
              <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded p-6">
                <div className="h-4 bg-gray-800 w-3/4 mb-4 rounded"></div>
                <div className="h-2 bg-gray-400 w-1/2 mb-6 rounded"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-2 bg-gray-300 w-full rounded"></div>
                  <div className="h-2 bg-gray-300 w-5/6 rounded"></div>
                  <div className="h-2 bg-gray-300 w-4/6 rounded"></div>
                </div>
                <div className="h-3 bg-blue-600 w-2/3 mb-4 rounded"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-300 w-full rounded"></div>
                  <div className="h-2 bg-gray-300 w-3/4 rounded"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-2xl p-8 transform hover:scale-105 transition-transform">
              <div className="bg-gradient-to-br from-slate-800 to-gray-800 rounded p-6 flex">
                <div className="w-1/3 bg-slate-700 rounded-l p-4 mr-4">
                  <div className="h-3 bg-gray-400 w-full mb-3 rounded"></div>
                  <div className="h-2 bg-gray-500 w-full mb-2 rounded"></div>
                  <div className="h-2 bg-gray-500 w-3/4 mb-4 rounded"></div>
                  <div className="h-2 bg-gray-500 w-full mb-1 rounded"></div>
                  <div className="h-2 bg-gray-500 w-2/3 rounded"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-white w-3/4 mb-3 rounded"></div>
                  <div className="h-2 bg-gray-400 w-full mb-2 rounded"></div>
                  <div className="h-2 bg-gray-400 w-5/6 mb-4 rounded"></div>
                  <div className="h-2 bg-gray-400 w-full mb-1 rounded"></div>
                  <div className="h-2 bg-gray-400 w-4/6 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}