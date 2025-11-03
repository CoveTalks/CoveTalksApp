import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

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

export async function GET() {
  try {
    const prices: any = {
      Free: {
        name: 'Free',
        monthly: 0,
        yearly: 0,
        popular: false,
        features: [
          'Basic profile',
          '5 applications per month',
          'Basic search filters',
          'Email support'
        ]
      }
    }

    // Fetch actual prices from Stripe
    for (const [planName, periods] of Object.entries(PRICE_IDS)) {
      const monthlyPrice = await stripe.prices.retrieve(periods.Monthly)
      const yearlyPrice = await stripe.prices.retrieve(periods.Yearly)
      
      prices[planName] = {
        name: planName,
        monthly: (monthlyPrice.unit_amount || 0) / 100,
        yearly: (yearlyPrice.unit_amount || 0) / 100,
        popular: planName === 'Plus',
        monthlyPriceId: periods.Monthly,
        yearlyPriceId: periods.Yearly,
        features: getPlanFeatures(planName)
      }
    }

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Fetch prices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

function getPlanFeatures(planName: string): string[] {
  const features: { [key: string]: string[] } = {
    Standard: [
      'Everything in Free',
      'Unlimited applications',
      'Advanced search filters',
      'Priority support',
      'Featured profile badge',
      'Speaking opportunity alerts'
    ],
    Plus: [
      'Everything in Standard',
      'Priority listing',
      'Analytics dashboard',
      'Booking management tools',
      'Custom speaker tags',
      'Phone support'
    ],
    Premium: [
      'Everything in Plus',
      'Top search placement',
      'Dedicated account manager',
      'API access',
      'White-label options',
      'Premium opportunities'
    ]
  }
  
  return features[planName] || []
}