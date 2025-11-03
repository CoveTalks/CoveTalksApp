import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { customerId } = await request.json()

    // Get or create Stripe customer if not provided
    if (!customerId) {
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
        
        customerId = customer.id
        
        // Save customer ID to database
        await supabase
          .from('members')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      } else {
        customerId = member.stripe_customer_id
      }
    }

    // Create checkout session for setup
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
      setup_intent_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Create setup intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}