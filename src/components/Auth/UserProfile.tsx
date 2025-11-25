'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { X, Crown, Loader2 } from 'lucide-react'
import FeedbackModal from '@/components/Feedback/FeedbackModal'

const LANGUAGE_OPTIONS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'nl-NL', label: 'Nederlands' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ar-SA', label: 'العربية' }
]

interface UserProfileProps {
  onClose?: () => void
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user, signOut, loading } = useAuth()
  const [languagePreference, setLanguagePreference] = useState('en-US')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState<'improvement' | 'bug' | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (user) {
      loadLanguagePreference()
    }
  }, [user])

  const loadLanguagePreference = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('language_preference, subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single()
    
    if (data?.language_preference) {
      setLanguagePreference(data.language_preference)
    }
    
    if (data?.subscription_status) {
      setSubscriptionStatus(data.subscription_status)
    }
    
    if (data?.stripe_customer_id) {
      setStripeCustomerId(data.stripe_customer_id)
    }
  }

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user) return
    
    setSaving(true)
    setSaveMessage('')
    
    try {
      // Try upsert which handles both insert and update
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ 
          id: user.id, 
          language_preference: newLanguage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
      
      if (error) {
        console.error('Error saving language:', error)
        setSaveMessage('Failed to save language preference')
      } else {
        setLanguagePreference(newLanguage)
        setSaveMessage('Language preference saved!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (err) {
      console.error('Error saving language:', err)
      setSaveMessage('Failed to save language preference')
    }
    
    setSaving(false)
  }
  
  const handleCancelSubscription = async () => {
    if (!stripeCustomerId || !user) return
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to Premium features at the end of your billing period.'
    )
    
    if (!confirmed) return
    
    setCancelling(true)
    
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('Subscription cancelled successfully. You will have access until the end of your billing period.')
        // Refresh subscription status
        await loadLanguagePreference()
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const content = (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
      
      {/* Subscription Status */}
      {subscriptionStatus === 'active' && (
        <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <Crown className="h-5 w-5" />
            <span className="font-bold">Premium Plan</span>
          </div>
          <p className="text-sm text-white/90">You have unlimited access to all Premium features</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">User ID</label>
          <p className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">{user.id}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
          <p className="mt-1 text-sm text-gray-900">
            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
          </p>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Language Preference
          </label>
          <select
            id="language"
            value={languagePreference}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={saving}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            This affects the language used by the AI assistant
          </p>
          {saveMessage && (
            <p className="mt-2 text-sm text-green-600">{saveMessage}</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-2">
          {subscriptionStatus === 'active' && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          )}
          <button
            onClick={() => setShowFeedbackModal('improvement')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Suggest an Improvement
          </button>
          <button
            onClick={() => setShowFeedbackModal('bug')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Report a Bug
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-4"
        >
          Sign Out
        </button>
      </div>
    </div>
  )

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {content}
        </div>
        {showFeedbackModal && (
          <FeedbackModal
            type={showFeedbackModal}
            onClose={() => setShowFeedbackModal(null)}
          />
        )}
      </>
    )
  }

  // Otherwise render as page (for backward compatibility)
  return (
    <>
      <div className="mt-8">
        {content}
      </div>
      {showFeedbackModal && (
        <FeedbackModal
          type={showFeedbackModal}
          onClose={() => setShowFeedbackModal(null)}
        />
      )}
    </>
  )
}