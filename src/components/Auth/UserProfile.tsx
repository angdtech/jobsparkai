'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

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

export default function UserProfile() {
  const { user, signOut, loading } = useAuth()
  const [languagePreference, setLanguagePreference] = useState('en-US')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadLanguagePreference()
    }
  }, [user])

  const loadLanguagePreference = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('language_preference')
      .eq('id', user.id)
      .single()
    
    if (data?.language_preference) {
      setLanguagePreference(data.language_preference)
    }
  }

  const handleLanguageChange = async (newLanguage: string) => {
    if (!user) return
    
    setSaving(true)
    setSaveMessage('')
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ language_preference: newLanguage })
      .eq('id', user.id)
    
    if (error) {
      setSaveMessage('Failed to save language preference')
    } else {
      setLanguagePreference(newLanguage)
      setSaveMessage('Language preference saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    }
    
    setSaving(false)
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

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
      
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

        <button
          onClick={handleSignOut}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}