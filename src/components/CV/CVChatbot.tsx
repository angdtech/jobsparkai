'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, Loader2, Save, Download, Check, XCircle } from 'lucide-react'

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
}

export function CVChatbot({ resumeData, onClose, onUpdateResume }: CVChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your CV assistant. I can help you:\n\n• Answer questions about your resume\n• Suggest improvements to specific sections\n• Update your CV content directly\n• Provide career advice\n\nJust ask me to update something like 'Change my job title to Senior Product Manager' or 'Make my summary more impactful'!"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const applyUpdate = (messageIndex: number) => {
    const message = messages[messageIndex]
    if (message.cvUpdate && onUpdateResume && resumeData) {
      console.log('📝 Applying CV update:', message.cvUpdate)
      
      // Deep merge the update with existing resume data
      const mergedData = JSON.parse(JSON.stringify(resumeData)) // Deep clone
      
      // Merge each top-level key
      Object.keys(message.cvUpdate).forEach(key => {
        if (Array.isArray(message.cvUpdate[key])) {
          // For arrays, append new items
          if (Array.isArray(mergedData[key])) {
            mergedData[key] = [...mergedData[key], ...message.cvUpdate[key]]
          } else {
            mergedData[key] = message.cvUpdate[key]
          }
        } else if (typeof message.cvUpdate[key] === 'object' && message.cvUpdate[key] !== null) {
          // For objects, merge properties
          mergedData[key] = { ...mergedData[key], ...message.cvUpdate[key] }
        } else {
          // For primitives, replace
          mergedData[key] = message.cvUpdate[key]
        }
      })
      
      console.log('📝 Merged resume data:', mergedData)
      onUpdateResume(mergedData)
      
      // Mark as applied
      const updatedMessages = [...messages]
      updatedMessages[messageIndex] = { ...message, updateApplied: true }
      setMessages(updatedMessages)
    }
  }

  const rejectUpdate = (messageIndex: number) => {
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], cvUpdate: undefined }
    setMessages(updatedMessages)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/cv/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          resumeData,
          canUpdateCV: !!onUpdateResume
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      console.log('📨 Full API response:', data)
      console.log('📝 CV Update data:', data.cvUpdate)
      console.log('📝 Has cvUpdate?', !!data.cvUpdate)
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        cvUpdate: data.cvUpdate
      }
      
      console.log('📨 Assistant message object:', assistantMessage)
      
      setMessages(prev => [...prev, assistantMessage])

      if (data.cvUpdate) {
        console.log('✅ CV update received, waiting for user to accept', data.cvUpdate)
      } else {
        console.log('⚠️ No CV update received in response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
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
        <div>
          <h3 className="font-semibold text-lg">CV Assistant</h3>
          <p className="text-xs text-blue-100">Powered by GPT-4.1-mini • Can update your CV</p>
        </div>
        <div className="flex items-center space-x-2">
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
                  <p className="text-xs text-blue-700 font-medium mb-2">💡 CV Update Ready</p>
                  
                  {/* Show preview of changes */}
                  <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Changes to apply:</p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(message.cvUpdate, null, 2)}
                    </pre>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">Would you like to apply these changes to your CV?</p>
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
