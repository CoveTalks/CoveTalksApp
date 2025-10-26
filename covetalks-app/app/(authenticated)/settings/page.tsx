'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Bell, Shield, CreditCard, Globe, Mail, 
  Save, Camera, Check, X, Eye, EyeOff, Download,
  AlertCircle, ChevronRight, Calendar, FileText,
  Package, ArrowUpCircle, ArrowDownCircle, Pause,
  RefreshCw, Trash2, Plus, Edit2, CheckCircle, Loader2
} from 'lucide-react'

interface UserSettings {
  id: string
  email: string
  name: string
  phone: string
  bio: string
  member_type: 'Speaker' | 'Organization'
  stripe_customer_id?: string
  notifications: {
    email_opportunities: boolean
    email_applications: boolean
    email_messages: boolean
    email_newsletter: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'private' | 'members'
    show_email: boolean
    show_phone: boolean
  }
}

interface Subscription {
  id: string
  plan_type: 'Free' | 'Standard' | 'Plus' | 'Premium'
  billing_period: 'Monthly' | 'Yearly'
  status: 'Active' | 'Cancelled' | 'Past_due' | 'Paused'
  amount: number
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_subscription_id?: string
}

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
}

interface BillingHistory {
  id: string
  amount: number
  status: string
  description: string
  invoice_url?: string
  receipt_url?: string
  payment_date: string
  card_last4?: string
  card_brand?: string
}

