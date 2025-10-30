'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  FileText,
  Users,
  DollarSign,
  User,
  Mail,
  Phone,
  Globe,
  Award,
  Star
} from 'lucide-react'
import DashboardHeader from '@/components/layout/DashboardHeader'

interface Speaker {
  id: string
  name: string
  email: string
  phone: string
  location: string
  profile_image_url: string
  bio: string
  specialties: string[]
  experience_years: number
  minimum_fee: number
  maximum_fee: number
  website: string
  linkedin_url: string
  speaking_topics: string[]
}

interface Opportunity {
  id: string
  title: string
  event_date: string
  location: string
  event_format: string
  compensation_amount: number  // Changed from budget_range
  compensation_type: string    // Added
  audience_size: number        // Changed from string to number
  description: string
  venue_name: string           // Added
  duration_hours: number       // Added
}

interface Application {
  id: string
  opportunity_id: string
  speaker_id: string
  cover_letter: string
  proposed_topics: string[]
  requested_fee: number
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn'
  created_at: string
  reviewed_at: string
  rejection_reason: string
  notes: string
  speaker: Speaker
  speaking_opportunities: Opportunity
}

export default function OrganizationApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchApplications()
  }, [])

  async function fetchApplications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // First get the organization ID for this user
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_id', user.id)
        .single()

      if (!orgMember) {
        throw new Error('Not an organization member')
      }

      // Get all opportunities for this organization
      const { data: opportunities } = await supabase
        .from('speaking_opportunities')
        .select('id')
        .eq('organization_id', orgMember.organization_id)

      if (!opportunities || opportunities.length === 0) {
        setApplications([])
        setLoading(false)
        return
      }

      // Get all applications for these opportunities with correct column names
      const opportunityIds = opportunities.map(o => o.id)
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          speaker:speaker_id (
            id,
            name,
            email,
            phone,
            location,
            profile_image_url,
            bio,
            specialties,
            experience_years,
            minimum_fee,
            maximum_fee,
            website,
            linkedin_url,
            speaking_topics
          ),
          speaking_opportunities (
            id,
            title,
            event_date,
            location,
            event_format,
            compensation_amount,
            compensation_type,
            audience_size,
            description,
            venue_name,
            duration_hours
          )
        `)
        .in('opportunity_id', opportunityIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      if (data) {
        // Transform the data to match our interface
        const transformedData = data.map(item => ({
          ...item,
          speaker: item.speaker || {} // Ensure speaker exists
        }))
        setApplications(transformedData)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateApplicationStatus(
    applicationId: string, 
    status: 'Accepted' | 'Rejected',
    reason?: string
  ) {
    setProcessingId(applicationId)
    
    try {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString()
      }

      if (status === 'Rejected' && reason) {
        updateData.rejection_reason = reason
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)

      if (error) throw error

      // Send notification to speaker (you can implement this later)
      // await sendNotificationToSpeaker(applicationId, status, reason)

      // Refresh applications
      await fetchApplications()
      
      // Close modals
      setSelectedApplication(null)
      setShowRejectionModal(false)
      setRejectionReason('')
      
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing application:`, error)
    } finally {
      setProcessingId(null)
    }
  }

  function acceptApplication(applicationId: string) {
    updateApplicationStatus(applicationId, 'Accepted')
  }

  function rejectApplication(applicationId: string) {
    updateApplicationStatus(applicationId, 'Rejected', rejectionReason)
  }

  function getStatusIcon(status: string) {
    switch(status) {
      case 'Accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'Withdrawn':
        return <XCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  function getStatusColor(status: string) {
    switch(status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Withdrawn':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Helper function to format compensation
  function formatCompensation(amount: number | null, type: string | null) {
    if (!amount && !type) return 'Negotiable'
    if (type === 'Volunteer' || type === 'Pro Bono') return type
    if (amount) return `$${amount.toLocaleString()}`
    return type || 'Negotiable'
  }

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter)

  // Group applications by opportunity
  const groupedApplications = filteredApplications.reduce((acc, application) => {
    const oppId = application.opportunity_id
    if (!acc[oppId]) {
      acc[oppId] = {
        opportunity: application.speaking_opportunities,
        applications: []
      }
    }
    acc[oppId].applications.push(application)
    return acc
  }, {} as Record<string, { opportunity: Opportunity, applications: Application[] }>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep">Applications Manager</h1>
          <p className="mt-2 text-gray-600">
            Review and manage speaker applications for your opportunities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-deep">{applications.length}</p>
              </div>
              <FileText className="h-8 w-8 text-calm opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter(a => a.status === 'Pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter(a => a.status === 'Accepted').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold text-deep">
                  {Object.keys(groupedApplications).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-calm opacity-50" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 mb-6">
          <div className="flex space-x-1">
            {['all', 'Pending', 'Accepted', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-calm text-white'
                    : 'text-gray-600 hover:bg-foam'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'all' && ` (${applications.length})`}
                {status !== 'all' && ` (${applications.filter(a => a.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {Object.keys(groupedApplications).length === 0 ? (
          <div className="empty-state bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications yet
              </h3>
              <p className="text-gray-500 mb-4">
                Applications will appear here when speakers apply to your opportunities
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedApplications).map(([oppId, group]) => (
              <div key={oppId} className="bg-white rounded-lg shadow-md">
                {/* Opportunity Header */}
                <div className="bg-foam p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-deep">{group.opportunity.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-calm" />
                          {new Date(group.opportunity.event_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-calm" />
                          {group.opportunity.location || 'Virtual'}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-calm" />
                          {formatCompensation(group.opportunity.compensation_amount, group.opportunity.compensation_type)}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-calm" />
                          {group.opportunity.audience_size ? `${group.opportunity.audience_size} attendees` : 'TBD'}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-info">
                      {group.applications.length} Applications
                    </span>
                  </div>
                </div>

                {/* Applications for this Opportunity */}
                <div className="divide-y">
                  {group.applications.map((application) => (
                    <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start">
                        {/* Speaker Avatar */}
                        <div className="mr-4 flex-shrink-0">
                          {application.speaker?.profile_image_url ? (
                            <img
                              src={application.speaker.profile_image_url}
                              alt={application.speaker.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-foam flex items-center justify-center">
                              <User className="w-8 h-8 text-calm" />
                            </div>
                          )}
                        </div>

                        {/* Application Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-deep">
                                {application.speaker?.name || 'Unknown Speaker'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {application.speaker?.location || 'Location not specified'}
                                {application.speaker?.experience_years && 
                                  ` • ${application.speaker.experience_years} years experience`}
                              </p>

                              {/* Status Badge */}
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                  {getStatusIcon(application.status)}
                                  <span className="ml-1">{application.status}</span>
                                </span>
                                <span className="text-xs text-gray-500">
                                  Applied {new Date(application.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Topics */}
                              {application.proposed_topics && application.proposed_topics.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-500 mb-1">Proposed Topics:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {application.proposed_topics.map((topic, index) => (
                                      <span key={index} className="px-2 py-1 bg-calm/10 text-calm rounded text-xs">
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cover Letter Preview */}
                              {application.cover_letter && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {application.cover_letter}
                                  </p>
                                </div>
                              )}

                              {/* Fee */}
                              {application.requested_fee && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Requested Fee: ${application.requested_fee.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="ml-4">
                              {application.status === 'Pending' && (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => acceptApplication(application.id)}
                                    disabled={processingId === application.id}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50 block w-full"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(application)
                                      setShowRejectionModal(true)
                                    }}
                                    disabled={processingId === application.id}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50 block w-full"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => setSelectedApplication(application)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm block w-full"
                                  >
                                    View Details
                                  </button>
                                </div>
                              )}

                              {application.status === 'Accepted' && (
                                <button
                                  onClick={() => setSelectedApplication(application)}
                                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                                >
                                  View Details
                                </button>
                              )}

                              {application.status === 'Rejected' && (
                                <button
                                  onClick={() => setSelectedApplication(application)}
                                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                                >
                                  View Details
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && !showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-deep">Application Details</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Opportunity Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Opportunity Details</h4>
                  <p className="text-lg font-medium text-deep">{selectedApplication.speaking_opportunities.title}</p>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Date:</strong> {new Date(selectedApplication.speaking_opportunities.event_date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Location:</strong> {selectedApplication.speaking_opportunities.location || 'Virtual'}
                    </div>
                    <div>
                      <strong>Format:</strong> {selectedApplication.speaking_opportunities.event_format}
                    </div>
                    <div>
                      <strong>Duration:</strong> {selectedApplication.speaking_opportunities.duration_hours ? `${selectedApplication.speaking_opportunities.duration_hours} hours` : 'TBD'}
                    </div>
                    <div>
                      <strong>Compensation:</strong> {formatCompensation(selectedApplication.speaking_opportunities.compensation_amount, selectedApplication.speaking_opportunities.compensation_type)}
                    </div>
                    <div>
                      <strong>Audience Size:</strong> {selectedApplication.speaking_opportunities.audience_size || 'TBD'}
                    </div>
                  </div>
                </div>

                {/* Speaker Info */}
                <div className="flex items-start space-x-4 mb-6">
                  {selectedApplication.speaker?.profile_image_url ? (
                    <img
                      src={selectedApplication.speaker.profile_image_url}
                      alt={selectedApplication.speaker.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{selectedApplication.speaker?.name || 'Unknown Speaker'}</h3>
                    <p className="text-gray-600">{selectedApplication.speaker?.location || 'Location not specified'}</p>
                    {selectedApplication.speaker?.experience_years && (
                      <p className="text-sm text-gray-500">{selectedApplication.speaker.experience_years} years experience</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {selectedApplication.speaker?.bio && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">About the Speaker</h4>
                    <p className="text-gray-600">{selectedApplication.speaker.bio}</p>
                  </div>
                )}

                {/* Specialties */}
                {selectedApplication.speaker?.specialties && selectedApplication.speaker.specialties.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.speaker.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-3 py-1 bg-calm/10 text-calm rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                )}

                {/* Proposed Topics */}
                {selectedApplication.proposed_topics && selectedApplication.proposed_topics.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Proposed Topics</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {selectedApplication.proposed_topics.map((topic, index) => (
                        <li key={index}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fee & Contact */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold mb-2">Fee Information</h4>
                    <p className="text-gray-600">
                      Requested: ${selectedApplication.requested_fee?.toLocaleString() || 'Not specified'}
                    </p>
                    {selectedApplication.speaker && (
                      <p className="text-sm text-gray-500">
                        Speaker's Range: ${selectedApplication.speaker.minimum_fee?.toLocaleString() || '0'} - 
                        ${selectedApplication.speaker.maximum_fee?.toLocaleString() || 'Negotiable'}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <p className="text-gray-600">{selectedApplication.speaker?.email || 'Email not available'}</p>
                    {selectedApplication.speaker?.phone && (
                      <p className="text-gray-600">{selectedApplication.speaker.phone}</p>
                    )}
                    {selectedApplication.speaker?.website && (
                      <p className="text-gray-600">
                        <a href={selectedApplication.speaker.website} target="_blank" rel="noopener noreferrer" className="text-calm hover:underline">
                          Website
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Info */}
                {(selectedApplication.status === 'Rejected' && selectedApplication.rejection_reason) && (
                  <div className="mb-6 p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-red-800">Rejection Reason</h4>
                    <p className="text-red-700">{selectedApplication.rejection_reason}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedApplication.status === 'Pending' && (
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectionModal(true)
                      }}
                      disabled={processingId === selectedApplication.id}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => acceptApplication(selectedApplication.id)}
                      disabled={processingId === selectedApplication.id}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Accept Application
                    </button>
                  </div>
                )}

                {selectedApplication.status !== 'Pending' && (
                  <div className="flex justify-end pt-6 border-t">
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejecting this application. This will be shared with the speaker.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="Enter rejection reason..."
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false)
                      setRejectionReason('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedApplication && rejectionReason.trim()) {
                        rejectApplication(selectedApplication.id)
                      }
                    }}
                    disabled={!rejectionReason.trim() || processingId === selectedApplication.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}