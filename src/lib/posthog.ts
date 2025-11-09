import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const isEnabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== 'false'
    
    // Only initialize if key is provided and enabled
    if (posthogKey && posthogKey.length > 0 && isEnabled) {
      posthog.init(posthogKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug()
        }
      })
    }
  }
}

export { posthog }
