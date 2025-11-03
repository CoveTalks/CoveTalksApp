// app/api/stripe/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get member's Stripe customer ID
    const { data: member } = await supabase
      .from('members')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!member?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: member.stripe_customer_id,
      type: 'card',
    })

    // Get default payment method
    const customer = await stripe.customers.retrieve(member.stripe_customer_id)
    const defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method

    // Format payment methods
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '',
      exp_month: pm.card?.exp_month || 0,
      exp_year: pm.card?.exp_year || 0,
      is_default: pm.id === defaultPaymentMethodId,
    }))

    return NextResponse.json({ paymentMethods: formattedMethods })
  } catch (error) {
    console.error('Get payment methods error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment methods' },
      { status: 500 }
    )
  }
}