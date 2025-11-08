'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/80">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-gray-900">£0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Upload and analyze your CV</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">5 AI chat messages per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">Basic CV templates</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <span className="text-gray-700">PDF export</span>
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
              POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-4">Premium</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold">£5</span>
              <span className="text-white/80">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>Unlimited AI chat messages</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>Advanced CV suggestions</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>Job description matching</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-white mr-3 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-white text-orange-600 hover:bg-gray-100 font-medium py-3 rounded-full transition-colors"
            >
              Subscribe Now
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
