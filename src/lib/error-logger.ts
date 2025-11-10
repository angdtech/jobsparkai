import { supabase } from '@/lib/supabase'

export interface ErrorLogData {
  errorMessage: string
  errorStack?: string
  errorType?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export async function logError(data: ErrorLogData) {
  try {
    const { error } = await supabase
      .from('error_logs')
      .insert({
        error_message: data.errorMessage,
        error_stack: data.errorStack || null,
        error_type: data.errorType || 'UnknownError',
        user_id: data.userId || null,
        session_id: data.sessionId || null,
        url: data.url || (typeof window !== 'undefined' ? window.location.href : null),
        user_agent: data.userAgent || (typeof window !== 'undefined' ? navigator.userAgent : null),
        severity: data.severity || 'error',
        metadata: data.metadata || null
      })

    if (error) {
      console.error('Failed to log error to Supabase:', error)
    }
  } catch (err) {
    console.error('Error logging system failed:', err)
  }
}

export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    logError({
      errorMessage: event.message,
      errorStack: event.error?.stack,
      errorType: event.error?.name || 'Error',
      severity: 'high',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logError({
      errorMessage: event.reason?.message || String(event.reason),
      errorStack: event.reason?.stack,
      errorType: 'UnhandledPromiseRejection',
      severity: 'high',
      metadata: {
        reason: event.reason
      }
    })
  })
}
