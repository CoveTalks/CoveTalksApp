'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Clock,
  Building2,
  Globe,
  Mail,
  Phone,
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Award,
  Target,
  FileText,
  Briefcase,
  Info
} from 'lucide-react'
import Link from 'next/link'

// We'll import these dynamically to avoid errors
import dynamic from 'next/dynamic'

// Dynamically import modals to prevent SSR issues
const ApplicationModal = dynamic(() => import('./ApplicationModal'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
})

const OpportunityEditModal = dynamic(() => import('./OpportunityEditModal'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
})

interface Organization {
  id: string
  name: string
  logo_url: string
  description: string
  website: string
  email: string
  phone: string
  city: string
  state: string
  organization_type: string
  verified: boolean
}

interface Opportunity {
  id: string
  title: string
  description: string
  event_date: string
  event_time: string | null // Added to match DB
  duration_hours: number | null // Changed from event_duration/presentation_duration
  location: string | null
  venue_name: string | null
  event_format: 'In-Person' | 'Virtual' | 'Hybrid'
  compensation_amount: number | null
  compensation_type: string | null
  audience_size: number | null // Changed to number
  audience_type: string | null // Added to match DB
  topics: string[] | null
  required_specialties: string[] | null // Changed from requirements
  preferred_experience_years: number | null // Changed from preferred_experience (text to number)
  travel_covered: boolean // Changed from travel_provided
  accommodation_covered: boolean // Changed from accommodation_provided
  additional_benefits: string | null // Added to match DB
  speaker_type: string | null // Added to match DB
  additional_terms: string | null // Added to match DB
  status: 'Open' | 'Closed' | 'Filled' | 'Cancelled'
  application_deadline: string
  application_count: number // Added to match DB
  view_count: number // Added to match DB
  created_at: string
  updated_at: string
  organization_id: string
  posted_by: string | null // Added to match DB
  organizations: Organization
}

