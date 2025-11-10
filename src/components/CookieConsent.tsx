'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Cookie } from 'lucide-react'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setShowBanner(false)
  }

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-gray-900 to-gray-800 shadow-2xl border-t border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">We use cookies</p>
              <p>
                We use cookies to improve your experience, analyze site traffic, and for marketing purposes. 
                By clicking "Accept", you consent to our use of cookies.{' '}
                <Link href="/privacy-policy" className="text-orange-400 hover:text-orange-300 underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all duration-300"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