const PLANS = {
  Free: {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    features: [
      'Basic profile',
      '5 applications per month',
      'Basic search filters',
      'Email support'
    ]
  },
  Standard: {
    name: 'Standard',
    monthly: 97,
    yearly: 997,
    features: [
      'Everything in Free',
      'Unlimited applications',
      'Advanced search filters',
      'Priority support',
      'Featured profile badge',
      'Speaking opportunity alerts'
    ]
  },
  Plus: {
    name: 'Plus',
    monthly: 147,
    yearly: 1497,
    features: [
      'Everything in Standard',
      'Priority listing',
      'Analytics dashboard',
      'Booking management tools',
      'Custom speaker tags',
      'Phone support'
    ],
    popular: true
  },
  Premium: {
    name: 'Premium',
    monthly: 197,
    yearly: 1997,
    features: [
      'Everything in Plus',
      'Top search placement',
      'Dedicated account manager',
      'API access',
      'White-label options',
      'Premium opportunities'
    ]
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedBilling, setSelectedBilling] = useState<'Monthly' | 'Yearly'>('Monthly')
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
    fetchSubscription()
  }, [])

  useEffect(() => {
    // Fetch billing data only for speakers with Stripe customer ID
    if (settings?.member_type === 'Speaker') {
      fetchPaymentMethods()
      fetchBillingHistory()
    }
  }, [settings])

  async function fetchSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setSettings({
        id: member.id,
        email: member.email,
        name: member.name,
        phone: member.phone || '',
        bio: member.bio || '',
        member_type: member.member_type,
        stripe_customer_id: member.stripe_customer_id,
        notifications: member.notification_preferences || {
          email_opportunities: true,
          email_applications: true,
          email_messages: true,
          email_newsletter: false
        },
        privacy: member.privacy_settings || {
          profile_visibility: 'public',
          show_email: false,
          show_phone: false
        }
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', user.id)
        .or('status.eq.Active,status.eq.Trialing')
        .single()

      if (!error && subscription) {
        setSubscription(subscription)
      } else {
        // Default to free plan
        setSubscription({
          id: '',
          plan_type: 'Free',
          billing_period: 'Monthly',
          status: 'Active',
          amount: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date().toISOString(),
          cancel_at_period_end: false
        })
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // Default to free plan on error
      setSubscription({
        id: '',
        plan_type: 'Free',
        billing_period: 'Monthly',
        status: 'Active',
        amount: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
        cancel_at_period_end: false
      })
    }
  }

  async function fetchPaymentMethods() {
    if (!settings?.stripe_customer_id) return
    
    setLoadingPaymentMethods(true)
    try {
      const response = await fetch('/api/stripe/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  async function fetchBillingHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', user.id)
        .order('payment_date', { ascending: false })
        .limit(20)

      if (!error && payments) {
        setBillingHistory(payments)
      }
    } catch (error) {
      console.error('Error fetching billing history:', error)
    }
  }

  async function saveSettings() {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: settings.name,
          phone: settings.phone,
          bio: settings.bio,
          notification_preferences: settings.notifications,
          privacy_settings: settings.privacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function updatePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: 'Failed to update password. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handlePlanChange() {
    if (!selectedPlan) return

    setChangingPlan(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          billingPeriod: selectedBilling,
          customerId: settings?.stripe_customer_id
        })
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Error changing plan:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to change plan. Please try again.' })
    } finally {
      setChangingPlan(false)
    }
  }

  async function handleCancelSubscription() {
    if (!subscription?.stripe_subscription_id) {
      setMessage({ type: 'error', text: 'No active subscription found' })
      return
    }

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription cancelled. You will have access until the end of your billing period.' })
        fetchSubscription()
      } else {
        throw new Error(data.error || 'Failed to cancel subscription')
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to cancel subscription. Please try again.' })
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleReactivateSubscription() {
    if (!subscription?.stripe_subscription_id) {
      setMessage({ type: 'error', text: 'No subscription found to reactivate' })
      return
    }

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription reactivated successfully!' })
        fetchSubscription()
      } else {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to reactivate subscription. Please try again.' })
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleAddPaymentMethod() {
    if (!settings?.stripe_customer_id) {
      setMessage({ type: 'error', text: 'Please complete your profile first' })
      return
    }

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: settings.stripe_customer_id
        })
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to add payment method')
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to add payment method. Please try again.' })
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleRemovePaymentMethod(paymentMethodId: string) {
    if (!confirm('Are you sure you want to remove this payment method?')) return

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/stripe/remove-payment-method', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment method removed successfully!' })
        fetchPaymentMethods()
      } else {
        throw new Error(data.error || 'Failed to remove payment method')
      }
    } catch (error: any) {
      console.error('Error removing payment method:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to remove payment method. Please try again.' })
    } finally {
      setProcessingPayment(false)
    }
  }

  async function handleSetDefaultPaymentMethod(paymentMethodId: string) {
    if (!settings?.stripe_customer_id) return

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/stripe/set-default-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId,
          customerId: settings.stripe_customer_id
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Default payment method updated!' })
        fetchPaymentMethods()
      } else {
        throw new Error(data.error || 'Failed to update payment method')
      }
    } catch (error: any) {
      console.error('Error setting default payment method:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update payment method. Please try again.' })
    } finally {
      setProcessingPayment(false)
    }
  }

  // Check for success messages in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') {
      setMessage({ type: 'success', text: 'Subscription updated successfully!' })
      fetchSubscription()
      fetchPaymentMethods()
      // Remove query params from URL
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('payment') === 'success') {
      setMessage({ type: 'success', text: 'Payment method added successfully!' })
      fetchPaymentMethods()
      // Remove query params from URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load settings</p>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  // Only show billing tab for speakers
  if (settings.member_type === 'Speaker') {
    tabs.push({ id: 'billing', label: 'Billing', icon: CreditCard })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="flex-1">{message.text}</p>
          <button onClick={() => setMessage(null)} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-calm text-white'
                        : 'text-gray-600 hover:bg-foam'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:flex-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Keep existing Profile, Notifications, Privacy, and Security tabs as-is */}
            {activeTab === 'profile' && (
              <ProfileSettings settings={settings} setSettings={setSettings} saveSettings={saveSettings} saving={saving} />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettings settings={settings} setSettings={setSettings} saveSettings={saveSettings} saving={saving} />
            )}

            {activeTab === 'privacy' && (
              <PrivacySettings settings={settings} setSettings={setSettings} saveSettings={saveSettings} saving={saving} />
            )}

            {activeTab === 'security' && (
              <SecuritySettings 
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                updatePassword={updatePassword}
                saving={saving}
              />
            )}

            {/* Enhanced Billing Tab - Fully Functional */}
            {activeTab === 'billing' && settings.member_type === 'Speaker' && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold text-deep">Billing & Subscription</h2>
                
                {/* Current Plan Section */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Current Plan</h3>
                      <p className="text-sm text-gray-600">Manage your subscription and billing</p>
                    </div>
                    {subscription?.plan_type !== 'Free' && subscription?.cancel_at_period_end && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Cancelling at period end
                      </span>
                    )}
                  </div>

                  <div className="bg-foam p-6 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-3xl font-bold text-calm">{subscription?.plan_type} Plan</p>
                        {subscription?.plan_type !== 'Free' && (
                          <p className="text-gray-600 mt-1">
                            ${subscription?.amount}/{subscription?.billing_period === 'Yearly' ? 'year' : 'month'}
                          </p>
                        )}
                      </div>
                      {subscription?.plan_type !== 'Premium' && (
                        <button
                          onClick={() => setShowPlanModal(true)}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Upgrade Plan
                        </button>
                      )}
                    </div>
                    
                    {subscription?.plan_type !== 'Free' && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Next billing date: {new Date(subscription?.current_period_end || '').toLocaleDateString()}</p>
                        {subscription?.cancel_at_period_end && (
                          <p className="text-yellow-700">Access ends: {new Date(subscription?.current_period_end || '').toLocaleDateString()}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {PLANS[subscription?.plan_type || 'Free'].features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {subscription?.plan_type !== 'Free' && (
                      <div className="mt-6 flex gap-3">
                        {!subscription?.cancel_at_period_end ? (
                          <button
                            onClick={handleCancelSubscription}
                            disabled={processingPayment}
                            className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            {processingPayment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                            Cancel Subscription
                          </button>
                        ) : (
                          <button
                            onClick={handleReactivateSubscription}
                            disabled={processingPayment}
                            className="btn btn-primary flex items-center gap-2"
                          >
                            {processingPayment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Reactivate Subscription
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods Section */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Payment Methods</h3>
                      <p className="text-sm text-gray-600">Manage your payment methods</p>
                    </div>
                    <button
                      onClick={handleAddPaymentMethod}
                      disabled={processingPayment}
                      className="btn btn-outline btn-sm flex items-center gap-2"
                    >
                      {processingPayment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add Card
                    </button>
                  </div>

                  {loadingPaymentMethods ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : paymentMethods.length > 0 ? (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                            <div>
                              <p className="font-medium capitalize">
                                {method.brand} •••• {method.last4}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                              </p>
                            </div>
                            {method.is_default && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.is_default && (
                              <button
                                onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                disabled={processingPayment}
                                className="text-calm hover:text-deep text-sm"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleRemovePaymentMethod(method.id)}
                              disabled={processingPayment}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No payment methods on file
                    </p>
                  )}
                </div>

                {/* Billing History Section */}
                <div className="border rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">Billing History</h3>
                    <p className="text-sm text-gray-600">Download invoices and receipts</p>
                  </div>

                  {billingHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 font-medium text-gray-700">Date</th>
                            <th className="pb-2 font-medium text-gray-700">Description</th>
                            <th className="pb-2 font-medium text-gray-700">Amount</th>
                            <th className="pb-2 font-medium text-gray-700">Status</th>
                            <th className="pb-2 font-medium text-gray-700"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingHistory.map((payment) => (
                            <tr key={payment.id} className="border-b">
                              <td className="py-3 text-sm">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td className="py-3 text-sm">
                                {payment.description}
                                {payment.card_last4 && (
                                  <span className="text-gray-500 ml-2">
                                    ({payment.card_brand} •••• {payment.card_last4})
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-sm font-medium">
                                ${payment.amount.toFixed(2)}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  payment.status === 'Succeeded' 
                                    ? 'bg-green-100 text-green-800'
                                    : payment.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {payment.invoice_url && (
                                    <a
                                      href={payment.invoice_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-calm hover:text-deep"
                                      title="Download Invoice"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </a>
                                  )}
                                  {payment.receipt_url && (
                                    <a
                                      href={payment.receipt_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-calm hover:text-deep"
                                      title="Download Receipt"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No billing history available
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Change Modal */}
      {showPlanModal && (
        <PlanChangeModal
          currentPlan={subscription?.plan_type || 'Free'}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          selectedBilling={selectedBilling}
          setSelectedBilling={setSelectedBilling}
          onClose={() => {
            setShowPlanModal(false)
            setSelectedPlan(null)
          }}
          onConfirm={handlePlanChange}
          loading={changingPlan}
        />
      )}
    </div>
  )
}

// Keep all the component functions the same
function ProfileSettings({ settings, setSettings, saveSettings, saving }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-deep">Profile Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={settings.name}
            onChange={(e: any) => setSettings({ ...settings, name: e.target.value })}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={settings.email}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            Contact support to change your email
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={settings.phone}
            onChange={(e: any) => setSettings({ ...settings, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Account Type</label>
          <input
            type="text"
            className="form-input"
            value={settings.member_type}
            disabled
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bio</label>
        <textarea
          className="form-textarea"
          rows={4}
          value={settings.bio}
          onChange={(e: any) => setSettings({ ...settings, bio: e.target.value })}
        />
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Profile Settings'}
        </button>
      </div>
    </div>
  )
}

function NotificationSettings({ settings, setSettings, saveSettings, saving }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-deep">Notification Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Speaking Opportunities</p>
            <p className="text-sm text-gray-600">
              Get notified about new speaking opportunities that match your profile
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.notifications.email_opportunities}
              onChange={(e: any) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email_opportunities: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Application Updates</p>
            <p className="text-sm text-gray-600">
              Receive updates when your applications are viewed or responded to
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.notifications.email_applications}
              onChange={(e: any) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email_applications: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Messages</p>
            <p className="text-sm text-gray-600">
              Get notified when you receive new messages
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.notifications.email_messages}
              onChange={(e: any) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email_messages: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Newsletter</p>
            <p className="text-sm text-gray-600">
              Receive tips, updates, and news from CoveTalks
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.notifications.email_newsletter}
              onChange={(e: any) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email_newsletter: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  )
}

function PrivacySettings({ settings, setSettings, saveSettings, saving }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-deep">Privacy Settings</h2>
      
      <div className="space-y-4">
        <div className="form-group">
          <label className="form-label">Profile Visibility</label>
          <select
            className="form-select"
            value={settings.privacy.profile_visibility}
            onChange={(e: any) => setSettings({
              ...settings,
              privacy: { ...settings.privacy, profile_visibility: e.target.value }
            })}
          >
            <option value="public">Public - Anyone can view your profile</option>
            <option value="members">Members Only - Only registered users can view</option>
            <option value="private">Private - Only you can view your profile</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Show Email Address</p>
            <p className="text-sm text-gray-600">
              Display your email address on your public profile
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.privacy.show_email}
              onChange={(e: any) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, show_email: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Show Phone Number</p>
            <p className="text-sm text-gray-600">
              Display your phone number on your public profile
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.privacy.show_phone}
              onChange={(e: any) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, show_phone: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-calm"></div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>
    </div>
  )
}

function SecuritySettings({ currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword, updatePassword, saving }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-deep">Security Settings</h2>
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Change Password</h3>
        
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input pr-10"
              value={currentPassword}
              onChange={(e: any) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={newPassword}
            onChange={(e: any) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={updatePassword}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="btn btn-primary"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      <div className="pt-6 border-t">
        <h3 className="font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account
        </p>
        <button className="btn btn-outline">
          Enable Two-Factor Authentication
        </button>
      </div>
    </div>
  )
}

function PlanChangeModal({ currentPlan, selectedPlan, setSelectedPlan, selectedBilling, setSelectedBilling, onClose, onConfirm, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Change Subscription Plan</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Select a plan that best fits your needs</p>
        </div>

        <div className="p-6">
          {/* Billing Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setSelectedBilling('Monthly')}
                className={`px-4 py-2 rounded-md ${
                  selectedBilling === 'Monthly'
                    ? 'bg-calm text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling('Yearly')}
                className={`px-4 py-2 rounded-md ${
                  selectedBilling === 'Yearly'
                    ? 'bg-calm text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Standard', 'Plus', 'Premium'] as const).map((planName) => {
              const plan = PLANS[planName]
              const price = selectedBilling === 'Yearly' ? plan.yearly : plan.monthly
              const isCurrentPlan = currentPlan === planName
              const isSelected = selectedPlan === planName
              
              return (
                <div
                  key={planName}
                  onClick={() => !isCurrentPlan && setSelectedPlan(planName)}
                  className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                    isCurrentPlan
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-calm bg-calm/5 shadow-lg'
                      : 'border-gray-200 hover:border-calm hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-calm text-white text-xs rounded-full">
                      Most Popular
                    </span>
                  )}
                  
                  {isCurrentPlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-500 text-white text-xs rounded-full">
                      Current Plan
                    </span>
                  )}

                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-calm mb-1">
                    ${price}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    per {selectedBilling === 'Yearly' ? 'year' : 'month'}
                  </p>

                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isSelected && !isCurrentPlan && (
                    <div className="absolute inset-0 border-2 border-calm rounded-lg pointer-events-none"></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedPlan || selectedPlan === currentPlan || loading}
              className="btn btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="h-4 w-4" />
                  Upgrade to {selectedPlan}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}