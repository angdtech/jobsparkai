'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

interface ErrorLog {
  id: number
  created_at: string
  error_message: string
  error_stack: string
  error_type: string
  user_id: string | null
  session_id: string | null
  url: string
  severity: string
  metadata: any
  resolved: boolean
}

export default function ErrorLogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
      } else {
        setIsAdmin(true)
        loadLogs()
      }
    }
  }, [user, loading, router])

  const loadLogs = async () => {
    setLoadingLogs(true)
    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/admin/error-logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Error Logs</h1>
        </div>

        {loadingLogs ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No errors logged</h3>
            <p className="text-gray-600">Great! Your application is running smoothly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error List */}
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedLog?.id === log.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">{log.error_type}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{log.error_message}</div>
                  {log.url && (
                    <div className="text-xs text-gray-500 mt-2 truncate">{log.url}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Detail */}
            <div className="lg:sticky lg:top-8">
              {selectedLog ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedLog.severity)}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedLog.error_type}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Message</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedLog.error_message}</div>
                    </div>

                    {selectedLog.error_stack && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">Stack Trace</div>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                          {selectedLog.error_stack}
                        </pre>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Details</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Time:</span> {new Date(selectedLog.created_at).toLocaleString()}</div>
                        {selectedLog.url && <div><span className="font-medium">URL:</span> {selectedLog.url}</div>}
                        {selectedLog.session_id && <div><span className="font-medium">Session:</span> {selectedLog.session_id}</div>}
                        {selectedLog.user_id && <div><span className="font-medium">User ID:</span> {selectedLog.user_id}</div>}
                      </div>
                    </div>

                    {selectedLog.metadata && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">Metadata</div>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                  Select an error to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
