'use client'

import React from 'react'
import { ArrowRight, CheckCircle, Star, Zap, Clock } from 'lucide-react'

interface CTASectionProps {
  onGetStarted: () => void
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-400 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          {/* Main Heading */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span>Get Started Today</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Your Resume{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              In Minutes
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
            Join thousands of professionals who landed their dream jobs with AI-optimized resumes. 
            Get started today and see results immediately.
          </p>

          {/* Benefits List */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">ATS-optimized formatting</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">AI-powered feedback</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">Professional formatting</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">Keyword optimization</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">Multiple export formats</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
              <span className="text-lg">Job description matching</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <button
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-6 px-12 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-3"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="text-white/60 text-sm mt-2 sm:mt-0">No credit card required</p>
            
            <div className="text-center">
              <div className="flex items-center space-x-1 text-yellow-400 justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
                <span className="text-white ml-2">4.9/5</span>
              </div>
              <div className="text-white/80 text-sm">Rated by thousands of users</div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="text-white">
                <div className="text-3xl font-bold mb-2 text-green-400">FAST</div>
                <div className="text-sm">Quick setup</div>
              </div>
              <div className="text-white">
                <div className="flex items-center justify-center space-x-1 text-3xl font-bold mb-2">
                  <Clock className="h-8 w-8 text-blue-400" />
                  <span>2min</span>
                </div>
                <div className="text-sm">Quick analysis</div>
              </div>
              <div className="text-white">
                <div className="text-3xl font-bold mb-2 text-purple-400">100%</div>
                <div className="text-sm">Secure & private</div>
              </div>
              <div className="text-white">
                <div className="text-3xl font-bold mb-2 text-yellow-400">24/7</div>
                <div className="text-sm">Always available</div>
              </div>
            </div>
          </div>

          {/* Final Message */}
          <div className="mt-12 text-white/80 text-lg">
            <p className="mb-2">Ready to land your dream job?</p>
            <p className="font-semibold text-green-400">Start your free trial now - no credit card required</p>
          </div>
        </div>
      </div>
    </section>
  )
}