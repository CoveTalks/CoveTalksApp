'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Calendar, MapPin, DollarSign, Users, Search, Filter, ChevronRight } from 'lucide-react'

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
  audience_size: number
  topics: string[]
  status: string
  application_deadline: string
  created_at: string
  organizations: {
    name: string
    logo_url: string
  }
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchOpportunities()
  }, [])

  useEffect(() => {
    filterOpportunities()
  }, [opportunities, searchTerm, selectedFormat, selectedTopic, dateFilter])

  async function fetchOpportunities() {
    try {
      const { data, error } = await supabase
        .from('speaking_opportunities')
        .select(`
          *,
          organizations (
            name,
            logo_url
          )
        `)
        .eq('status', 'Open')
        .gte('application_deadline', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (error) throw error

      if (data) {
        setOpportunities(data)
        setFilteredOpportunities(data)
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

    // Format filter
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(opp => opp.event_format === selectedFormat)
    }

    // Topic filter
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(opp => 
        opp.topics?.includes(selectedTopic)
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(opp => {
        const eventDate = new Date(opp.event_date)
        switch(dateFilter) {
          case '30days':
            return eventDate <= thirtyDays
          case '60days':
            return eventDate <= sixtyDays
          case 'future':
            return eventDate > sixtyDays
          default:
            return true
        }
      })
    }

    setFilteredOpportunities(filtered)
  }

  async function applyToOpportunity(opportunityId: string) {
    // Navigate to application form
    window.location.href = `/applications/new?opportunity=${opportunityId}`
  }

  // Extract unique topics from all opportunities
  const allTopics = Array.from(new Set(opportunities.flatMap(opp => opp.topics || [])))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Add the header here */}
      <DashboardHeader 
        title="Speaking Opportunities" 
        description="Discover and apply to speaking opportunities that match your expertise"
      />
      
      {/* Then your existing page content */}

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">Speaking Opportunities</h1>
        <p className="mt-2 text-gray-600">
          Discover and apply to speaking opportunities that match your expertise
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="form-label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Format Filter */}
          <div>
            <label className="form-label">Format</label>
            <select
              className="form-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="all">All Formats</option>
              <option value="In-Person">In-Person</option>
              <option value="Virtual">Virtual</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="form-label">Topic</label>
            <select
              className="form-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">All Topics</option>
              {allTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="form-label">Event Date</label>
            <select
              className="form-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Any Time</option>
              <option value="30days">Next 30 Days</option>
              <option value="60days">Next 60 Days</option>
              <option value="future">After 60 Days</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Found {filteredOpportunities.length} opportunities
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedFormat('all')
              setSelectedTopic('all')
              setDateFilter('all')
            }}
            className="text-sm text-calm hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="empty-state bg-white rounded-lg shadow-md p-12">
          <div className="text-center">
            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="dashboard-card hover-lift"
            >
              {/* Organization Info */}
              <div className="flex items-center mb-4">
                {opportunity.organizations?.logo_url ? (
                  <img
                    src={opportunity.organizations.logo_url}
                    alt={opportunity.organizations.name}
                    className="h-10 w-10 rounded-full mr-3"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-foam flex items-center justify-center mr-3">
                    <span className="text-deep font-bold">
                      {opportunity.organizations?.name?.[0] || 'O'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {opportunity.organizations?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Posted {new Date(opportunity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Opportunity Details */}
              <h3 className="text-xl font-bold text-deep mb-2">
                {opportunity.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {opportunity.description}
              </p>

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-calm" />
                  {new Date(opportunity.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-calm" />
                  {opportunity.event_format === 'Virtual' ? 'Virtual Event' : opportunity.location || 'Location TBD'}
                </div>
                
                {opportunity.compensation_amount && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-calm" />
                    ${opportunity.compensation_amount} {opportunity.compensation_type}
                  </div>
                )}
                
                {opportunity.audience_size && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-calm" />
                    {opportunity.audience_size} attendees expected
                  </div>
                )}
              </div>

              {/* Topics */}
              {opportunity.topics && opportunity.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {opportunity.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="badge badge-info"
                    >
                      {topic}
                    </span>
                  ))}
                  {opportunity.topics.length > 3 && (
                    <span className="badge bg-gray-100 text-gray-600">
                      +{opportunity.topics.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Application Deadline */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Apply by</p>
                    <p className="text-sm font-medium text-deep">
                      {new Date(opportunity.application_deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => applyToOpportunity(opportunity.id)}
                    className="btn btn-primary text-sm flex items-center"
                  >
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}