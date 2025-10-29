'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  BuildingIcon,
  FileText,
  Clock,
  Award,
  CheckCircle,
  StickyNote,
  Eye,
  Phone,
  Mail
} from 'lucide-react'

interface SavedOrganization {
  id: string
  speaker_id: string
  organization_id: string
  notes: string | null
  created_at: string
  organization: {
    id: string
    name: string
    organization_type: string
    description: string | null
    website: string | null
    location: string | null
    city: string | null
    state: string | null
    email: string | null
    phone: string | null
    typical_audience_size: number | null
    event_frequency: string | null
    preferred_topics: string[] | null
    budget_range: any
    logo_url: string | null
    verified: boolean
  }
}

export default function SavedOrganizationsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [savedOrganizations, setSavedOrganizations] = useState<SavedOrganization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<SavedOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'Speaker' | 'Organization' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState<{ [key: string]: string }>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [removingOrg, setRemovingOrg] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('date')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    checkUserAndFetchSaved()
  }, [])

  useEffect(() => {
    filterAndSortOrganizations()
  }, [savedOrganizations, searchQuery, filterType, filterLocation, sortBy])

  async function checkUserAndFetchSaved() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user's member type
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('member_type')
        .eq('id', user.id)
        .single()

      if (memberError || !member) {
        console.error('Error fetching member:', memberError)
        router.push('/dashboard')
        return
      }

      setUserType(member.member_type as 'Speaker' | 'Organization')

      // Only speakers can save organizations
      if (member.member_type !== 'Speaker') {
        router.push('/dashboard')
        return
      }

      // Fetch saved organizations
      const { data: saved, error: savedError } = await supabase
        .from('saved_organizations')
        .select(`
          *,
          organization:organization_id (
            id,
            name,
            organization_type,
            description,
            website,
            location,
            city,
            state,
            email,
            phone,
            typical_audience_size,
            event_frequency,
            preferred_topics,
            budget_range,
            logo_url,
            verified
          )
        `)
        .eq('speaker_id', user.id)
        .order('created_at', { ascending: false })

      if (savedError) {
        console.error('Error fetching saved organizations:', savedError)
      } else {
        setSavedOrganizations(saved || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterAndSortOrganizations() {
    let filtered = [...savedOrganizations]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.organization.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.organization.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.organization.preferred_topics?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(item =>
        item.organization.organization_type === filterType
      )
    }

    // Apply location filter
    if (filterLocation) {
      filtered = filtered.filter(item => {
        const location = item.organization.location || 
                        `${item.organization.city || ''} ${item.organization.state || ''}`.trim()
        return location.toLowerCase().includes(filterLocation.toLowerCase())
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.organization.name.localeCompare(b.organization.name)
        case 'type':
          return a.organization.organization_type.localeCompare(b.organization.organization_type)
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredOrganizations(filtered)
  }

  async function handleUpdateNotes(savedOrgId: string) {
    if (!tempNotes[savedOrgId]?.trim() && !savedOrganizations.find(s => s.id === savedOrgId)?.notes) {
      setEditingNotes(null)
      return
    }

    setSavingNotes(savedOrgId)
    try {
      const { error } = await supabase
        .from('saved_organizations')
        .update({ 
          notes: tempNotes[savedOrgId] || null 
        })
        .eq('id', savedOrgId)

      if (error) throw error

      // Update local state
      setSavedOrganizations(prev => prev.map(org => 
        org.id === savedOrgId 
          ? { ...org, notes: tempNotes[savedOrgId] || null }
          : org
      ))

      setEditingNotes(null)
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes')
    } finally {
      setSavingNotes(null)
    }
  }

  async function handleRemoveOrganization(savedOrgId: string, orgName: string) {
    if (!confirm(`Remove ${orgName} from your saved organizations?`)) return

    setRemovingOrg(savedOrgId)
    try {
      const { error } = await supabase
        .from('saved_organizations')
        .delete()
        .eq('id', savedOrgId)

      if (error) throw error

      // Update local state
      setSavedOrganizations(prev => prev.filter(org => org.id !== savedOrgId))
    } catch (error) {
      console.error('Error removing organization:', error)
      alert('Failed to remove organization')
    } finally {
      setRemovingOrg(null)
    }
  }

  function startEditingNotes(savedOrgId: string, currentNotes: string | null) {
    setEditingNotes(savedOrgId)
    setTempNotes({ ...tempNotes, [savedOrgId]: currentNotes || '' })
  }

  function cancelEditingNotes() {
    setEditingNotes(null)
    setTempNotes({})
  }

  function formatBudgetRange(budgetRange: any): string {
    if (!budgetRange) return 'Not specified'
    if (budgetRange.min && budgetRange.max) {
      return `$${budgetRange.min.toLocaleString()} - $${budgetRange.max.toLocaleString()}`
    }
    if (budgetRange.min) {
      return `From $${budgetRange.min.toLocaleString()}`
    }
    if (budgetRange.max) {
      return `Up to $${budgetRange.max.toLocaleString()}`
    }
    return 'Varies'
  }

  function formatOrgType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Get unique org types and locations for filters
  const allOrgTypes = Array.from(new Set(
    savedOrganizations.map(s => s.organization.organization_type)
  )).sort()

  const allLocations = Array.from(new Set(
    savedOrganizations.map(s => {
      const location = s.organization.location || 
                      `${s.organization.city || ''} ${s.organization.state || ''}`.trim()
      return location
    }).filter(Boolean)
  )).sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-calm" />
      </div>
    )
  }

  if (userType !== 'Speaker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BuildingIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only speakers can save organizations.</p>
          <Link href="/dashboard" className="text-calm hover:underline mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-deep">Saved Organizations</h1>
              <p className="text-gray-600 mt-1">
                Organizations you're interested in speaking for
              </p>
            </div>
            <Link
              href="/organizations"
              className="px-4 py-2 bg-calm text-white rounded-lg hover:bg-deep transition-colors"
            >
              Browse More Organizations
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-calm mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{savedOrganizations.length}</p>
                  <p className="text-sm text-gray-600">Saved Organizations</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-calm mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {savedOrganizations.filter(s => s.organization.verified).length}
                  </p>
                  <p className="text-sm text-gray-600">Verified Organizations</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <StickyNote className="h-8 w-8 text-calm mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {savedOrganizations.filter(s => s.notes).length}
                  </p>
                  <p className="text-sm text-gray-600">With Notes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search saved organizations by name, description, topics, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'type')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
            >
              <option value="date">Recently Saved</option>
              <option value="name">Name (A-Z)</option>
              <option value="type">Organization Type</option>
            </select>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {allOrgTypes.map(type => (
                    <option key={type} value={type}>{formatOrgType(type)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Location
                </label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {allLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Saved Organizations List */}
        {filteredOrganizations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BuildingIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterType || filterLocation 
                ? 'No organizations match your filters' 
                : 'No saved organizations yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType || filterLocation 
                ? 'Try adjusting your search or filters'
                : 'Start browsing organizations to save potential speaking opportunities'}
            </p>
            {!searchQuery && !filterType && !filterLocation && (
              <Link
                href="/organizations"
                className="inline-flex items-center px-6 py-3 bg-calm text-white rounded-lg hover:bg-deep transition-colors"
              >
                Browse Organizations
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrganizations.map((savedOrg) => (
              <div key={savedOrg.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Organization Logo */}
                      <Link href={`/organizations/${savedOrg.organization.id}`}>
                        {savedOrg.organization.logo_url ? (
                          <img
                            src={savedOrg.organization.logo_url}
                            alt={savedOrg.organization.name}
                            className="h-20 w-20 rounded-lg object-cover hover:ring-4 hover:ring-calm/20 transition-all"
                          />
                        ) : (
                          <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center hover:ring-4 hover:ring-calm/20 transition-all">
                            <Building2 className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </Link>

                      {/* Organization Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link 
                              href={`/organizations/${savedOrg.organization.id}`}
                              className="text-xl font-bold text-deep hover:underline flex items-center"
                            >
                              {savedOrg.organization.name}
                              {savedOrg.organization.verified && (
                                <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                              )}
                            </Link>
                            <p className="text-gray-600">
                              {formatOrgType(savedOrg.organization.organization_type)}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              href={`/organizations/${savedOrg.organization.id}`}
                              className="p-2 text-gray-600 hover:text-calm transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/opportunities?organization=${savedOrg.organization.id}`}
                              className="p-2 text-gray-600 hover:text-calm transition-colors"
                              title="View Opportunities"
                            >
                              <Calendar className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleRemoveOrganization(savedOrg.id, savedOrg.organization.name)}
                              disabled={removingOrg === savedOrg.id}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Remove from Saved"
                            >
                              {removingOrg === savedOrg.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {savedOrg.organization.description && (
                          <p className="text-gray-700 mt-2 line-clamp-2">
                            {savedOrg.organization.description}
                          </p>
                        )}

                        {/* Details */}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          {(savedOrg.organization.city || savedOrg.organization.state || savedOrg.organization.location) && (
                            <span className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-1" />
                              {savedOrg.organization.location || 
                               `${savedOrg.organization.city || ''}${savedOrg.organization.city && savedOrg.organization.state ? ', ' : ''}${savedOrg.organization.state || ''}`}
                            </span>
                          )}
                          {savedOrg.organization.typical_audience_size && (
                            <span className="flex items-center text-gray-600">
                              <Users className="h-4 w-4 mr-1" />
                              {savedOrg.organization.typical_audience_size} typical audience
                            </span>
                          )}
                          {savedOrg.organization.event_frequency && (
                            <span className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              {savedOrg.organization.event_frequency}
                            </span>
                          )}
                          {savedOrg.organization.budget_range && (
                            <span className="flex items-center text-gray-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatBudgetRange(savedOrg.organization.budget_range)}
                            </span>
                          )}
                        </div>

                        {/* Preferred Topics */}
                        {savedOrg.organization.preferred_topics && savedOrg.organization.preferred_topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {savedOrg.organization.preferred_topics.slice(0, 5).map((topic, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-calm/10 text-calm text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                            {savedOrg.organization.preferred_topics.length > 5 && (
                              <span className="px-2 py-1 text-gray-600 text-xs">
                                +{savedOrg.organization.preferred_topics.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="flex gap-3 mt-3">
                          {savedOrg.organization.website && (
                            <a
                              href={savedOrg.organization.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-calm hover:underline"
                            >
                              <Globe className="h-4 w-4 mr-1" />
                              Website
                            </a>
                          )}
                          {savedOrg.organization.email && (
                            <a
                              href={`mailto:${savedOrg.organization.email}`}
                              className="flex items-center text-sm text-calm hover:underline"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </a>
                          )}
                          {savedOrg.organization.phone && (
                            <span className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-1" />
                              {savedOrg.organization.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Notes</span>
                        </div>
                        
                        {editingNotes === savedOrg.id ? (
                          <div>
                            <textarea
                              value={tempNotes[savedOrg.id] || ''}
                              onChange={(e) => setTempNotes({ ...tempNotes, [savedOrg.id]: e.target.value })}
                              placeholder="Add notes about this organization..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateNotes(savedOrg.id)}
                                disabled={savingNotes === savedOrg.id}
                                className="px-3 py-1 bg-calm text-white rounded-lg hover:bg-deep transition-colors disabled:opacity-50 flex items-center"
                              >
                                {savingNotes === savedOrg.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Save className="h-4 w-4 mr-1" />
                                )}
                                Save
                              </button>
                              <button
                                onClick={cancelEditingNotes}
                                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {savedOrg.notes ? (
                              <p className="text-gray-700 whitespace-pre-wrap">{savedOrg.notes}</p>
                            ) : (
                              <p className="text-gray-400 italic">No notes added</p>
                            )}
                            <button
                              onClick={() => startEditingNotes(savedOrg.id, savedOrg.notes)}
                              className="mt-2 text-sm text-calm hover:underline flex items-center"
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              {savedOrg.notes ? 'Edit notes' : 'Add notes'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Saved Date */}
                    <div className="flex items-center mt-4 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Saved on {new Date(savedOrg.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination or Load More could go here if needed */}
        {filteredOrganizations.length > 0 && filteredOrganizations.length < savedOrganizations.length && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredOrganizations.length} of {savedOrganizations.length} saved organizations
          </div>
        )}
      </div>
    </div>
  )
}