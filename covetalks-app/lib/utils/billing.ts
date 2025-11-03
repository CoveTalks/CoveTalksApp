// lib/utils/billing.ts

import { PlanType, BillingPeriod, Subscription, PLAN_PRICES, PLAN_FEATURES } from '@/lib/types/billing'

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculate savings for yearly billing
 */
export function calculateYearlySavings(monthlyPrice: number): number {
  const yearlyWithoutDiscount = monthlyPrice * 12
  const yearlyPrice = PLAN_PRICES[getPlanFromMonthlyPrice(monthlyPrice) as keyof typeof PLAN_PRICES]?.yearly || 0
  return yearlyWithoutDiscount - yearlyPrice
}

/**
 * Get plan type from monthly price
 */
function getPlanFromMonthlyPrice(price: number): PlanType {
  for (const [plan, prices] of Object.entries(PLAN_PRICES)) {
    if (prices.monthly === price) {
      return plan as PlanType
    }
  }
  return 'Free'
}

/**
 * Calculate percentage savings for yearly billing
 */
export function calculateSavingsPercentage(plan: PlanType): number {
  const prices = PLAN_PRICES[plan]
  if (prices.monthly === 0) return 0
  
  const yearlyWithoutDiscount = prices.monthly * 12
  const savings = yearlyWithoutDiscount - prices.yearly
  return Math.round((savings / yearlyWithoutDiscount) * 100)
}

/**
 * Get plan price based on billing period
 */
export function getPlanPrice(plan: PlanType, period: BillingPeriod): number {
  const prices = PLAN_PRICES[plan]
  return period === 'Yearly' ? prices.yearly : prices.monthly
}

/**
 * Format billing period for display
 */
export function formatBillingPeriod(period: BillingPeriod): string {
  return period === 'Yearly' ? 'per year' : 'per month'
}

/**
 * Check if user can upgrade to a plan
 */
export function canUpgradeToPlan(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const planHierarchy: PlanType[] = ['Free', 'Standard', 'Plus', 'Premium']
  const currentIndex = planHierarchy.indexOf(currentPlan)
  const targetIndex = planHierarchy.indexOf(targetPlan)
  return targetIndex > currentIndex
}

/**
 * Check if user can downgrade to a plan
 */
export function canDowngradeToPlan(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const planHierarchy: PlanType[] = ['Free', 'Standard', 'Plus', 'Premium']
  const currentIndex = planHierarchy.indexOf(currentPlan)
  const targetIndex = planHierarchy.indexOf(targetPlan)
  return targetIndex < currentIndex && targetIndex > 0 // Can't downgrade to Free
}

/**
 * Get available upgrade options
 */
export function getUpgradeOptions(currentPlan: PlanType): PlanType[] {
  const planHierarchy: PlanType[] = ['Free', 'Standard', 'Plus', 'Premium']
  const currentIndex = planHierarchy.indexOf(currentPlan)
  return planHierarchy.slice(currentIndex + 1)
}

/**
 * Get available downgrade options
 */
export function getDowngradeOptions(currentPlan: PlanType): PlanType[] {
  const planHierarchy: PlanType[] = ['Free', 'Standard', 'Plus', 'Premium']
  const currentIndex = planHierarchy.indexOf(currentPlan)
  return planHierarchy.slice(1, currentIndex) // Exclude Free plan
}

/**
 * Calculate prorated amount for plan change
 */
export function calculateProratedAmount(
  currentPlan: PlanType,
  newPlan: PlanType,
  daysRemaining: number,
  billingPeriod: BillingPeriod
): number {
  const currentPrice = getPlanPrice(currentPlan, billingPeriod)
  const newPrice = getPlanPrice(newPlan, billingPeriod)
  
  const daysInPeriod = billingPeriod === 'Yearly' ? 365 : 30
  const dailyCurrentPrice = currentPrice / daysInPeriod
  const dailyNewPrice = newPrice / daysInPeriod
  
  const currentPlanCredit = dailyCurrentPrice * daysRemaining
  const newPlanCost = dailyNewPrice * daysRemaining
  
  return Math.max(0, newPlanCost - currentPlanCredit)
}

/**
 * Get days remaining in subscription period
 */