interface Application {
  id: string
  status: string
  created_at: string
  cover_letter: string
  proposed_topics: string[]
  requested_fee: number
  availability_confirmed: boolean
}

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const opportunityId = params?.id as string
  
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userType, setUserType] = useState<'Speaker' | 'Organization' | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [existingApplication, setExistingApplication] = useState<Application | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity()
    }
  }, [opportunityId])

  async function fetchOpportunity() {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user type
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('member_type')
        .eq('id', user.id)
        .single()

      if (memberError) {
        console.error('Error fetching member:', memberError)
        setError('Failed to load user information')
        return
      }

      if (member) {
        setUserType(member.member_type as 'Speaker' | 'Organization')
      }

      // Fetch opportunity with organization details
      const { data: opp, error: oppError } = await supabase
        .from('speaking_opportunities')
        .select(`
          *,
          organizations (
            id,
            name,
            logo_url,
            description,
            website,
            email,
            phone,
            city,
            state,
            organization_type,
            verified
          )
        `)
        .eq('id', opportunityId)
        .single()

      if (oppError) {
        console.error('Error fetching opportunity:', oppError)
        setError('Opportunity not found')
        return
      }

      if (!opp) {
        setError('Opportunity not found')
        return
      }

      setOpportunity(opp as Opportunity)

      // Increment view count
      await supabase
        .from('speaking_opportunities')
        .update({ view_count: (opp.view_count || 0) + 1 })
        .eq('id', opportunityId)

      // Check if user is the owner (for organizations)
      if (member?.member_type === 'Organization') {
        const { data: orgMember, error: orgMemberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('member_id', user.id)
          .single()

        if (!orgMemberError && orgMember && orgMember.organization_id === opp.organization_id) {
          setIsOwner(true)
        }
      }

      // Check for existing application (for speakers)
      if (member?.member_type === 'Speaker') {
        const { data: app } = await supabase
          .from('applications')
          .select('*')
          .eq('opportunity_id', opportunityId)
          .eq('speaker_id', user.id)
          .maybeSingle()

        if (app) {
          setExistingApplication(app)
        }
      }

    } catch (err) {
      console.error('Error in fetchOpportunity:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleWithdraw() {
    if (!existingApplication) return

    setWithdrawing(true)
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'Withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApplication.id)

      if (error) throw error

      setExistingApplication({
        ...existingApplication,
        status: 'Withdrawn'
      })
    } catch (error) {
      console.error('Error withdrawing application:', error)
    } finally {
      setWithdrawing(false)
    }
  }

  function getApplicationStatusBadge(status: string) {
    switch(status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4 mr-1" />
            Application Pending
          </span>
        )
      case 'Accepted':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Application Accepted
          </span>
        )
      case 'Declined':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4 mr-1" />
            Application Declined
          </span>
        )
      case 'Withdrawn':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4 mr-1" />
            Application Withdrawn
          </span>
        )
      default:
        return null
    }
  }

  function formatDuration(hours: number | null): string {
    if (!hours) return 'TBD'
    if (hours === 1) return '1 hour'
    if (hours % 1 === 0) return `${hours} hours`
    const wholeHours = Math.floor(hours)
    const minutes = (hours % 1) * 60
    if (wholeHours === 0) return `${minutes} minutes`
    return `${wholeHours} hour${wholeHours > 1 ? 's' : ''} ${minutes} minutes`
  }

  function formatTime(timeString: string | null): string {
    if (!timeString) return ''
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return timeString
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-calm" />
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {error || 'Opportunity not found'}
          </h2>
          <Link href="/opportunities" className="text-calm hover:underline">
            Back to Opportunities
          </Link>
        </div>
      </div>
    )
  }

  const isExpired = new Date(opportunity.application_deadline) < new Date()
  const isClosed = opportunity.status !== 'Open'
  const canApply = userType === 'Speaker' && !isExpired && !isClosed && !existingApplication

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Button & Actions */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/opportunities"
          className="inline-flex items-center text-calm hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Link>
        
        {isOwner && (
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center px-4 py-2 bg-calm text-white rounded-md hover:bg-deep transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>

      {/* Application Status (for speakers) */}
      {existingApplication && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-900 mb-1">Your Application Status:</p>
              {getApplicationStatusBadge(existingApplication.status)}
            </div>
            {existingApplication.status === 'Pending' && (
              <p className="text-sm text-gray-600">
                Applied on {new Date(existingApplication.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          {existingApplication.status === 'Accepted' && (
            <div className="mt-3 p-3 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                Congratulations! The organization will contact you with further details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Opportunity Status */}
      {(isClosed || isExpired) && !existingApplication && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">
                {isExpired ? 'Application deadline has passed' : `This opportunity is ${opportunity.status}`}
              </p>
              {isExpired && (
                <p className="text-sm text-yellow-700 mt-1">
                  The deadline was {new Date(opportunity.application_deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-deep mb-2">{opportunity.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {opportunity.organizations.verified && (
              <span className="inline-flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified Organization
              </span>
            )}
            <span>Posted by {opportunity.organizations.name}</span>
            <span>•</span>
            <span>{opportunity.application_count || 0} applications</span>
            <span>•</span>
            <span>{opportunity.view_count || 0} views</span>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{opportunity.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-calm mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">
                    {new Date(opportunity.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {opportunity.event_time && (
                      <span className="block text-sm">
                        {formatTime(opportunity.event_time)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-calm mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">
                    {opportunity.event_format === 'Virtual' ? 'Virtual Event' : (opportunity.location || 'TBD')}
                    {opportunity.venue_name && (
                      <span className="block text-sm">{opportunity.venue_name}</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Users className="h-5 w-5 text-calm mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Audience</p>
                  <p className="font-medium">
                    {opportunity.audience_size ? `${opportunity.audience_size.toLocaleString()} attendees` : 'Size TBD'}
                    {opportunity.audience_type && (
                      <span className="block text-sm">{opportunity.audience_type}</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-calm mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{formatDuration(opportunity.duration_hours)}</p>
                </div>
              </div>

              {opportunity.speaker_type && (
                <div className="flex items-start">
                  <Briefcase className="h-5 w-5 text-calm mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Speaker Type</p>
                    <p className="font-medium">{opportunity.speaker_type}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Compensation & Logistics</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-calm mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Speaker Fee</p>
                  <p className="font-medium">
                    {opportunity.compensation_amount 
                      ? `$${opportunity.compensation_amount.toLocaleString()} ${opportunity.compensation_type || ''}`.trim()
                      : 'Negotiable'}
                  </p>
                </div>
              </div>
              
              {(opportunity.travel_covered || opportunity.accommodation_covered) && (
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Included</p>
                    <div className="font-medium">
                      {opportunity.travel_covered && <span className="block">✓ Travel</span>}
                      {opportunity.accommodation_covered && <span className="block">✓ Accommodation</span>}
                    </div>
                  </div>
                </div>
              )}
              
              {opportunity.additional_benefits && (
                <div className="flex items-start">
                  <Award className="h-5 w-5 text-calm mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Additional Benefits</p>
                    <p className="font-medium">{opportunity.additional_benefits}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-calm mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Application Deadline</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                    {new Date(opportunity.application_deadline).toLocaleDateString()}
                    {isExpired && ' (Closed)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topics */}
        {opportunity.topics && opportunity.topics.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Topics of Interest</h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-calm/10 text-calm rounded-full text-sm font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Required Specialties */}
        {opportunity.required_specialties && opportunity.required_specialties.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Required Specialties</h3>
            <ul className="space-y-2">
              {opportunity.required_specialties.map((specialty, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{specialty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preferred Experience */}
        {opportunity.preferred_experience_years && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Preferred Experience</h3>
            <p className="text-gray-600">
              {opportunity.preferred_experience_years} year{opportunity.preferred_experience_years !== 1 ? 's' : ''} of speaking experience preferred
            </p>
          </div>
        )}

        {/* Additional Terms */}
        {opportunity.additional_terms && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              <Info className="inline-block h-5 w-5 mr-1" />
              Additional Terms & Conditions
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">{opportunity.additional_terms}</p>
          </div>
        )}
      </div>

      {/* Organization Details */}
      {opportunity.organizations && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">About {opportunity.organizations.name}</h3>
          <p className="text-gray-600 mb-4">
            {opportunity.organizations.description || 'No description available'}
          </p>
          <div className="flex flex-wrap gap-4">
            {opportunity.organizations.website && (
              <a
                href={opportunity.organizations.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-calm hover:underline"
              >
                <Globe className="h-4 w-4 mr-2" />
                Website
              </a>
            )}
            {opportunity.organizations.email && (
              <a
                href={`mailto:${opportunity.organizations.email}`}
                className="flex items-center text-calm hover:underline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </a>
            )}
            {opportunity.organizations.phone && (
              <a
                href={`tel:${opportunity.organizations.phone}`}
                className="flex items-center text-calm hover:underline"
              >
                <Phone className="h-4 w-4 mr-2" />
                {opportunity.organizations.phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Speaker Actions */}
        {userType === 'Speaker' && (
          <>
            {canApply && (
              <button
                onClick={() => setShowApplicationModal(true)}
                className="btn btn-primary flex-1 sm:flex-initial"
              >
                Apply Now
              </button>
            )}
            
            {existingApplication && existingApplication.status === 'Pending' && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="btn btn-secondary flex-1 sm:flex-initial"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw Application'
                )}
              </button>
            )}
          </>
        )}

        {/* Organization Actions */}
        {isOwner && (
          <Link
            href="/applications"
            className="btn btn-primary flex-1 sm:flex-initial text-center"
          >
            View Applications
          </Link>
        )}
      </div>

      {/* Application Modal - Only render when open and opportunity exists */}
      {showApplicationModal && opportunity && (
        <ApplicationModal
          opportunity={opportunity}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {
            setShowApplicationModal(false)
            fetchOpportunity() // Refresh to show application status
          }}
        />
      )}

      {/* Edit Modal - Only render when open and opportunity exists */}
      {showEditModal && isOwner && opportunity && (
        <OpportunityEditModal
          opportunity={opportunity}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchOpportunity() // Refresh opportunity data
          }}
        />
      )}
    </div>
  )
}