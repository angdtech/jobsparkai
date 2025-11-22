import { supabase } from './supabase'

export async function getChatUsage(userId: string): Promise<{
  used: number
  limit: number
  hasAccess: boolean
  hasSubscription: boolean
}> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('chat_responses_used, free_chat_limit, subscription_status')
    .eq('id', userId)
    .single()

  // If error or no data, give them access (new user)
  if (error || !data) {
    console.log('No user profile found or error, granting access:', error?.message)
    return { used: 0, limit: 2, hasAccess: true, hasSubscription: false }
  }

  const hasSubscription = data.subscription_status === 'active'
  const used = data.chat_responses_used || 0
  const limit = data.free_chat_limit || 2

  console.log('Chat usage check:', { used, limit, hasSubscription, hasAccess: hasSubscription || used < limit })

  return {
    used,
    limit,
    hasAccess: hasSubscription || used < limit,
    hasSubscription
  }
}

export async function incrementChatUsage(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_chat_usage', {
    user_id: userId
  })

  if (error) {
    console.error('Error incrementing chat usage:', error)
  }
}

export async function createIncrementChatUsageFunction(): Promise<void> {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION increment_chat_usage(user_id UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE user_profiles
        SET chat_responses_used = COALESCE(chat_responses_used, 0) + 1,
            updated_at = NOW()
        WHERE id = user_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  })

  if (error) {
    console.error('Error creating increment function:', error)
  }
}
