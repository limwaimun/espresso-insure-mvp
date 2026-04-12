import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { plan, email, name } = await request.json()

    if (!plan || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, email, name' },
        { status: 400 }
      )
    }

    // Determine price ID based on plan
    let priceId: string
    switch (plan) {
      case 'pro':
        priceId = process.env.STRIPE_PRO_PRICE_ID!
        break
      case 'team':
        priceId = process.env.STRIPE_TEAM_PRICE_ID!
        break
      default:
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/trial`,
      customer_email: email,
      metadata: {
        customer_name: name,
        plan,
      },
      subscription_data: {
        metadata: {
          customer_name: name,
          customer_email: email,
          plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}