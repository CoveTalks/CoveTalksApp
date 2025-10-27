import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

// Environment variable validation
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Create Supabase admin client
const supabaseAdmin = createClient(
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Verify the auto-login token
async function verifyAutoLoginToken(token: string) {
  try {
    const secret = new TextEncoder().encode(getEnvVar('AUTH_SECRET', 'your-secret-key'))
    
    const { payload } = await jwtVerify(token, secret, {
      maxTokenAge: '5m'
    })
    
    return payload as { userId: string; email: string; purpose: string; jti: string }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const fromStripe = searchParams.get('fromStripe') === 'true'
  
  if (!token) {
    console.error('No token provided for auto-login')
    return NextResponse.redirect(new URL('/auth/login?error=missing_token', request.url))
  }

  try {
    // Verify the JWT token from marketing site
    const tokenData = await verifyAutoLoginToken(token)
    
    if (!tokenData || tokenData.purpose !== 'auto-login') {
      console.error('Invalid token data')
      return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
    }

    const { userId, email } = tokenData
    
    // Check if token has been used (prevent replay attacks)
    const { data: usedToken } = await supabaseAdmin
      .from('used_auth_tokens')
      .select('id')
      .eq('token_jti', tokenData.jti)
      .single()
    
    if (usedToken) {
      console.error('Token has already been used')
      return NextResponse.redirect(new URL('/auth/login?error=token_already_used', request.url))
    }
    
    // Mark token as used
    await supabaseAdmin
      .from('used_auth_tokens')
      .insert({
        token_jti: tokenData.jti,
        user_id: userId,
        used_at: new Date().toISOString()
      })
    
    // Get the user from Supabase
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !user) {
      console.error('Failed to get user:', getUserError)
      return NextResponse.redirect(new URL('/auth/login?error=user_not_found', request.url))
    }
    
    // Check member profile to determine where to redirect
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('member_type, onboarding_completed')
      .eq('id', userId)
      .single()
    
    // Determine redirect path
    let redirectPath = '/dashboard'
    
    if (!member) {
      // Edge case: No member record at all
      console.error('No member record found for user')
      redirectPath = '/auth/onboarding' // Fallback to type selection
    } else if (!member.member_type) {
      // Edge case: Member exists but no type set (shouldn't happen with marketing site flow)
      console.log('Member type not set, sending to type selection')
      redirectPath = '/auth/onboarding'
    } else if (!member.onboarding_completed) {
      // Normal case: Member type is set, but profile setup not completed
      console.log(`Member type is ${member.member_type}, sending to profile setup`)
      redirectPath = '/auth/profile-setup'
      if (fromStripe) {
        redirectPath += '?subscription=success'
      }
    } else {
      // Member is fully onboarded - go to dashboard
      console.log('Member fully onboarded, sending to dashboard')
      redirectPath = '/dashboard'
      if (fromStripe) {
        redirectPath += '?subscription=success'
      }
    }
    
    console.log(`✅ Auto-login successful for ${email}`)
    console.log(`   Member: type=${member?.member_type}, onboarding_completed=${member?.onboarding_completed}`)
    console.log(`   Redirecting to: ${redirectPath}`)
    
    // Create a magic link for the user to establish session
    const { data: magicLink, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: redirectPath
      }
    })
    
    if (magicLinkError || !magicLink) {
      console.error('Failed to create magic link:', magicLinkError)
      return NextResponse.redirect(new URL('/auth/login?error=session_failed', request.url))
    }
    
    // Extract the token hash from the magic link
    const magicLinkUrl = new URL(magicLink.properties.action_link)
    const tokenHash = magicLinkUrl.searchParams.get('token')
    const type = magicLinkUrl.searchParams.get('type') || 'magiclink'
    
    // Redirect to confirm page with the magic link token
    const confirmUrl = new URL('/auth/confirm', request.url)
    confirmUrl.searchParams.set('token', tokenHash || '')
    confirmUrl.searchParams.set('type', type)
    confirmUrl.searchParams.set('next', redirectPath)
    
    return NextResponse.redirect(confirmUrl)
    
  } catch (error: any) {
    console.error('Auto-login error:', error)
    
    // Log error for debugging (optional)
    await supabaseAdmin
      .from('auth_errors')
      .insert({
        error_type: 'auto_login_failed',
        error_message: error.message,
        error_stack: error.stack,
        token: token.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      })
      .catch(console.error) // Don't fail if logging fails
    
    return NextResponse.redirect(new URL('/auth/login?error=auto_login_failed', request.url))
  }
}