'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Landing/Header'
import HeroSection from '@/components/Landing/HeroSection'
import FeaturesSection from '@/components/Landing/FeaturesSection'
import HowItWorksSection from '@/components/Landing/HowItWorksSection'
import StatsSection from '@/components/Landing/StatsSection'
import AboutUsSection from '@/components/Landing/AboutUsSection'
import CTASection from '@/components/Landing/CTASection'
import LoginForm from '@/components/Auth/LoginForm'
import SignUpForm from '@/components/Auth/SignUpForm'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      setShowSignUpModal(true)
    }
  }

  const handleLogin = () => {
    setShowLoginModal(true)
  }

  const handleSignUp = () => {
    setShowSignUpModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white/30 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading JobSpark AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header onLogin={handleLogin} onSignUp={handleSignUp} />
      <HeroSection onGetStarted={handleGetStarted} />
      <FeaturesSection onGetStarted={handleGetStarted} />
      <HowItWorksSection />
      <StatsSection onGetStarted={handleGetStarted} />
      <AboutUsSection />
      <CTASection onGetStarted={handleGetStarted} />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your JobSpark AI account</p>
            </div>
            <LoginForm onSuccess={() => setShowLoginModal(false)} />
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  setShowSignUpModal(true)
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowSignUpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600">Create your JobSpark AI account</p>
            </div>
            <SignUpForm onSuccess={() => {
              setShowSignUpModal(false)
              router.push('/dashboard')
            }} />
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setShowSignUpModal(false)
                  setShowLoginModal(true)
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
