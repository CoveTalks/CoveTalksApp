import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'your-secret-key')
    
    const { payload } = await jwtVerify(token, secret, {
      maxTokenAge: '5m' // Must be used within 5 minutes
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
  const isNewUser = searchParams.get('newUser') === 'true'
  const fromStripe = searchParams.get('fromStripe') === 'true'
  
  if (!token) {
    console.error('No token provided for auto-login')
    return NextResponse.redirect(new URL('/auth/login?error=missing_token', request.url))
  }

  try {
    // Verify the JWT token
    const tokenData = await verifyAutoLoginToken(token)
    
    if (!tokenData || tokenData.purpose !== 'auto-login') {
      console.error('Invalid token data')
      return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
    }

    const { userId, email } = tokenData
    
    // Check if this token has been used (prevent replay attacks)
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
    
    // Create a magic link for automatic sign-in
    const { data: magicLink, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: '/'
      }
    })
    
    if (magicLinkError || !magicLink) {
      console.error('Failed to create magic link:', magicLinkError)
      return NextResponse.redirect(new URL('/auth/login?error=session_failed', request.url))
    }

    // Extract the token from the magic link
    const magicLinkUrl = new URL(magicLink.properties.action_link)
    const accessToken = magicLinkUrl.searchParams.get('token')
    
    if (!accessToken) {
      console.error('No access token in magic link')
      return NextResponse.redirect(new URL('/auth/login?error=no_access_token', request.url))
    }

    // Check member profile to determine redirect
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('member_type, onboarding_completed')
      .eq('id', userId)
      .single()
    
    let redirectPath = '/dashboard'
    
    if (!member) {
      console.error('Member profile not found')
      redirectPath = '/auth/onboarding'
    } else if (!member.member_type) {
      // Edge case: member exists but no type (shouldn't happen with new flow)
      redirectPath = '/auth/onboarding'
    } else if (!member.onboarding_completed) {
      // Member type is set but onboarding not completed
      redirectPath = '/auth/profile-setup'
    } else {
      // Fully set up, go to dashboard
      redirectPath = '/dashboard'
    }
    
    // Add success flag for new users or Stripe returns
    if (isNewUser) {
      redirectPath += '?welcome=true'
    } else if (fromStripe) {
      redirectPath += '?subscription=success'
    }
    
    // Create response with redirect
    const response = NextResponse.redirect(new URL(`/auth/confirm?token=${accessToken}&type=magiclink&next=${encodeURIComponent(redirectPath)}`, request.url))
    
    // Set a session cookie for immediate access
    const cookieStore = cookies()
    cookieStore.set('supabase-auth-token', JSON.stringify({
      access_token: accessToken,
      token_type: 'bearer',
      expires_at: Date.now() + 3600 * 1000, // 1 hour
      user
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    })
    
    console.log(`✅ Auto-login successful for ${email}, redirecting to ${redirectPath}`)
    
    return response
    
  } catch (error: any) {
    console.error('Auto-login error:', error)
    
    // Log detailed error for debugging
    await supabaseAdmin
      .from('auth_errors')
      .insert({
        error_type: 'auto_login_failed',
        error_message: error.message,
        error_stack: error.stack,
        token: token.substring(0, 20) + '...', // Log partial token for debugging
        timestamp: new Date().toISOString()
      })
    
    return NextResponse.redirect(new URL('/auth/login?error=auto_login_failed', request.url))
  }
}

// POST endpoint to handle auto-login from marketing site (alternative approach)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, temporaryPassword } = body
    
    // This is an alternative approach using a temporary password
    // The marketing site would generate a temporary password and send it here
    
    if (!userId || !email || !temporaryPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify the temporary password matches what we expect
    const expectedPassword = `temp_${userId}_${email}_${process.env.AUTH_SECRET}`
    const hashedExpected = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(expectedPassword)
    )
    const hashedReceived = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(temporaryPassword)
    )
    
    if (Buffer.from(hashedExpected).toString('hex') !== Buffer.from(hashedReceived).toString('hex')) {
      return NextResponse.json(
        { error: 'Invalid temporary password' },
        { status: 401 }
      )
    }
    
    // Create session for the user
    const { data: magicLink, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: '/'
      }
    })
    
    if (error || !magicLink) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      magicLink: magicLink.properties.action_link
    })
    
  } catch (error: any) {
    console.error('Auto-login POST error:', error)
    return NextResponse.json(
      { error: 'Auto-login failed', details: error.message },
      { status: 500 }
    )
  }
}