'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  const router = useRouter()
  const [content, setContent] = useState<{ title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('title, content')
      .eq('content_key', 'terms_of_service')
      .single()

    if (!error && data) {
      setContent(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            {content?.title || 'Terms of Service'}
          </h1>
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {content?.content || 'Content not available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
