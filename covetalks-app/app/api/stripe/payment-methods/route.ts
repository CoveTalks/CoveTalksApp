import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Placeholder response
    return NextResponse.json({ 
      paymentMethods: [],
      message: 'Stripe integration pending'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment methods not yet configured' },
      { status: 503 }
    )
  }
}