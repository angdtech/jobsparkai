'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasActiveSubscription } from '@/lib/analytics'
import { Lock } from 'lucide-react'

interface SubscriptionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setHasAccess(false)
        setChecking(false)
        return
      }

      try {
        const access = await hasActiveSubscription(user.id)
        setHasAccess(access)
      } catch (error) {
        console.error('Error checking subscription:', error)
        setHasAccess(false)
      } finally {
        setChecking(false)
      }
    }

    if (!loading) {
      checkSubscription()
    }
  }, [user, loading])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access this feature.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <Lock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-gray-600 mb-4">
            Subscribe for just £5/month to unlock unlimited AI responses and advanced features.
          </p>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">£5/month</div>
            <div className="text-sm text-gray-600">Unlimited AI assistance</div>
          </div>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium w-full"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
