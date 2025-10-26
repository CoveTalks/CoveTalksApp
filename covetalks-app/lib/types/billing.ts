// lib/types/billing.ts

export type PlanType = 'Free' | 'Standard' | 'Plus' | 'Premium'
export type BillingPeriod = 'Monthly' | 'Yearly'
export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Past_due' | 'Paused' | 'Trialing'
export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Refunded'

export interface Subscription {
  id: string
  member_id: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  plan_type: PlanType
  billing_period: BillingPeriod
  status: SubscriptionStatus
  amount: number
  currency: string
  start_date: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at?: string | null
  ended_at?: string | null
  trial_ends_at?: string | null
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  member_id: string
  subscription_id?: string
  stripe_payment_intent_id?: string
  stripe_invoice_id?: string
  stripe_charge_id?: string
  amount: number
  currency: string
  status: PaymentStatus
  description?: string
  payment_method_type?: string
  card_last4?: string
  card_brand?: string
  invoice_url?: string
  receipt_url?: string
  payment_date: string
  metadata?: Record<string, any>
  created_at: string
}

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
  created?: number
  customer?: string
  name?: string
  country?: string
  funding?: string
  wallet?: any
}

export interface Plan {
  name: string
  monthly: number
  yearly: number
  features: string[]
  popular?: boolean
  description?: string
  stripePriceIds?: {
    monthly: string
    yearly: string
  }
}

export interface PlanDetails {
  [key: string]: Plan
}

export interface BillingAddress {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface TaxInfo {
  tax_id?: string
  tax_id_type?: string
  tax_exempt?: boolean
  tax_rate?: number
}

export interface Invoice {
  id: string
  amount_due: number
  amount_paid: number
  currency: string
  customer: string
  description?: string
  due_date?: string
  hosted_invoice_url?: string
  invoice_pdf?: string
  lines: InvoiceLineItem[]
  number?: string
  paid: boolean
  payment_intent?: string
  period_end: string
  period_start: string
  receipt_number?: string
  status?: string
  subtotal: number
  tax?: number
  total: number
  created: number
}

export interface InvoiceLineItem {
  id: string
  amount: number
  currency: string
  description?: string
  period: {
    start: number
    end: number
  }
  price: {
    id: string
    product: string
    unit_amount: number
    recurring?: {
      interval: string
      interval_count: number
    }
  }
  quantity: number
}

export interface CheckoutSessionData {
  planType: PlanType
  billingPeriod: BillingPeriod
  customerId?: string
  successUrl?: string
  cancelUrl?: string
  allowPromotionCodes?: boolean
  metadata?: Record<string, any>
}

export interface SetupIntentData {
  customerId: string
  paymentMethodTypes?: string[]
  usage?: 'on_session' | 'off_session'
  metadata?: Record<string, any>
}

export interface SubscriptionUpdateData {
  subscriptionId: string
  priceId?: string
  quantity?: number
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, any>
  paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'pending_if_incomplete' | 'allow_incomplete'
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
}

export interface CustomerPortalData {
  customerId: string
  returnUrl: string
  configuration?: string
}

// Stripe webhook event types
export type StripeWebhookEvent = 
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.paused'
  | 'customer.subscription.resumed'
  | 'customer.subscription.trial_will_end'
  | 'invoice.created'
  | 'invoice.finalized'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'
  | 'invoice.sent'
  | 'invoice.upcoming'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'payment_method.updated'
  | 'setup_intent.succeeded'
  | 'setup_intent.setup_failed'

// Response types for API endpoints
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CheckoutResponse {
  url?: string
  sessionId?: string
  error?: string
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[]
  defaultPaymentMethodId?: string
}

export interface BillingHistoryResponse {
  payments: Payment[]
  hasMore: boolean
  nextCursor?: string
}

export interface SubscriptionResponse {
  subscription: Subscription
  canUpgrade: boolean
  canDowngrade: boolean
  availablePlans: PlanType[]
}

// Utility types
export type PriceInterval = 'month' | 'year' | 'week' | 'day'

export interface Price {
  id: string
  active: boolean
  currency: string
  product: string
  unit_amount: number
  recurring?: {
    interval: PriceInterval
    interval_count: number
    trial_period_days?: number
  }
}

export interface Product {
  id: string
  name: string
  description?: string
  active: boolean
  metadata?: Record<string, any>
  prices?: Price[]
}

// Form types
export interface BillingFormData {
  planType: PlanType
  billingPeriod: BillingPeriod
  paymentMethodId?: string
  promoCode?: string
}

export interface PaymentMethodFormData {
  cardNumber: string
  expMonth: string
  expYear: string
  cvc: string
  name: string
  country: string
  zip?: string
}

// Error types
export interface BillingError {
  code: string
  message: string
  details?: any
}

// Constants
export const PLAN_FEATURES = {
  Free: [
    'Basic profile',
    '5 applications per month',
    'Basic search filters',
    'Email support'
  ],
  Standard: [
    'Everything in Free',
    'Unlimited applications',
    'Advanced search filters',
    'Priority support',
    'Featured profile badge',
    'Speaking opportunity alerts',
    '1 on 1 coaching (one session)'
  ],
  Plus: [
    'Everything in Standard',
    'Priority listing',
    'Analytics dashboard',
    'Booking management tools',
    'Custom speaker tags',
    'Phone support',
    'One additional coaching session'
  ],
  Premium: [
    'Everything in Plus',
    'Top search placement',
    'Dedicated account manager',
    'API access',
    'White-label options',
    'Premium opportunities',
    'Unlimited coaching sessions'
  ]
} as const

export const PLAN_PRICES = {
  Free: { monthly: 0, yearly: 0 },
  Standard: { monthly: 97, yearly: 997 },
  Plus: { monthly: 147, yearly: 1497 },
  Premium: { monthly: 197, yearly: 1997 }
} as const

export const PLAN_DESCRIPTIONS = {
  Free: 'Perfect for getting started',
  Standard: 'Great for active speakers',
  Plus: 'Best for professional speakers',
  Premium: 'Everything you need to scale'
} as const