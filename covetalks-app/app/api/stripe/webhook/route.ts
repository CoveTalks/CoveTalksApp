// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { supabase_user_id, plan_type, billing_period } = session.metadata!

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        
        // Create or update subscription in database
        await supabase
          .from('subscriptions')
          .upsert({
            member_id: supabase_user_id,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            plan_type: plan_type,
            billing_period: billing_period,
            status: 'Active',
            amount: subscription.items.data[0].price.unit_amount! / 100,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_subscription_id'
          })
        
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Create payment record
        await supabase
          .from('payments')
          .insert({
            member_id: invoice.metadata?.supabase_user_id,
            stripe_invoice_id: invoice.id,
            stripe_charge_id: invoice.charge as string,
            amount: invoice.amount_paid / 100,
            status: 'Succeeded',
            description: invoice.description || 'Subscription payment',
            invoice_url: invoice.hosted_invoice_url,
            receipt_url: invoice.receipt_url,
            payment_date: new Date(invoice.created * 1000).toISOString(),
            card_last4: invoice.payment_intent?.payment_method_details?.card?.last4,
            card_brand: invoice.payment_intent?.payment_method_details?.card?.brand,
          })
        
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'Active' : 
                   subscription.status === 'canceled' ? 'Cancelled' : 
                   subscription.status === 'past_due' ? 'Past_due' : 'Active',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Mark subscription as ended
        await supabase
          .from('subscriptions')
          .update({
            status: 'Cancelled',
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}