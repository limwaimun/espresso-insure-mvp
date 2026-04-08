import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-03-31.basil',
});

// Price IDs from Stripe dashboard
// Replace these with your actual Stripe price IDs
const PRICE_IDS = {
  solo: process.env.STRIPE_PRICE_SOLO || 'price_solo_id_from_stripe',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_id_from_stripe',
  team: process.env.STRIPE_PRICE_TEAM || 'price_team_id_from_stripe',
};

export async function POST(req: Request) {
  try {
    const { plan, email, name } = await req.json();
    
    // Validate required fields
    if (!plan || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate plan type
    if (!(plan in PRICE_IDS)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/confirmed`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/trial`,
      metadata: { 
        name, 
        plan,
        signup_date: new Date().toISOString(),
      },
      subscription_data: {
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });
    
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Return user-friendly error message
    return NextResponse.json(
      { error: 'Unable to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}

// Add CORS headers for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}