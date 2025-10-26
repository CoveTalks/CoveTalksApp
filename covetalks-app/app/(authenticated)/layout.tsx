import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userType={member.member_type || 'Speaker'}
        userName={member.name || undefined}
        userEmail={member.email}
      />
      <main className="flex-1 overflow-y-auto ml-64">
        {children}
      </main>
    </div>
  )
}
