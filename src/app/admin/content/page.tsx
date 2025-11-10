'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft } from 'lucide-react'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

interface ContentItem {
  id: number
  content_key: string
  title: string
  content: string
  updated_at: string
}

export default function AdminContentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loadingContent, setLoadingContent] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
      } else {
        setIsAdmin(true)
        loadContent()
      }
    }
  }, [user, loading, router])

  const loadContent = async () => {
    setLoadingContent(true)
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('content_key')

    if (!error && data) {
      setContents(data)
      if (data.length > 0) {
        setSelectedContent(data[0])
        setEditedContent(data[0].content)
        setEditedTitle(data[0].title)
      }
    }
    setLoadingContent(false)
  }

  const handleSave = async () => {
    if (!selectedContent) return

    setIsSaving(true)
    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/admin/update-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          contentKey: selectedContent.content_key,
          title: editedTitle,
          content: editedContent
        })
      })

      if (response.ok) {
        alert('Content saved successfully!')
        loadContent()
      } else {
        alert('Failed to save content')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  const selectContent = (content: ContentItem) => {
    setSelectedContent(content)
    setEditedContent(content.content)
    setEditedTitle(content.title)
  }

  if (loading || !isAdmin || loadingContent) {
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
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Pages</h2>
              </div>
              <div className="divide-y">
                {contents.map((content) => (
                  <button
                    key={content.id}
                    onClick={() => selectContent(content)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedContent?.id === content.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{content.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {content.content_key}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            {selectedContent ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold w-full border-0 focus:outline-none focus:ring-0 p-0"
                    placeholder="Page Title"
                  />
                  <div className="text-sm text-gray-500 mt-2">
                    Key: {selectedContent.content_key}
                  </div>
                </div>

                <div className="p-6">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-[600px] border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Content (supports Markdown)"
                  />
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Last updated: {new Date(selectedContent.updated_at).toLocaleString()}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                Select a page to edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
