'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/')
      return
    }

    setIsLoading(true)
    try {
      // Use test keys in development, live keys in production
      const publishableKey = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        : process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY!
      
      const stripe = (await import('@stripe/stripe-js')).loadStripe(publishableKey)
      
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceType: 'monthly',
          sessionId: 'pricing-page',
          userId: user.id
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        // Modern approach: direct redirect to Stripe checkout URL
        window.location.href = data.checkoutUrl
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to create checkout session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Get Fast, AI-Powered CV Analysis
          </h1>
          <p className="text-xl text-white/80">
            Premium gives you unlimited access to our AI Resume Assistant
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Trial</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">£0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Upload and analyze your CV instantly</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700"><strong>2 AI chat messages</strong> to trial the Resume Assistant</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">See instant CV improvements and ATS feedback</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Export to PDF</span>
              </li>
            </ul>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 rounded-full transition-colors"
            >
              Get Started Free
            </button>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-8 text-white relative">
            <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <h3 className="text-2xl font-bold mb-4">Premium</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold">£5</span>
              <span className="text-white/80">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span><strong>Unlimited AI Resume Assistant</strong> - chat as much as you need</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span><strong>Fast CV analysis and updates</strong> with priority processing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>AI-powered improvements and suggestions</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>Compare your CV to job descriptions</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>All templates and export options</span>
              </li>
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-white text-orange-600 hover:bg-gray-100 font-medium py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Subscribe Now'}
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
