import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function POST(request: NextRequest) {
  try {
    const { priceType, sessionId, userId } = await request.json()

    if (!priceType || !sessionId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Define prices
    const prices = {
      'one-time': {
        mode: 'payment' as const,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cv/${sessionId}?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cv/${sessionId}?payment=cancelled`,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'CV Analysis & Optimization',
                description: 'Complete AI analysis, recommendations, and professional templates',
              },
              unit_amount: 500, // $5.00
            },
            quantity: 1,
          },
        ],
      },
      'monthly': {
        mode: 'subscription' as const,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?subscription=cancelled`,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Unlimited CV Optimization',
                description: 'Monthly subscription for unlimited CV improvements and updates',
              },
              unit_amount: 500, // $5.00 per month
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1,
          },
        ],
      }
    }

    const selectedPrice = prices[priceType as keyof typeof prices]
    if (!selectedPrice) {
      return NextResponse.json({ error: 'Invalid price type' }, { status: 400 })
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      ...selectedPrice,
      metadata: {
        userId,
        sessionId,
        priceType
      },
      billing_address_collection: 'required',
      payment_intent_data: priceType === 'one-time' ? {
        metadata: {
          userId,
          sessionId,
          priceType
        }
      } : undefined,
      subscription_data: priceType === 'monthly' ? {
        metadata: {
          userId,
          priceType
        }
      } : undefined
    })

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })

  } catch (error) {
    console.error('Stripe checkout creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}