export function getDaysRemaining(subscription: Subscription): number {
  const now = new Date()
  const periodEnd = new Date(subscription.current_period_end)
  const diffTime = Math.abs(periodEnd.getTime() - now.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: Subscription['status']): {
  label: string
  color: string
  icon?: string
} {
  const statusMap = {
    Active: { label: 'Active', color: 'green', icon: 'check-circle' },
    Cancelled: { label: 'Cancelled', color: 'red', icon: 'x-circle' },
    Past_due: { label: 'Past Due', color: 'yellow', icon: 'alert-circle' },
    Paused: { label: 'Paused', color: 'gray', icon: 'pause-circle' },
    Trialing: { label: 'Trial', color: 'blue', icon: 'clock' },
  }
  
  return statusMap[status] || { label: status, color: 'gray' }
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false
  return subscription.status === 'Active' || subscription.status === 'Trialing'
}

/**
 * Check if subscription will renew
 */
export function willSubscriptionRenew(subscription: Subscription | null): boolean {
  if (!subscription) return false
  return subscription.status === 'Active' && !subscription.cancel_at_period_end
}

/**
 * Get features difference between plans
 */
export function getFeaturesDifference(currentPlan: PlanType, targetPlan: PlanType): {
  gained: string[]
  lost: string[]
} {
  const currentFeatures = PLAN_FEATURES[currentPlan] || []
  const targetFeatures = PLAN_FEATURES[targetPlan] || []
  
  // Convert to string arrays to fix type issue
  const currentFeaturesArray = [...currentFeatures] as string[]
  const targetFeaturesArray = [...targetFeatures] as string[]
  
  const gained = targetFeaturesArray.filter(f => !currentFeaturesArray.includes(f))
  const lost = currentFeaturesArray.filter(f => !targetFeaturesArray.includes(f))
  
  return { gained, lost }
}

/**
 * Format date for billing display
 */
export function formatBillingDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Get next billing date
 */
export function getNextBillingDate(subscription: Subscription): Date | null {
  if (!subscription || subscription.cancel_at_period_end) {
    return null
  }
  return new Date(subscription.current_period_end)
}

/**
 * Calculate trial days remaining
 */
export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  
  const now = new Date()
  const trialEnd = new Date(trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  
  if (diffTime <= 0) return 0
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format card details for display
 */
export function formatCardDetails(brand: string, last4: string): string {
  const brandMap: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay'
  }
  
  const displayBrand = brandMap[brand.toLowerCase()] || brand
  return `${displayBrand} •••• ${last4}`
}

/**
 * Validate card expiry
 */
export function isCardExpired(expMonth: number, expYear: number): boolean {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  if (expYear < currentYear) return true
  if (expYear === currentYear && expMonth < currentMonth) return true
  
  return false
}

/**
 * Get card expiry warning
 */
export function getCardExpiryWarning(expMonth: number, expYear: number): string | null {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  if (isCardExpired(expMonth, expYear)) {
    return 'This card has expired'
  }
  
  // Warning if expiring within 3 months
  const monthsUntilExpiry = (expYear - currentYear) * 12 + (expMonth - currentMonth)
  if (monthsUntilExpiry <= 3) {
    return `This card expires in ${monthsUntilExpiry} month${monthsUntilExpiry === 1 ? '' : 's'}`
  }
  
  return null
}

/**
 * Get subscription end date message
 */
export function getSubscriptionEndMessage(subscription: Subscription): string | null {
  if (!subscription.cancel_at_period_end) return null
  
  const endDate = formatBillingDate(subscription.current_period_end)
  return `Your subscription will end on ${endDate}`
}

/**
 * Check if user needs payment method
 */
export function needsPaymentMethod(subscription: Subscription | null): boolean {
  if (!subscription) return false
  if (subscription.plan_type === 'Free') return false
  if (subscription.status === 'Cancelled') return false
  
  return true
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(
  monthlyApplications: number,
  needsAnalytics: boolean,
  needsSupport: boolean
): PlanType {
  if (needsSupport && needsAnalytics) return 'Premium'
  if (needsAnalytics) return 'Plus'
  if (monthlyApplications > 5) return 'Standard'
  return 'Free'
}

/**
 * Parse Stripe error for user-friendly message
 */
export function parseStripeError(error: any): string {
  const errorMessages: Record<string, string> = {
    'card_declined': 'Your card was declined. Please try a different card.',
    'expired_card': 'Your card has expired. Please update your payment method.',
    'incorrect_cvc': 'The CVC code is incorrect. Please check and try again.',
    'processing_error': 'An error occurred while processing your payment. Please try again.',
    'incorrect_number': 'The card number is incorrect. Please check and try again.',
    'insufficient_funds': 'Your card has insufficient funds. Please try a different card.',
  }
  
  const code = error?.code || error?.decline_code
  return errorMessages[code] || error?.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Export billing data for accounting
 */
export function exportBillingDataAsCSV(payments: any[]): string {
  const headers = ['Date', 'Description', 'Amount', 'Status', 'Invoice', 'Receipt']
  const rows = payments.map(p => [
    formatBillingDate(p.payment_date),
    p.description || 'Subscription payment',
    formatCurrency(p.amount),
    p.status,
    p.invoice_url || '',
    p.receipt_url || ''
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}