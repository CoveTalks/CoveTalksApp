'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar, MapPin, ChevronRight, FileText } from 'lucide-react'
import DashboardHeader from '@/components/layout/DashboardHeader'

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
  speaking_opportunities: {
    title: string
    event_date: string
    location: string
    event_format: string
    organizations: {
      name: string
      logo_url: string
    }
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
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

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          speaking_opportunities (
            title,
            event_date,
            location,
            event_format,
            organizations (
              name,
              logo_url
            )
          )
        `)
        .eq('speaker_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function withdrawApplication(applicationId: string) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'Withdrawn' })
        .eq('id', applicationId)

      if (error) throw error

      // Refresh applications
      fetchApplications()
    } catch (error) {
      console.error('Error withdrawing application:', error)
    }
  }

  function getStatusIcon(status: string) {
    switch(status) {
      case 'Accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'Withdrawn':
        return <XCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  function getStatusBadgeClass(status: string) {
    switch(status) {
      case 'Accepted':
        return 'badge-success'
      case 'Rejected':
        return 'badge-danger'
      case 'Withdrawn':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'badge-warning'
    }
  }

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">My Applications</h1>
        <p className="mt-2 text-gray-600">
          Track and manage your speaking opportunity applications
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
              <p className="text-sm text-gray-600">Pending</p>
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
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-deep">
                {applications.length > 0 
                  ? Math.round((applications.filter(a => a.status !== 'Pending').length / applications.length) * 100)
                  : 0}%
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-calm opacity-50" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-1 mb-6">
        <div className="flex space-x-1">
          {['all', 'Pending', 'Accepted', 'Rejected', 'Withdrawn'].map((status) => (
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
      {filteredApplications.length === 0 ? (
        <div className="empty-state bg-white rounded-lg shadow-md p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${filter.toLowerCase()} applications`}
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'Start applying to speaking opportunities to see them here'
                : `You don't have any applications with ${filter.toLowerCase()} status`}
            </p>
            {filter === 'all' && (
              <a href="/opportunities" className="btn btn-primary">
                Browse Opportunities
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Opportunity Info */}
                    <div className="flex items-start">
                      <div className="mr-4">
                        {application.speaking_opportunities.organizations?.logo_url ? (
                          <img
                            src={application.speaking_opportunities.organizations.logo_url}
                            alt={application.speaking_opportunities.organizations.name}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-foam flex items-center justify-center">
                            <span className="text-deep font-bold">
                              {application.speaking_opportunities.organizations?.name?.[0] || 'O'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-deep">
                          {application.speaking_opportunities.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {application.speaking_opportunities.organizations?.name}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-calm" />
                            {new Date(application.speaking_opportunities.event_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-calm" />
                            {application.speaking_opportunities.event_format === 'Virtual' 
                              ? 'Virtual Event' 
                              : application.speaking_opportunities.location || 'TBD'}
                          </div>
                        </div>

                        {/* Proposed Topics */}
                        {application.proposed_topics && application.proposed_topics.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Proposed Topics:</p>
                            <div className="flex flex-wrap gap-2">
                              {application.proposed_topics.map((topic, index) => (
                                <span key={index} className="badge badge-info">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Status Info */}
                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex items-center">
                            {getStatusIcon(application.status)}
                            <span className={`ml-2 badge ${getStatusBadgeClass(application.status)}`}>
                              {application.status}
                            </span>
                          </div>
                          
                          <span className="text-sm text-gray-500">
                            Applied {new Date(application.created_at).toLocaleDateString()}
                          </span>

                          {application.reviewed_at && (
                            <span className="text-sm text-gray-500">
                              • Reviewed {new Date(application.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Rejection Reason */}
                        {application.status === 'Rejected' && application.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800">
                              <strong>Feedback:</strong> {application.rejection_reason}
                            </p>
                          </div>
                        )}

                        {/* Notes */}
                        {application.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {application.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="btn btn-outline text-sm"
                    >
                      View Details
                    </button>
                    
                    {application.status === 'Pending' && (
                      <button
                        onClick={() => withdrawApplication(application.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Withdraw
                      </button>
                    )}

                    {application.status === 'Accepted' && (
                      <button className="btn btn-primary text-sm">
                        Message Organizer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-deep mb-4">Application Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Cover Letter</h3>
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                    {selectedApplication.cover_letter}
                  </p>
                </div>

                {selectedApplication.requested_fee && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Requested Fee</h3>
                    <p className="mt-2 text-gray-600">${selectedApplication.requested_fee}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}