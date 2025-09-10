'use client'

import React, { useState } from 'react'
import { GitHubIntegration } from '@/lib/github'

export default function GitHubIntegrationComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastCommit, setLastCommit] = useState<string | null>(null)

  const handlePushUpdate = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      // Initialize GitHub integration with angdtech account
      const github = new GitHubIntegration({
        owner: 'angdtech', // Replace with actual angdtech username
        repo: 'jobspark-ai', // Replace with actual repository name
        token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '', // This should be set in environment
      })

      // Create a sample update - you can modify this to push actual updates
      const updateContent = JSON.stringify({
        timestamp: new Date().toISOString(),
        users: {
          total: 0, // This would come from your Supabase database
          active: 0,
        },
        version: '1.0.0',
        status: 'active'
      }, null, 2)

      const result = await github.createCommit({
        message: `Update JobSpark AI status - ${new Date().toISOString()}`,
        content: updateContent,
        path: 'status/latest.json',
        branch: 'main'
      })

      setLastCommit(result.object?.sha || 'Success')
      setMessage('Successfully pushed update to GitHub!')
    } catch (error) {
      console.error('GitHub push failed:', error)
      setMessage(`Failed to push update: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">GitHub Integration</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Push updates to the angdtech GitHub repository</p>
          <p className="mt-2">Repository: angdtech/jobspark-ai</p>
        </div>

        {lastCommit && (
          <div className="text-sm">
            <p className="text-gray-700">Last commit: </p>
            <p className="font-mono text-xs text-gray-600 break-all">{lastCommit}</p>
          </div>
        )}

        <button
          onClick={handlePushUpdate}
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? 'Pushing to GitHub...' : 'Push Update to GitHub'}
        </button>

        {message && (
          <div className={`text-sm p-3 rounded ${
            message.includes('Success') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}