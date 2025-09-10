'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function UserProfile() {
  const { user, signOut, loading } = useAuth()

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