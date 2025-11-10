'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, MailOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

interface ContactMessage {
  id: number
  created_at: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
}

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replySuccess, setReplySuccess] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
      } else {
        setIsAdmin(true)
        loadMessages()
      }
    }
  }, [user, loading, router])

  const loadMessages = async () => {
    setLoadingMessages(true)
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMessages(data)
    }
    setLoadingMessages(false)
  }

  const markAsRead = async (messageId: number) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ read: true })
      .eq('id', messageId)

    if (!error) {
      setMessages(messages.map(m => m.id === messageId ? { ...m, read: true } : m))
    }
  }

  const selectMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    setReplyMessage('')
    setReplySuccess(false)
    if (!message.read) {
      markAsRead(message.id)
    }
  }

  const sendReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) return

    setSendingReply(true)
    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/admin/send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          replyMessage: replyMessage
        })
      })

      if (response.ok) {
        setReplySuccess(true)
        setReplyMessage('')
        setTimeout(() => setReplySuccess(false), 3000)
      } else {
        alert('Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    } finally {
      setSendingReply(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        </div>

        {loadingMessages ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">Contact form submissions will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="space-y-3 max-h-[800px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => selectMessage(message)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
                  } ${!message.read ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {message.read ? (
                        <MailOpen className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-semibold text-gray-900">{message.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{message.email}</div>
                  <div className="font-medium text-gray-900 mb-1">{message.subject}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{message.message}</div>
                </div>
              ))}
            </div>

            {/* Message Detail */}
            <div className="lg:sticky lg:top-8">
              {selectedMessage ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-6 pb-6 border-b">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                      {!selectedMessage.read && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Unread</span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><span className="font-medium">From:</span> {selectedMessage.name}</div>
                      <div><span className="font-medium">Email:</span> {selectedMessage.email}</div>
                      <div><span className="font-medium">Date:</span> {new Date(selectedMessage.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="prose max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {selectedMessage.message}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Send Reply</h3>
                    
                    {replySuccess && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">Reply sent successfully!</p>
                      </div>
                    )}
                    
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-3"
                    />
                    
                    <button
                      onClick={sendReply}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <>Send Reply</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                  Select a message to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
