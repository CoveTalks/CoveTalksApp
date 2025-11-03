'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  useEffect(() => {
    const handleConfirmation = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const next = searchParams.get('next')
      
      console.log('=== CONFIRM PAGE DEBUG ===')
      console.log('Received parameters:')
      console.log('  token:', token ? `${token.substring(0, 20)}...` : 'MISSING')
      console.log('  type:', type || 'MISSING')
      console.log('  next:', next || 'MISSING')
      console.log('Decoded next:', next ? decodeURIComponent(next) : 'N/A')
      console.log('=========================')
      
      if (!token) {
        console.error('❌ No token provided')
        router.push('/auth/login?error=missing_token')
        return
      }
      
      try {
        console.log('🔄 Verifying magic link token...')
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'magiclink' | 'email',
        })
        
        if (error) {
          console.error('❌ verifyOtp failed:', error.message)
          console.log('🔄 Trying exchangeCodeForSession...')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(token)
          
          if (exchangeError) {
            console.error('❌ exchangeCodeForSession also failed:', exchangeError.message)
            router.push('/auth/login?error=invalid_token')
            return
          }
        }
        
        console.log('✅ Authentication successful')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('❌ No user in session after auth')
          router.push('/auth/login?error=session_failed')
          return
        }
        
        console.log('✅ Session established for:', user.email)
        
        const redirectTo = next || '/dashboard'
        console.log('=== REDIRECT DECISION ===')
        console.log('next parameter:', next)
        console.log('Will redirect to:', redirectTo)
        console.log('========================')
        
        router.push(redirectTo)
        
      } catch (error: any) {
        console.error('❌ Unexpected error:', error)
        router.push('/auth/login?error=confirmation_failed')
      }
    }
    
    handleConfirmation()
  }, [router, searchParams, supabase])
  
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
        <p className="text-xs text-gray-400 mt-4">
          (Check console for debug information)
        </p>
      </div>
    </div>
  )
}