import { supabase } from './supabase'

export interface TrackInteractionParams {
  interactionType: string
  inputText?: string
  metadata?: Record<string, unknown>
}

export async function trackUserInteraction({
  interactionType,
  inputText,
  metadata,
}: TrackInteractionParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const interaction = {
      auth_user_id: user?.id || null,
      user_email: user?.email || null,
      user_name: user?.user_metadata?.full_name || null,
      interaction_type: interactionType,
      input_text: inputText || null,
      metadata: metadata || null,
    }

    const { error } = await supabase
      .from('user_interactions')
      .insert(interaction)

    if (error) {
      console.error('Error tracking interaction:', error)
    }
  } catch (error) {
    console.error('Error tracking interaction:', error)
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  
  if (!profile) return false
  
  // Check if subscription is active
  if (profile.subscription_status === 'active') {
    return true
  }
  
  // Check if trial is still valid
  if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at)
    return trialEnd > new Date()
  }
  
  return false
}
