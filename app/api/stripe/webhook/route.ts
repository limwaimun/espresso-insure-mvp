import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const supabase = await createClient()

        // Create or update user in Supabase
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            email: session.customer_email,
            name: session.metadata?.customer_name,
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            plan: session.metadata?.plan || 'pro',
            subscription_id: session.subscription as string,
          })

        if (userError) {
          console.error('Error creating user:', userError)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const supabase = await createClient()

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            plan: subscription.metadata?.plan || 'pro',
          })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) {
          console.error('Error updating subscription:', error)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const supabase = await createClient()

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
          })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) {
          console.error('Error canceling subscription:', error)
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}