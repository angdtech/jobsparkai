'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, Loader2, Save, Download, Check, XCircle, Lock, Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getChatUsage } from '@/lib/chat-usage'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
  cvUpdate?: any
  updateApplied?: boolean
}

interface CVChatbotProps {
  resumeData: any
  onClose: () => void
  onUpdateResume?: (data: any) => void
  onSaveResume?: (data: any) => Promise<void>
}

export function CVChatbot({ resumeData, onClose, onUpdateResume, onSaveResume }: CVChatbotProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your résumé assistant. I can help you:\n\n• Answer questions about your résumé\n• Suggest improvements to specific sections\n• Update your résumé content directly\n• Compare your résumé to a job description\n• Provide career advice\n\nJust ask me to update something like 'Change my job title to Senior Product Manager' or 'Make my summary more impactful'!"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatUsage, setChatUsage] = useState<{ used: number; limit: number; hasAccess: boolean; hasSubscription: boolean } | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en-US')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Track the latest resume data internally so AI always sees current state
  const latestResumeDataRef = useRef(resumeData)
  
  // Update ref whenever resumeData prop changes
  useEffect(() => {
    latestResumeDataRef.current = resumeData
  }, [resumeData])

  const LANGUAGE_OPTIONS = [
    { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
    { code: 'nl-NL', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
    { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
    { code: 'ar-SA', label: 'العربية', flag: '🇸🇦' }
  ]

  useEffect(() => {
    async function fetchUsage() {
      if (user?.id) {
        const usage = await getChatUsage(user.id)
        setChatUsage(usage)
        
        const { data } = await supabase
          .from('user_profiles')
          .select('language_preference')
          .eq('id', user.id)
          .single()
        
        if (data?.language_preference) {
          setCurrentLanguage(data.language_preference)
        }
      }
      setLoadingUsage(false)
    }
    fetchUsage()
  }, [user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const saveChat = () => {
    const chatContent = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`
    ).join('\n\n')
    
    const blob = new Blob([chatContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cv-chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const applyUpdate = async (messageIndex: number) => {
    const message = messages[messageIndex]
    if (message.cvUpdate && onUpdateResume && resumeData) {
      console.log('📝 Applying CV update:', message.cvUpdate)
      
      // Deep merge the update with existing resume data
      const mergedData = JSON.parse(JSON.stringify(resumeData)) // Deep clone
      
      console.log('🔍 BEFORE MERGE - Existing skills:', mergedData.skills)
      console.log('🔍 CV Update to apply:', message.cvUpdate)
      
      // Merge each top-level key
      Object.keys(message.cvUpdate).forEach(key => {
        if (Array.isArray(message.cvUpdate[key])) {
          // CRITICAL: Always append to existing arrays for skills, experience, awards, etc.
          // Never replace the entire array
          if (Array.isArray(mergedData[key])) {
            console.log(`📋 Merging array for ${key}. Existing count: ${mergedData[key].length}`)
            const updateArray = [...mergedData[key]]
            
            message.cvUpdate[key].forEach((newItem: any) => {
              // Check if item already exists
              let existingIndex = -1
              
              if (key === 'experience') {
                existingIndex = updateArray.findIndex((item: any) => 
                  item.id === newItem.id || 
                  (item.company === newItem.company && item.position === newItem.position) ||
                  item.company === newItem.company
                )
              } else if (key === 'skills') {
                // For skills, match by name (case-insensitive)
                existingIndex = updateArray.findIndex((item: any) => 
                  item.id === newItem.id || 
                  item.name?.toLowerCase() === newItem.name?.toLowerCase()
                )
              } else if (newItem.id) {
                existingIndex = updateArray.findIndex((item: any) => item.id === newItem.id)
              }
              
              if (existingIndex >= 0) {
                console.log(`♻️ Updating existing item in ${key} at index ${existingIndex}`)
                const existingItem = updateArray[existingIndex]
                if (key === 'experience' && newItem.description_items && existingItem.description_items) {
                  const mergedItems = [...existingItem.description_items]
                  newItem.description_items.forEach((newDesc: any) => {
                    const descText = typeof newDesc === 'string' ? newDesc : (newDesc?.text || String(newDesc))
                    if (!mergedItems.includes(descText)) {
                      mergedItems.push(descText)
                    }
                  })
                  updateArray[existingIndex] = { ...existingItem, ...newItem, description_items: mergedItems }
                } else {
                  updateArray[existingIndex] = { ...existingItem, ...newItem }
                }
              } else {
                console.log(`➕ Appending new item to ${key}:`, newItem)
                updateArray.push(newItem)
              }
            })
            
            mergedData[key] = updateArray
            console.log(`✅ AFTER MERGE - ${key} count: ${mergedData[key].length}`)
          } else {
            // No existing array, just use the new one
            console.log(`🆕 Creating new array for ${key}`)
            mergedData[key] = message.cvUpdate[key]
          }
        } else if (typeof message.cvUpdate[key] === 'object' && message.cvUpdate[key] !== null) {
          // For objects, deep merge properties
          mergedData[key] = { ...mergedData[key], ...message.cvUpdate[key] }
        } else {
          // For primitives, replace
          mergedData[key] = message.cvUpdate[key]
        }
      })
      
      console.log('🔍 AFTER MERGE - Final skills:', mergedData.skills)
      console.log('🔍 AFTER MERGE - Final skills count:', mergedData.skills?.length)
      
      if (message.cvUpdate.skills) {
        console.log('⚠️ Skills being added:', message.cvUpdate.skills)
        console.log('⚠️ Original skills count:', resumeData.skills?.length)
        console.log('⚠️ Merged skills count:', mergedData.skills?.length)
        
        // Check if any are truly new (not duplicates)
        const newSkills = message.cvUpdate.skills.filter((newSkill: any) => 
          !resumeData.skills?.some((existing: any) => 
            existing.name?.toLowerCase() === newSkill.name?.toLowerCase()
          )
        )
        console.log('⚠️ Truly new skills (not duplicates):', newSkills.length)
      }
      
      console.log('📝 Merged resume data:', mergedData)
      console.log('📝 Original resume data:', resumeData)
      
      // Update the latest resume data ref so next AI call sees the changes
      latestResumeDataRef.current = mergedData
      
      onUpdateResume(mergedData)
      
      // Immediately save to database to prevent data loss
      if (onSaveResume) {
        console.log('💾 Immediately saving to database...')
        await onSaveResume(mergedData)
      }
      
      // Mark as applied
      const updatedMessages = [...messages]
      updatedMessages[messageIndex] = { ...message, updateApplied: true }
      setMessages(updatedMessages)
      
      // Ask user if they want the next fix
      const askForNext: Message = {
        role: 'assistant',
        content: 'Great! Ready for the next fix?'
      }
      setMessages([...updatedMessages, askForNext])
      
      // Wait for user to say "yes", "next", "continue", etc. - no automatic API call
      // The handleSend will trigger when user responds
      
      /*
      setTimeout(async () => {
        const followUpMessage: Message = { role: 'user', content: 'Applied! What\'s next?' }
        const newMessages = [...updatedMessages, followUpMessage]
        // Don't add the follow-up message to visible messages - just use it for context
        setIsLoading(true)
        
        try {
          const recentMessages = newMessages.slice(-5)
          
          const response = await fetch('/api/cv/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: recentMessages,
              resumeData: mergedData,
              canUpdateCV: !!onUpdateResume,
              userId: user?.id
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            // Add only the AI response to visible messages, not the hidden "Applied! What's next?"
            setMessages(updatedMessages => [...updatedMessages, {
              role: 'assistant',
              content: data.message,
              cvUpdate: data.cvUpdate
            }])
            
            if (user?.id && chatUsage && !chatUsage.hasSubscription) {
              const newUsed = chatUsage.used + 1
              setChatUsage({
                ...chatUsage,
                used: newUsed,
                hasAccess: newUsed < chatUsage.limit
              })
            }
          }
        } catch (error) {
          console.error('Error getting follow-up:', error)
        } finally {
          setIsLoading(false)
        }
      }, 500)
      */
    }
  }

  const rejectUpdate = async (messageIndex: number) => {
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], cvUpdate: undefined }
    setMessages(updatedMessages)
    
    // DISABLED: No automatic alternative - user can manually ask if they want a different approach
    /*
    setTimeout(async () => {
      const followUpMessage: Message = { role: 'user', content: 'I don\'t like that change. Can you suggest a different approach?' }
      const newMessages = [...updatedMessages, followUpMessage]
      // Don't add the follow-up message to visible messages - just use it for context
      setIsLoading(true)
      
      try {
        const recentMessages = newMessages.slice(-5)
        
        const response = await fetch('/api/cv/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: recentMessages,
            resumeData,
            canUpdateCV: !!onUpdateResume,
            userId: user?.id
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          // Add only the AI response to visible messages, not the hidden rejection message
          setMessages(updatedMessages => [...updatedMessages, {
            role: 'assistant',
            content: data.message,
            cvUpdate: data.cvUpdate
          }])
          
          if (user?.id && chatUsage && !chatUsage.hasSubscription) {
            const newUsed = chatUsage.used + 1
            setChatUsage({
              ...chatUsage,
              used: newUsed,
              hasAccess: newUsed < chatUsage.limit
            })
          }
        }
      } catch (error) {
        console.error('Error getting alternative:', error)
      } finally {
        setIsLoading(false)
      }
    }, 500)
    */
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Wait for usage to load if still loading
    if (loadingUsage) {
      return
    }

    // Check if user has access (subscription or free chats remaining)
    if (!chatUsage?.hasAccess) {
      setMessages(prev => [...prev, {
        role: 'user',
        content: input
      }, {
        role: 'assistant',
        content: 'You\'ve used your 2 free trial messages. Subscribe for £5/month to get unlimited AI Resume Assistant access with fast analysis and updates!'
      }])
      setInput('')
      return
    }

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Only send last 5 messages to avoid token limit (each message + resumeData can be large)
      const recentMessages = [...messages, userMessage].slice(-5)
      
      console.log('🚀 SENDING TO AI - Skills count:', latestResumeDataRef.current?.skills?.length)
      console.log('🚀 SENDING TO AI - Skills:', latestResumeDataRef.current?.skills?.map((s: any) => s.name))
      
      const response = await fetch('/api/cv/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          resumeData: latestResumeDataRef.current,
          canUpdateCV: !!onUpdateResume,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || `Failed to get response: ${response.status}`
        throw new Error(errorMsg)
      }

      const data = await response.json()
      
      console.log('📨 Full API response:', data)
      console.log('📝 CV Update data:', data.cvUpdate)
      console.log('📝 Has cvUpdate?', !!data.cvUpdate)
      
      // Always show update buttons if AI provided CV update tags
      // OR if response contains improvement suggestions
      let cvUpdate = data.cvUpdate
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        cvUpdate: cvUpdate
      }
      
      console.log('📨 Assistant message object:', assistantMessage)
      
      setMessages(prev => [...prev, assistantMessage])

      if (user?.id && chatUsage && !chatUsage.hasSubscription) {
        const newUsed = chatUsage.used + 1
        setChatUsage({
          ...chatUsage,
          used: newUsed,
          hasAccess: newUsed < chatUsage.limit
        })
      }

      if (data.cvUpdate) {
        console.log('✅ CV update received, waiting for user to accept', data.cvUpdate)
      } else {
        console.log('⚠️ No CV update received in response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Résumé Assistant</h3>
          <div className="flex items-center space-x-3">
            <p className="text-xs text-blue-100">Ask questions or request résumé updates</p>
            {chatUsage?.hasSubscription && (
              <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Premium</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
              title="Change AI language"
            >
              <Globe className="h-4 w-4" />
            </button>
            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1 max-h-64 overflow-y-auto">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={async () => {
                        setCurrentLanguage(lang.code)
                        setShowLanguageMenu(false)
                        if (user?.id) {
                          await supabase
                            .from('user_profiles')
                            .update({ language_preference: lang.code })
                            .eq('id', user.id)
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                        currentLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                      {currentLanguage === lang.code && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={saveChat}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
            title="Save chat history"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
            title="Close assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* CV Update Actions */}
              {message.cvUpdate && !message.updateApplied && (
                <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 rounded p-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => applyUpdate(index)}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                    >
                      <Check className="h-3 w-3" />
                      <span>Accept Changes</span>
                    </button>
                    <button
                      onClick={() => rejectUpdate(index)}
                      className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {message.updateApplied && (
                <div className="mt-2 pt-2 border-t border-green-200 bg-green-50 rounded p-2">
                  <p className="text-xs text-green-700 font-medium">✓ Changes Applied to CV</p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        {!chatUsage?.hasAccess && chatUsage && (
          <div className="mb-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Unlock Unlimited AI Resume Assistant</p>
                <p className="text-xs text-gray-600">Get fast CV analysis and unlimited chat for £5/month</p>
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        )}
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setInput('Scan my resume and give me a comprehensive analysis')}
            className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors"
            disabled={isLoading}
          >
            Scan my Resume
          </button>
          <button
            onClick={() => setInput('Compare my resume to this job description: ')}
            className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-full border border-green-200 transition-colors"
            disabled={isLoading}
          >
            Compare to Job Description
          </button>
          <button
            onClick={() => setInput('Help me improve my professional summary')}
            className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200 transition-colors"
            disabled={isLoading}
          >
            Improve Summary
          </button>
        </div>
        
        <div className="flex space-x-2 mb-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything or request CV updates..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Press Enter to send • Shift+Enter for new line
          </p>
          <button
            onClick={saveChat}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <Save className="h-3 w-3" />
            <span>Save Chat</span>
          </button>
        </div>
      </div>
    </div>
  )
}
