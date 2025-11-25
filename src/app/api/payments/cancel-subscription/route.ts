import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

function getStripeClient() {
  const secretKey = process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY
  
  if (!secretKey) {
    throw new Error('Missing Stripe secret key environment variable')
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil'
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const stripe = getStripeClient()
    
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true }
    )

    return NextResponse.json({ 
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAt: subscription.cancel_at
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
