'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star,
  MapPin,
  DollarSign,
  Globe,
  Linkedin,
  MessageSquare,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  UserX,
  FileText,
  Clock,
  Award,
  Languages,
  Users,
  CheckCircle,
  Calendar,
  StickyNote,
  Eye
} from 'lucide-react'

interface SavedSpeaker {
  id: string
  speaker_id: string
  organization_id: string
  notes: string | null
  created_at: string
  speaker: {
    id: string
    name: string
    email: string
    phone: string | null
    location: string | null
    bio: string | null
    website: string | null
    linkedin_url: string | null
    profile_image_url: string | null
    specialties: string[] | null
    years_experience: number | null
    speaking_fee_range: any
    languages: string[] | null
    average_rating: number | null
    total_reviews: number | null
    title: string | null
    verified: boolean
  }
}

export default function SavedSpeakersPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [savedSpeakers, setSavedSpeakers] = useState<SavedSpeaker[]>([])
  const [filteredSpeakers, setFilteredSpeakers] = useState<SavedSpeaker[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'Speaker' | 'Organization' | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState<{ [key: string]: string }>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [removingSpeaker, setRemovingSpeaker] = useState<string | null>(null)
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating'>('date')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    checkUserAndFetchSaved()
  }, [])

  useEffect(() => {
    filterAndSortSpeakers()
  }, [savedSpeakers, searchQuery, filterSpecialty, filterLocation, sortBy])

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

      // Only organizations can save speakers
      if (member.member_type !== 'Organization') {
        router.push('/dashboard')
        return
      }

      // Get organization ID
      const { data: orgMember, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_id', user.id)
        .single()

      if (orgError || !orgMember) {
        console.error('Error fetching organization:', orgError)
        router.push('/dashboard')
        return
      }

      setOrganizationId(orgMember.organization_id)

      // Fetch saved speakers
      const { data: saved, error: savedError } = await supabase
        .from('saved_speakers')
        .select(`
          *,
          speaker:speaker_id (
            id,
            name,
            email,
            phone,
            location,
            bio,
            website,
            linkedin_url,
            profile_image_url,
            specialties,
            years_experience,
            speaking_fee_range,
            languages,
            average_rating,
            total_reviews,
            title,
            verified
          )
        `)
        .eq('organization_id', orgMember.organization_id)
        .order('created_at', { ascending: false })

      if (savedError) {
        console.error('Error fetching saved speakers:', savedError)
      } else {
        setSavedSpeakers(saved || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterAndSortSpeakers() {
    let filtered = [...savedSpeakers]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.speaker.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.speaker.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply specialty filter
    if (filterSpecialty) {
      filtered = filtered.filter(item =>
        item.speaker.specialties?.some(s => s.toLowerCase().includes(filterSpecialty.toLowerCase()))
      )
    }

    // Apply location filter
    if (filterLocation) {
      filtered = filtered.filter(item =>
        item.speaker.location?.toLowerCase().includes(filterLocation.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.speaker.name.localeCompare(b.speaker.name)
        case 'rating':
          return (b.speaker.average_rating || 0) - (a.speaker.average_rating || 0)
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredSpeakers(filtered)
  }

  async function handleUpdateNotes(savedSpeakerId: string) {
    if (!tempNotes[savedSpeakerId]?.trim() && !savedSpeakers.find(s => s.id === savedSpeakerId)?.notes) {
      setEditingNotes(null)
      return
    }

    setSavingNotes(savedSpeakerId)
    try {
      const { error } = await supabase
        .from('saved_speakers')
        .update({ 
          notes: tempNotes[savedSpeakerId] || null 
        })
        .eq('id', savedSpeakerId)

      if (error) throw error

      // Update local state
      setSavedSpeakers(prev => prev.map(speaker => 
        speaker.id === savedSpeakerId 
          ? { ...speaker, notes: tempNotes[savedSpeakerId] || null }
          : speaker
      ))

      setEditingNotes(null)
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes')
    } finally {
      setSavingNotes(null)
    }
  }

  async function handleRemoveSpeaker(savedSpeakerId: string, speakerName: string) {
    if (!confirm(`Remove ${speakerName} from your saved speakers?`)) return

    setRemovingSpeaker(savedSpeakerId)
    try {
      const { error } = await supabase
        .from('saved_speakers')
        .delete()
        .eq('id', savedSpeakerId)

      if (error) throw error

      // Update local state
      setSavedSpeakers(prev => prev.filter(speaker => speaker.id !== savedSpeakerId))
    } catch (error) {
      console.error('Error removing speaker:', error)
      alert('Failed to remove speaker')
    } finally {
      setRemovingSpeaker(null)
    }
  }

  function startEditingNotes(savedSpeakerId: string, currentNotes: string | null) {
    setEditingNotes(savedSpeakerId)
    setTempNotes({ ...tempNotes, [savedSpeakerId]: currentNotes || '' })
  }

  function cancelEditingNotes() {
    setEditingNotes(null)
    setTempNotes({})
  }

  function formatFeeRange(feeRange: any): string {
    if (!feeRange) return 'Not specified'
    if (feeRange.min && feeRange.max) {
      return `$${feeRange.min.toLocaleString()} - $${feeRange.max.toLocaleString()}`
    }
    if (feeRange.min) {
      return `From $${feeRange.min.toLocaleString()}`
    }
    if (feeRange.max) {
      return `Up to $${feeRange.max.toLocaleString()}`
    }
    return 'Negotiable'
  }

  // Get unique specialties and locations for filters
  const allSpecialties = Array.from(new Set(
    savedSpeakers.flatMap(s => s.speaker.specialties || [])
  )).sort()

  const allLocations = Array.from(new Set(
    savedSpeakers.map(s => s.speaker.location).filter((loc): loc is string => loc !== null)
  )).sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-calm" />
      </div>
    )
  }

  if (userType !== 'Organization') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only organizations can save speakers.</p>
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
              <h1 className="text-3xl font-bold text-deep">Saved Speakers</h1>
              <p className="text-gray-600 mt-1">
                Manage your list of potential speakers for future events
              </p>
            </div>
            <Link
              href="/speakers"
              className="px-4 py-2 bg-calm text-white rounded-lg hover:bg-deep transition-colors"
            >
              Browse More Speakers
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-calm mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{savedSpeakers.length}</p>
                  <p className="text-sm text-gray-600">Saved Speakers</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-calm mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {savedSpeakers.filter(s => s.speaker.verified).length}
                  </p>
                  <p className="text-sm text-gray-600">Verified Speakers</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <StickyNote className="h-8 w-8 text-calm mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {savedSpeakers.filter(s => s.notes).length}
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
                  placeholder="Search saved speakers by name, bio, specialties, or notes..."
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
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'rating')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
            >
              <option value="date">Recently Saved</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Specialty
                </label>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent"
                >
                  <option value="">All Specialties</option>
                  {allSpecialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
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

        {/* Saved Speakers List */}
        {filteredSpeakers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterSpecialty || filterLocation 
                ? 'No speakers match your filters' 
                : 'No saved speakers yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterSpecialty || filterLocation 
                ? 'Try adjusting your search or filters'
                : 'Start browsing speakers to save potential matches for your events'}
            </p>
            {!searchQuery && !filterSpecialty && !filterLocation && (
              <Link
                href="/speakers"
                className="inline-flex items-center px-6 py-3 bg-calm text-white rounded-lg hover:bg-deep transition-colors"
              >
                Browse Speakers
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSpeakers.map((savedSpeaker) => (
              <div key={savedSpeaker.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Profile Image */}
                      <Link href={`/speakers/${savedSpeaker.speaker.id}`}>
                        {savedSpeaker.speaker.profile_image_url ? (
                          <img
                            src={savedSpeaker.speaker.profile_image_url}
                            alt={savedSpeaker.speaker.name}
                            className="h-20 w-20 rounded-full object-cover hover:ring-4 hover:ring-calm/20 transition-all"
                          />
                        ) : (
                          <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center hover:ring-4 hover:ring-calm/20 transition-all">
                            <Users className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </Link>

                      {/* Speaker Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link 
                              href={`/speakers/${savedSpeaker.speaker.id}`}
                              className="text-xl font-bold text-deep hover:underline flex items-center"
                            >
                              {savedSpeaker.speaker.name}
                              {savedSpeaker.speaker.verified && (
                                <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                              )}
                            </Link>
                            {savedSpeaker.speaker.title && (
                              <p className="text-gray-600">{savedSpeaker.speaker.title}</p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              href={`/speakers/${savedSpeaker.speaker.id}`}
                              className="p-2 text-gray-600 hover:text-calm transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/messages?recipient=${savedSpeaker.speaker.id}`}
                              className="p-2 text-gray-600 hover:text-calm transition-colors"
                              title="Send Message"
                            >
                              <MessageSquare className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleRemoveSpeaker(savedSpeaker.id, savedSpeaker.speaker.name)}
                              disabled={removingSpeaker === savedSpeaker.id}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Remove from Saved"
                            >
                              {removingSpeaker === savedSpeaker.id ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Bio */}
                        {savedSpeaker.speaker.bio && (
                          <p className="text-gray-700 mt-2 line-clamp-2">
                            {savedSpeaker.speaker.bio}
                          </p>
                        )}

                        {/* Details */}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          {savedSpeaker.speaker.location && (
                            <span className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-1" />
                              {savedSpeaker.speaker.location}
                            </span>
                          )}
                          {savedSpeaker.speaker.years_experience && (
                            <span className="flex items-center text-gray-600">
                              <Award className="h-4 w-4 mr-1" />
                              {savedSpeaker.speaker.years_experience} years experience
                            </span>
                          )}
                          {savedSpeaker.speaker.speaking_fee_range && (
                            <span className="flex items-center text-gray-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatFeeRange(savedSpeaker.speaker.speaking_fee_range)}
                            </span>
                          )}
                          {savedSpeaker.speaker.average_rating && savedSpeaker.speaker.average_rating > 0 && (
                            <span className="flex items-center text-gray-600">
                              <Star className="h-4 w-4 mr-1 text-yellow-500" />
                              {savedSpeaker.speaker.average_rating.toFixed(1)} ({savedSpeaker.speaker.total_reviews} reviews)
                            </span>
                          )}
                        </div>

                        {/* Specialties */}
                        {savedSpeaker.speaker.specialties && savedSpeaker.speaker.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {savedSpeaker.speaker.specialties.slice(0, 5).map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-calm/10 text-calm text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                            {savedSpeaker.speaker.specialties.length > 5 && (
                              <span className="px-2 py-1 text-gray-600 text-xs">
                                +{savedSpeaker.speaker.specialties.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Languages */}
                        {savedSpeaker.speaker.languages && savedSpeaker.speaker.languages.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <Languages className="h-4 w-4" />
                            <span>{savedSpeaker.speaker.languages.join(', ')}</span>
                          </div>
                        )}

                        {/* Links */}
                        <div className="flex gap-3 mt-3">
                          {savedSpeaker.speaker.website && (
                            <a
                              href={savedSpeaker.speaker.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-calm hover:underline"
                            >
                              <Globe className="h-4 w-4 mr-1" />
                              Website
                            </a>
                          )}
                          {savedSpeaker.speaker.linkedin_url && (
                            <a
                              href={savedSpeaker.speaker.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-calm hover:underline"
                            >
                              <Linkedin className="h-4 w-4 mr-1" />
                              LinkedIn
                            </a>
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
                        
                        {editingNotes === savedSpeaker.id ? (
                          <div>
                            <textarea
                              value={tempNotes[savedSpeaker.id] || ''}
                              onChange={(e) => setTempNotes({ ...tempNotes, [savedSpeaker.id]: e.target.value })}
                              placeholder="Add notes about this speaker..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-transparent resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateNotes(savedSpeaker.id)}
                                disabled={savingNotes === savedSpeaker.id}
                                className="px-3 py-1 bg-calm text-white rounded-lg hover:bg-deep transition-colors disabled:opacity-50 flex items-center"
                              >
                                {savingNotes === savedSpeaker.id ? (
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
                            {savedSpeaker.notes ? (
                              <p className="text-gray-700 whitespace-pre-wrap">{savedSpeaker.notes}</p>
                            ) : (
                              <p className="text-gray-400 italic">No notes added</p>
                            )}
                            <button
                              onClick={() => startEditingNotes(savedSpeaker.id, savedSpeaker.notes)}
                              className="mt-2 text-sm text-calm hover:underline flex items-center"
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              {savedSpeaker.notes ? 'Edit notes' : 'Add notes'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Saved Date */}
                    <div className="flex items-center mt-4 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Saved on {new Date(savedSpeaker.created_at).toLocaleDateString('en-US', {
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
        {filteredSpeakers.length > 0 && filteredSpeakers.length < savedSpeakers.length && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredSpeakers.length} of {savedSpeakers.length} saved speakers
          </div>
        )}
      </div>
    </div>
  )
}