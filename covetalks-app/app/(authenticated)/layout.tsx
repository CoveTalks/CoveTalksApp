import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get member profile with type
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!member) {
    // If member doesn't exist, redirect to onboarding
    redirect('/auth/onboarding')
  }

  return (
    <DashboardLayoutClient
      userType={member.member_type || 'Speaker'}
      userName={member.name || undefined}
      userEmail={member.email}
    >
      {children}
    </DashboardLayoutClient>
  )
}