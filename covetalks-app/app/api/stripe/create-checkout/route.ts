// app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
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
    const supabase = createClient()
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

// app/api/stripe/cancel-subscription/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId } = await request.json()

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('member_id', user.id)

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

// app/api/stripe/reactivate-subscription/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId } = await request.json()

    // Reactivate the subscription
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        cancelled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('member_id', user.id)

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}

// app/api/stripe/payment-methods/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
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

// app/api/stripe/create-setup-intent/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId } = await request.json()

    // Create setup intent for adding new payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        supabase_user_id: user.id,
      },
    })

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

// app/api/stripe/remove-payment-method/route.ts
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await request.json()

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    )
  }
}

// app/api/stripe/set-default-payment-method/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId, customerId } = await request.json()

    // Update customer's default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set default payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 }
    )
  }
}

// app/api/stripe/webhook/route.ts
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
            card_last4: invoice.payment_method_details?.card?.last4,
            card_brand: invoice.payment_method_details?.card?.brand,
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