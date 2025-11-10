'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
      } else {
        setIsAdmin(true)
      }
    }
  }, [user, loading, router])

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contact Messages */}
          <div 
            onClick={() => router.push('/admin/messages')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Messages</h2>
            <p className="text-gray-600 text-sm">View and respond to contact form submissions</p>
          </div>

          {/* Error Logs */}
          <div 
            onClick={() => router.push('/admin/error-logs')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Logs</h2>
            <p className="text-gray-600 text-sm">View production errors and debugging information</p>
          </div>

          {/* Content Management */}
          <div 
            onClick={() => router.push('/admin/content')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Management</h2>
            <p className="text-gray-600 text-sm">Edit privacy policy, terms of service, and other content</p>
          </div>
        </div>
      </div>
    </div>
  )
}
