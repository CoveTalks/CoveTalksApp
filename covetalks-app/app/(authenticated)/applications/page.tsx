'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/layout/DashboardHeader'

// We'll create these next
import SpeakerApplicationsView from './SpeakerApplicationsView'
import OrganizationApplicationsView from './OrganizationApplicationsView'

export default function ApplicationsPage() {
  const [memberType, setMemberType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkMemberType()
  }, [])

  async function checkMemberType() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      const { data: member } = await supabase
        .from('members')
        .select('member_type')
        .eq('id', user.id)
        .single()

      if (member) {
        setMemberType(member.member_type)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="Applications"/>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-calm mb-4" />
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Applications"/>
      {memberType === 'Speaker' ? (
        <SpeakerApplicationsView />
      ) : memberType === 'Organization' ? (
        <OrganizationApplicationsView />
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Unable to determine account type.</p>
        </div>
      )}
    </>
  )
}