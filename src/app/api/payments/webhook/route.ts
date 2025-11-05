import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// Initialize Stripe client only when needed to avoid build-time errors
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
  })
}

// Get webhook secret only when needed
function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
  }
  return process.env.STRIPE_WEBHOOK_SECRET
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    const stripe = getStripeClient()
    const endpointSecret = getWebhookSecret()
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, sessionId, priceType } = session.metadata || {}

  if (!userId || !sessionId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Record the payment
  const { error: paymentError } = await supabase
    .from('payments_nw')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      type: priceType,
      metadata: {
        cv_session_id: sessionId,
        customer_email: session.customer_email
      }
    })

  if (paymentError) {
    console.error('Error recording payment:', paymentError)
  }

  // Unlock CV session
  if (priceType === 'one-time') {
    const { error: unlockError } = await supabase
      .from('auth_cv_sessions')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_type: 'one-time'
      })
      .eq('session_id', sessionId)

    if (unlockError) {
      console.error('Error unlocking CV session:', unlockError)
    }
  }

  // Handle subscription
  if (priceType === 'monthly') {
    const { error: subError } = await supabase
      .from('user_subscriptions_nw')
      .upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        status: 'active',
        plan_type: 'monthly',
        started_at: new Date().toISOString()
      })

    if (subError) {
      console.error('Error creating subscription:', subError)
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Update payment status
  const { error } = await supabase
    .from('payments_nw')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_intent', paymentIntent.id)

  if (error) {
    console.error('Error updating payment status:', error)
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string

  // Update subscription status
  const { error } = await supabase
    .from('user_subscriptions_nw')
    .update({
      status: 'active',
      last_payment_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription payment:', error)
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  // Mark subscription as cancelled
  const { error } = await supabase
    .from('user_subscriptions_nw')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error cancelling subscription:', error)
  }
}