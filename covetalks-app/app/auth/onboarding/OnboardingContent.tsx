'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Users, Mic, CheckCircle } from 'lucide-react'

export default function OnboardingContent() {
  const [selectedType, setSelectedType] = useState<'Speaker' | 'Organization' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingUser, setCheckingUser] = useState(true)
  const [existingType, setExistingType] = useState<'Speaker' | 'Organization' | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const fromStripe = searchParams.get('fromStripe') === 'true'

  useEffect(() => {
    async function checkUserType() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: member } = await supabase
          .from('members')
          .select('member_type, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (member) {
          if (member.onboarding_completed) {
            console.log('Onboarding already completed, redirecting to dashboard')
            const url = fromStripe ? '/dashboard?subscription=success' : '/dashboard'
            router.push(url)
            return
          }

          if (member.member_type && !member.onboarding_completed) {
            console.log(`Member type already set to ${member.member_type}, pre-selecting`)
            setExistingType(member.member_type as 'Speaker' | 'Organization')
            setSelectedType(member.member_type as 'Speaker' | 'Organization')
          }
        }

        setCheckingUser(false)
        setLoading(false)
      } catch (err: any) {
        console.error('Error checking user type:', err)
        setError('Failed to load user information')
        setCheckingUser(false)
        setLoading(false)
      }
    }

    checkUserType()
  }, [router, supabase, fromStripe])

  const handleContinue = async () => {
    if (!selectedType) {
      setError('Please select an account type')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No user found')
      }

      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          member_type: selectedType,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      const redirectUrl = '/auth/profile-setup'
      const params = new URLSearchParams()
      if (fromStripe) params.append('subscription', 'success')
      
      router.push(params.toString() ? `${redirectUrl}?${params.toString()}` : redirectUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to update account type')
      setLoading(false)
    }
  }

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {existingType ? 'Confirm Your Account Type' : 'Welcome to CoveTalks!'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {existingType 
              ? `You selected ${existingType} during signup. You can confirm or change this selection.`
              : "Let's set up your account. Are you a speaker or an organization?"
            }
          </p>
          {fromStripe && (
            <div className="mt-4 inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>Your subscription is active!</span>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedType('Speaker')}
            className={`relative rounded-lg border-2 p-8 text-left transition-all hover:shadow-lg ${
              selectedType === 'Speaker'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`rounded-full p-6 mb-4 ${
                selectedType === 'Speaker' ? 'bg-primary/20' : 'bg-gray-100'
              }`}>
                <Mic className={`h-12 w-12 ${
                  selectedType === 'Speaker' ? 'text-primary' : 'text-gray-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold mb-3">I'm a Speaker</h3>
              <p className="text-muted-foreground mb-4">
                Looking for speaking opportunities and engagements
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Browse speaking opportunities
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Apply to engagements
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Build your speaker profile
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Connect with organizations
                </li>
              </ul>
            </div>
            {selectedType === 'Speaker' && (
              <div className="absolute top-4 right-4 rounded-full bg-primary text-white p-1">
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            {existingType === 'Speaker' && (
              <div className="absolute top-2 left-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                Current Selection
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedType('Organization')}
            className={`relative rounded-lg border-2 p-8 text-left transition-all hover:shadow-lg ${
              selectedType === 'Organization'
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`rounded-full p-6 mb-4 ${
                selectedType === 'Organization' ? 'bg-primary/20' : 'bg-gray-100'
              }`}>
                <Users className={`h-12 w-12 ${
                  selectedType === 'Organization' ? 'text-primary' : 'text-gray-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold mb-3">I'm an Organization</h3>
              <p className="text-muted-foreground mb-4">
                Looking to find and book professional speakers
              </p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Post speaking opportunities
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Browse speaker profiles
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Review applications
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Manage events
                </li>
              </ul>
            </div>
            {selectedType === 'Organization' && (
              <div className="absolute top-4 right-4 rounded-full bg-primary text-white p-1">
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            {existingType === 'Organization' && (
              <div className="absolute top-2 left-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                Current Selection
              </div>
            )}
          </button>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedType || loading}
            size="lg"
            className="px-12"
          >
            {loading ? 'Setting up...' : existingType ? 'Continue to Profile Setup' : 'Continue'}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {existingType 
              ? "Confirm your selection or choose a different account type"
              : "Don't worry, you can change this later in your settings"
            }
          </p>
        </div>
      </div>
    </div>
  )
}