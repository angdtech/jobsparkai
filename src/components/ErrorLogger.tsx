'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/lib/error-logger'

export function ErrorLogger() {
  useEffect(() => {
    setupGlobalErrorHandler()
  }, [])

  return null
}
