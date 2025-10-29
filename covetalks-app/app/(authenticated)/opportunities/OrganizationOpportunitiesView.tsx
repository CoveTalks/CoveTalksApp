'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'

interface Opportunity {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  venue_name: string
  event_format: 'In-Person' | 'Virtual' | 'Hybrid'
  compensation_amount: number
  compensation_type: string
  audience_size: string
  budget_range: string
  topics: string[]
  requirements: string[]
  status: 'Open' | 'Closed' | 'Filled' | 'Cancelled'
  application_deadline: string
  created_at: string
  updated_at: string
  // Add application count
  applications: {
    count: number
  }[]
  // Add accepted speaker info if filled
  accepted_speaker?: {
    name: string
    profile_image_url: string
  }
}

export default function OrganizationOpportunitiesView() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchOpportunities()
  }, [])

  useEffect(() => {
    filterOpportunities()
  }, [opportunities, searchTerm, statusFilter])

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActionMenu(null)
    if (showActionMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showActionMenu])

  async function fetchOpportunities() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get organization ID
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_id', user.id)
        .single()

      if (!orgMember) {
        console.error('Not an organization member')
        setLoading(false)
        return
      }

      setOrganizationId(orgMember.organization_id)

      // Fetch opportunities
      const { data, error } = await supabase
        .from('speaking_opportunities')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get application counts for each opportunity
      if (data) {
        const opportunitiesWithCounts = await Promise.all(
          data.map(async (opp) => {
            // Get application count
            const { count } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('opportunity_id', opp.id)

            // Get accepted speaker if status is Filled
            let acceptedSpeaker = null
            if (opp.status === 'Filled') {
              const { data: acceptedApp } = await supabase
                .from('applications')
                .select(`
                  members!speaker_id (
                    name,
                    profile_image_url
                  )
                `)
                .eq('opportunity_id', opp.id)
                .eq('status', 'Accepted')
                .single()

              if (acceptedApp) {
                acceptedSpeaker = acceptedApp.members
              }
            }

            return {
              ...opp,
              applications: [{ count: count || 0 }],
              accepted_speaker: acceptedSpeaker
            }
          })
        )

        setOpportunities(opportunitiesWithCounts)
        setFilteredOpportunities(opportunitiesWithCounts)
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterOpportunities() {
    let filtered = opportunities

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(opp => opp.status === statusFilter)
    }

    setFilteredOpportunities(filtered)
  }

  async function updateOpportunityStatus(opportunityId: string, status: string) {
    try {
      const { error } = await supabase
        .from('speaking_opportunities')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)

      if (error) throw error

      // Refresh opportunities
      fetchOpportunities()
    } catch (error) {
      console.error('Error updating opportunity:', error)
    }
  }

  async function deleteOpportunity(opportunityId: string) {
    try {
      const { error } = await supabase
        .from('speaking_opportunities')
        .delete()
        .eq('id', opportunityId)

      if (error) throw error

      // Refresh opportunities
      fetchOpportunities()
      setShowDeleteModal(false)
      setSelectedOpportunity(null)
    } catch (error) {
      console.error('Error deleting opportunity:', error)
    }
  }

  function getStatusColor(status: string) {
    switch(status) {
      case 'Open':
        return 'bg-green-100 text-green-800'
      case 'Closed':
        return 'bg-gray-100 text-gray-800'
      case 'Filled':
        return 'bg-blue-100 text-blue-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusIcon(status: string) {
    switch(status) {
      case 'Open':
        return <Clock className="h-4 w-4" />
      case 'Filled':
        return <CheckCircle className="h-4 w-4" />
      case 'Closed':
        return <XCircle className="h-4 w-4" />
      case 'Cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  // Calculate stats
  const stats = {
    total: opportunities.length,
    open: opportunities.filter(o => o.status === 'Open').length,
    filled: opportunities.filter(o => o.status === 'Filled').length,
    totalApplications: opportunities.reduce((sum, opp) => sum + (opp.applications?.[0]?.count || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Page Header - Mobile Responsive */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-deep">Manage Opportunities</h1>
          <p className="mt-1 lg:mt-2 text-sm lg:text-base text-gray-600">
            Create and manage your speaking opportunities
          </p>
        </div>
        <Link
          href="/opportunities/create"
          className="btn btn-primary flex items-center justify-center sm:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span className="whitespace-nowrap">Post New Opportunity</span>
        </Link>
      </div>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600">Total</p>
              <p className="text-xl lg:text-2xl font-bold text-deep">{stats.total}</p>
            </div>
            <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-calm opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600">Open</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.open}</p>
            </div>
            <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600">Filled</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-600">{stats.filled}</p>
            </div>
            <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600">Applications</p>
              <p className="text-xl lg:text-2xl font-bold text-deep">{stats.totalApplications}</p>
            </div>
            <Users className="h-6 w-6 lg:h-8 lg:w-8 text-sand opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters Section - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6 lg:mb-8">
        <div className="flex flex-col gap-3 lg:gap-4 lg:flex-row">
          {/* Search - Full Width on Mobile */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10 w-full h-10 lg:h-11"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter - Full Width on Mobile */}
          <div className="w-full lg:w-48">
            <select
              className="form-select w-full h-10 lg:h-11"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Filled">Filled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mt-3 lg:mt-4 flex items-center justify-between">
          <p className="text-xs lg:text-sm text-gray-600">
            Showing {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
            }}
            className="text-xs lg:text-sm text-calm hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Opportunities List - Mobile Responsive */}
      {filteredOpportunities.length === 0 ? (
        <div className="empty-state bg-white rounded-lg shadow-md p-8 lg:p-12">
          <div className="text-center">
            <FileText className="h-10 w-10 lg:h-12 lg:w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' && searchTerm === '' 
                ? 'No opportunities yet'
                : 'No opportunities found'}
            </h3>
            <p className="text-sm lg:text-base text-gray-500 mb-4">
              {statusFilter === 'all' && searchTerm === ''
                ? 'Create your first speaking opportunity to get started'
                : 'Try adjusting your filters'}
            </p>
            {statusFilter === 'all' && searchTerm === '' && (
              <Link
                href="/opportunities/create"
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Post Your First Opportunity
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-4 lg:p-6">
                {/* Header with Title, Status, and Actions - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg lg:text-xl font-bold text-deep mb-2 pr-2">
                      {opportunity.title}
                    </h3>
                    <span className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(opportunity.status)}`}>
                      {getStatusIcon(opportunity.status)}
                      <span className="ml-1 lg:ml-2">{opportunity.status}</span>
                    </span>
                  </div>

                  {/* Action Menu - Mobile Friendly */}
                  <div className="relative self-start">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowActionMenu(showActionMenu === opportunity.id ? null : opportunity.id)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </button>
                    
                    {showActionMenu === opportunity.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                        <Link
                          href={`/opportunities/${opportunity.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                        <Link
                          href={`/applications?opportunity=${opportunity.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Applications
                        </Link>
                        <Link
                          href={`/opportunities/${opportunity.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedOpportunity(opportunity)
                            setShowDeleteModal(true)
                            setShowActionMenu(null)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description with proper wrapper and truncation */}
                <div className="mb-4 w-full overflow-hidden">
                  <p 
                    className="text-sm lg:text-base text-gray-600"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word'
                    }}
                  >
                    {opportunity.description || 'No description provided'}
                  </p>
                </div>

                {/* Details Grid - Mobile Responsive */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-1.5 lg:mr-2 text-calm mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Event Date</p>
                      <p className="text-xs lg:text-sm font-medium truncate">
                        {new Date(opportunity.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-1.5 lg:mr-2 text-calm mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-xs lg:text-sm font-medium truncate">
                        {opportunity.event_format === 'Virtual' ? 'Virtual' : (opportunity.location || 'TBD')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <DollarSign className="h-4 w-4 mr-1.5 lg:mr-2 text-calm mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="text-xs lg:text-sm font-medium truncate">
                        {opportunity.budget_range || 
                         (opportunity.compensation_amount ? `$${opportunity.compensation_amount}` : 'TBD')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-4 w-4 mr-1.5 lg:mr-2 text-calm mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Audience</p>
                      <p className="text-xs lg:text-sm font-medium truncate">
                        {opportunity.audience_size || 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Topics - Mobile Responsive */}
                {opportunity.topics && opportunity.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-4">
                    {opportunity.topics.map((topic) => (
                      <span
                        key={topic}
                        className="badge badge-info text-xs lg:text-sm px-2 py-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer with Application Info and Actions - Mobile Responsive */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  {/* Application Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs lg:text-sm">
                    <div>
                      <span className="text-gray-500">Applications: </span>
                      <span className="font-bold text-deep">
                        {opportunity.applications?.[0]?.count || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline: </span>
                      <span className={`font-medium ${
                        new Date(opportunity.application_deadline) < new Date() 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {new Date(opportunity.application_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {opportunity.status === 'Open' && (
                      <>
                        <button
                          onClick={() => updateOpportunityStatus(opportunity.id, 'Closed')}
                          className="btn btn-secondary text-sm flex-1 sm:flex-initial"
                        >
                          Close Applications
                        </button>
                        <Link
                          href={`/applications?opportunity=${opportunity.id}`}
                          className="btn btn-primary text-sm flex items-center justify-center flex-1 sm:flex-initial"
                        >
                          <span>Review Applications</span>
                          {opportunity.applications?.[0]?.count > 0 && (
                            <span className="ml-2 bg-white text-primary rounded-full px-1.5 lg:px-2 py-0.5 text-xs font-bold">
                              {opportunity.applications[0].count}
                            </span>
                          )}
                        </Link>
                      </>
                    )}
                    {opportunity.status === 'Closed' && (
                      <button
                        onClick={() => updateOpportunityStatus(opportunity.id, 'Open')}
                        className="btn btn-primary text-sm w-full sm:w-auto"
                      >
                        Reopen Applications
                      </button>
                    )}
                    {opportunity.status === 'Filled' && opportunity.accepted_speaker && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Speaker: {opportunity.accepted_speaker.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal - Mobile Responsive */}
      {showDeleteModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-4 lg:p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Opportunity</h3>
            <p className="text-sm lg:text-base text-gray-600 mb-6">
              Are you sure you want to delete "{selectedOpportunity.title}"? 
              This action cannot be undone and will also delete all associated applications.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedOpportunity(null)
                }}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOpportunity(selectedOpportunity.id)}
                className="btn bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
              >
                Delete Opportunity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}