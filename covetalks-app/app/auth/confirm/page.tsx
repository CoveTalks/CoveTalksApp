'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type') || 'magiclink'
        const next = searchParams.get('next')
        
        console.log('Confirm page params:', { 
          token: token ? token.substring(0, 20) + '...' : 'none',
          type,
          next 
        })
        
        if (!token) {
          console.error('No token provided to confirm page')
          router.push('/auth/login?error=missing_token')
          return
        }
        
        // Try to verify the OTP/magic link
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'magiclink' | 'email',
        })
        
        if (verifyError) {
          console.error('Failed to verify OTP:', verifyError)
          
          // Try alternative method - exchange code for session
          const { data: sessionData, error: exchangeError } = 
            await supabase.auth.exchangeCodeForSession(token)
          
          if (exchangeError) {
            console.error('Failed to exchange code for session:', exchangeError)
            setError('Invalid or expired token')
            
            // Redirect to login after showing error
            setTimeout(() => {
              router.push('/auth/login?error=invalid_token')
            }, 2000)
            return
          }
        }
        
        // Wait a moment for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify the session was established
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user) {
          console.error('No user in session after confirmation')
          setError('Failed to establish session')
          setTimeout(() => {
            router.push('/auth/login?error=session_failed')
          }, 2000)
          return
        }
        
        console.log('Session confirmed for:', user.email)
        
        // IMPORTANT: Use the next parameter if provided, otherwise default
        const redirectTo = next || '/dashboard'
        console.log('Redirecting to:', redirectTo)
        
        // Use replace instead of push to prevent back button issues
        router.replace(redirectTo)
        
      } catch (error: any) {
        console.error('Confirmation error:', error)
        setError('An unexpected error occurred')
        setTimeout(() => {
          router.push('/auth/login?error=confirmation_failed')
        }, 2000)
      }
    }
    
    handleConfirmation()
  }, [router, searchParams, supabase])
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirming your account...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your session
        </p>
      </div>
    </div>
  )
}