'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Users,
  Calendar,
  DollarSign,
  Target,
  Award,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Briefcase,
  User,
  Send,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface OrganizationMember {
  member_id: string
  role: string
  joined_at: string
  member: {
    id: string
    name: string
    email: string
    title: string
    current_title: string
    profile_image_url: string
    phone: string
    linkedin_url: string
  }
}

interface Organization {
  id: string
  name: string
  organization_type: string
  description: string
  website: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  contact_email: string
  contact_phone: string
  typical_audience_size: number
  event_frequency: string
  preferred_topics: string[]
  budget_range: any
  logo_url: string
  verified: boolean
  location: string
  mission_statement: string
  industry: string
  employee_count: number
  event_types: string[]
  average_audience_size: string
  typical_budget: string
  venue_types: string[]
  past_speakers: string
  speaker_requirements: string
  created_at: string
  updated_at: string
  organization_members: OrganizationMember[]
}

export default function OrganizationProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messageSent, setMessageSent] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (params.id) {
      fetchOrganization(params.id as string)
    }
  }, [params.id])

  async function fetchOrganization(orgId: string) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!member || member.member_type !== 'Speaker') {
        router.push('/dashboard')
        return
      }

      setCurrentUser(member)

      // Fetch organization with members
      const { data: org, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members (
            member_id,
            role,
            joined_at,
            member:members (
              id,
              name,
              email,
              title,
              current_title,
              profile_image_url,
              phone,
              linkedin_url
            )
          )
        `)
        .eq('id', orgId)
        .single()

      if (error) throw error
      setOrganization(org)
    } catch (error) {
      console.error('Error fetching organization:', error)
      router.push('/organizations')
    } finally {
      setLoading(false)
    }
  }

  async function handleMessage(memberId: string, memberName: string) {
    try {
      // Create initial message or navigate to existing conversation
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${memberId}),and(sender_id.eq.${memberId},recipient_id.eq.${currentUser.id})`)
        .limit(1)

      if (existingMessages && existingMessages.length > 0) {
        // Navigate to existing conversation
        router.push(`/messages?recipient=${memberId}`)
      } else {
        // Create a new conversation starter
        const { error } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUser.id,
            recipient_id: memberId,
            subject: `Inquiry from ${currentUser.name} - ${organization?.name}`,
            message: `Hi ${memberName},\n\nI came across ${organization?.name}'s profile and would love to connect regarding potential speaking opportunities.\n\nBest regards,\n${currentUser.name}`,
            status: 'unread'
          })

        if (error) throw error

        setMessageSent(prev => ({ ...prev, [memberId]: true }))
        
        // Navigate to messages after a short delay
        setTimeout(() => {
          router.push(`/messages?recipient=${memberId}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization not found</h2>
          <Link href="/organizations" className="text-primary hover:underline">
            Return to organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/organizations"
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  {organization.name}
                  {organization.verified && (
                    <span className="ml-3 text-blue-500">✓</span>
                  )}
                </h1>
                <p className="text-gray-600 mt-1">{organization.organization_type}</p>
              </div>
            </div>
            {organization.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600 mb-4">
                {organization.description || 'No description available'}
              </p>
              {organization.mission_statement && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Mission Statement</h3>
                  <p className="text-gray-700">{organization.mission_statement}</p>
                </div>
              )}
            </div>

            {/* Event Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organization.event_frequency && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Event Frequency</h3>
                    <p className="text-gray-900 mt-1">{organization.event_frequency}</p>
                  </div>
                )}
                
                {organization.average_audience_size && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Typical Audience Size</h3>
                    <p className="text-gray-900 mt-1">{organization.average_audience_size}</p>
                  </div>
                )}

                {organization.typical_budget && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Typical Budget</h3>
                    <p className="text-gray-900 mt-1">{organization.typical_budget}</p>
                  </div>
                )}

                {organization.industry && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                    <p className="text-gray-900 mt-1">{organization.industry}</p>
                  </div>
                )}
              </div>

              {/* Event Types */}
              {organization.event_types && organization.event_types.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Event Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {organization.event_types.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue Types */}
              {organization.venue_types && organization.venue_types.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Venue Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {organization.venue_types.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Topics */}
              {organization.preferred_topics && organization.preferred_topics.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Preferred Speaking Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {organization.preferred_topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Speaker Requirements */}
            {organization.speaker_requirements && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Speaker Requirements</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{organization.speaker_requirements}</p>
              </div>
            )}

            {/* Past Speakers */}
            {organization.past_speakers && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Past Speakers</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{organization.past_speakers}</p>
              </div>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                {organization.location && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-gray-900">
                        {organization.address && `${organization.address}, `}
                        {organization.city && `${organization.city}, `}
                        {organization.state && `${organization.state} `}
                        {organization.country && organization.country}
                        {!organization.address && !organization.city && organization.location}
                      </p>
                    </div>
                  </div>
                )}

                {organization.website && (
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {organization.website}
                      </a>
                    </div>
                  </div>
                )}

                {(organization.contact_email || organization.email) && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a
                        href={`mailto:${organization.contact_email || organization.email}`}
                        className="text-primary hover:underline"
                      >
                        {organization.contact_email || organization.email}
                      </a>
                    </div>
                  </div>
                )}

                {(organization.contact_phone || organization.phone) && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">
                        {organization.contact_phone || organization.phone}
                      </p>
                    </div>
                  </div>
                )}

                {organization.employee_count && (
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Organization Size</p>
                      <p className="text-gray-900">{organization.employee_count} employees</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Team Members ({organization.organization_members?.length || 0})
              </h2>
              
              {organization.organization_members && organization.organization_members.length > 0 ? (
                <div className="space-y-4">
                  {organization.organization_members.map((orgMember) => (
                    <div key={orgMember.member_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          {orgMember.member.profile_image_url ? (
                            <img
                              src={orgMember.member.profile_image_url}
                              alt={orgMember.member.name}
                              className="h-12 w-12 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {orgMember.member.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {orgMember.role || 'Member'}
                            </p>
                            {orgMember.member.current_title && (
                              <p className="text-xs text-gray-500 mt-1">
                                {orgMember.member.current_title}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleMessage(orgMember.member_id, orgMember.member.name)}
                          disabled={messageSent[orgMember.member_id]}
                          className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            messageSent[orgMember.member_id]
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          {messageSent[orgMember.member_id] ? (
                            <>
                              <CheckCircle className="inline h-3 w-3 mr-1" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Send className="inline h-3 w-3 mr-1" />
                              Message
                            </>
                          )}
                        </button>
                      </div>

                      {/* Contact info if available */}
                      <div className="mt-3 space-y-1">
                        {orgMember.member.email && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Mail className="h-3 w-3 mr-2" />
                            {orgMember.member.email}
                          </div>
                        )}
                        {orgMember.member.phone && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Phone className="h-3 w-3 mr-2" />
                            {orgMember.member.phone}
                          </div>
                        )}
                        {orgMember.member.linkedin_url && (
                          <div className="flex items-center text-xs">
                            <Globe className="h-3 w-3 mr-2 text-gray-500" />
                            <a
                              href={orgMember.member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No team members listed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}