// app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Use compatible API version (2023-10-16 is stable and widely supported)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

// Price IDs from your Stripe dashboard
const PRICE_IDS = {
  Standard: {
    Monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY!,
    Yearly: process.env.STRIPE_PRICE_STANDARD_YEARLY!,
  },
  Plus: {
    Monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY!,
    Yearly: process.env.STRIPE_PRICE_PLUS_YEARLY!,
  },
  Premium: {
    Monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
    Yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planType, billingPeriod, customerId } = await request.json()

    // Get or create Stripe customer
    let stripeCustomerId = customerId
    
    if (!stripeCustomerId) {
      // Get member details
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!member?.stripe_customer_id) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: member?.email,
          name: member?.name,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        
        stripeCustomerId = customer.id
        
        // Save customer ID to database
        await supabase
          .from('members')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', user.id)
      } else {
        stripeCustomerId = member.stripe_customer_id
      }
    }

    // Create checkout session
    const priceId = PRICE_IDS[planType as keyof typeof PRICE_IDS][billingPeriod as 'Monthly' | 'Yearly']
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
        billing_period: billingPeriod,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}