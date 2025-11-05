'use client'

import { useState } from 'react'
import { Send, Loader } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExperienceChatbotProps {
  onAddExperience: (experience: any) => void
}

export function ExperienceChatbot({ onAddExperience }: ExperienceChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Tell me about your recent work experience. Include: job title, company, dates, and what you did.'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/cv/format-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMessage })
      })

      const data = await response.json()

      if (data.experience) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Great! I've formatted your experience:\n\n**${data.experience.position}** at ${data.experience.company}\n${data.experience.duration}\n\nResponsibilities:\n${data.experience.description_items.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}\n\nClick "Add to CV" below to add this.`
          }
        ])

        onAddExperience(data.experience)
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.message || 'Could you provide more details?' }
        ])
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error processing your message. Please try again.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Loader className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Describe your work experience..."
          className="flex-1 px-3 py-2 border rounded-lg"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
