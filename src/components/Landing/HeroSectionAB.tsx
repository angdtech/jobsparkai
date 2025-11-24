'use client'

import React, { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { Users, Star, CheckCircle } from 'lucide-react'

interface HeroSectionABProps {
  onGetStarted: () => void
}

// Define your variants
const VARIANTS = {
  control: {
    heading: 'Land Your Dream Job',
    subheading: 'Professional resume optimization to help you stand out and get more interviews',
    cta: 'Get Started'
  },
  variant_a1: {
    heading: 'Find Out Why You\'re Not Getting Interviews',
    subheading: 'Upload your resume and instantly see what is holding you back with clear suggestions you can fix today',
    cta: 'Sign Up'
  },
  variant_a2: {
    heading: 'Find Out Why You\'re Not Getting Interviews',
    subheading: 'Upload your resume and instantly see what is holding you back with clear suggestions you can fix today',
    cta: 'Get Started'
  },
  variant_a3: {
    heading: 'Find Out Why You\'re Not Getting Interviews',
    subheading: 'Upload your resume and instantly see what is holding you back with clear suggestions you can fix today',
    cta: 'Sign Up Now'
  },
  variant_b1: {
    heading: 'Instant Resume Check',
    subheading: 'Get a quick and simple breakdown of your resume strengths and weaknesses in under 60 seconds',
    cta: 'Sign Up'
  },
  variant_b2: {
    heading: 'Instant Resume Check',
    subheading: 'Get a quick and simple breakdown of your resume strengths and weaknesses in under 60 seconds',
    cta: 'Get Started'
  },
  variant_b3: {
    heading: 'Instant Resume Check',
    subheading: 'Get a quick and simple breakdown of your resume strengths and weaknesses in under 60 seconds',
    cta: 'Sign Up Now'
  },
  variant_c1: {
    heading: 'Turn Your Resume into More Interviews',
    subheading: 'Get specific and actionable improvements that make your resume stand out to hiring managers',
    cta: 'Sign Up'
  },
  variant_c2: {
    heading: 'Turn Your Resume into More Interviews',
    subheading: 'Get specific and actionable improvements that make your resume stand out to hiring managers',
    cta: 'Get Started'
  },
  variant_c3: {
    heading: 'Turn Your Resume into More Interviews',
    subheading: 'Get specific and actionable improvements that make your resume stand out to hiring managers',
    cta: 'Sign Up Now'
  }
}

export default function HeroSectionAB({ onGetStarted }: HeroSectionABProps) {
  const posthog = usePostHog()
  const [variant, setVariant] = useState<keyof typeof VARIANTS>('control')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (posthog) {
      // Get the feature flag value
      const flagValue = posthog.getFeatureFlag('hero-text-variant')
      
      // Set variant based on flag (control, test, variant_a, variant_b)
      if (flagValue && flagValue in VARIANTS) {
        setVariant(flagValue as keyof typeof VARIANTS)
      }
      
      setIsLoading(false)
    }
  }, [posthog])

  const handleGetStarted = () => {
    // Track the click event for experiment metrics
    posthog?.capture('hero_cta_clicked', {
      variant,
      experiment: 'hero-text-variant'
    })
    
    onGetStarted()
  }

  if (isLoading) {
    return null // Or a loading skeleton
  }

  const content = VARIANTS[variant]

  return (
    <HeroSectionVariant
      heading={content.heading}
      subheading={content.subheading}
      ctaText={content.cta}
      onGetStarted={handleGetStarted}
    />
  )
}

// Variant component that accepts dynamic content
function HeroSectionVariant({
  heading,
  subheading,
  ctaText,
  onGetStarted
}: {
  heading: string
  subheading: string
  ctaText: string
  onGetStarted: () => void
}) {
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
        {/* Main Heading - A/B TESTED */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          {heading}
        </h1>

        {/* Subheading - A/B TESTED */}
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
          {subheading}
        </p>

        {/* CTA Button - A/B TESTED */}
        <div className="max-w-2xl mx-auto mb-12">
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-12 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {ctaText}
          </button>
        </div>

        {/* Quick Preview of Benefits - Desktop Only */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-white/80 mb-16">
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

        {/* Demo GIF - Replaces Template Preview */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-white mb-8">See It In Action</h3>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
            <img 
              src="/hero-demo.gif" 
              alt="Resume analysis demo" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
