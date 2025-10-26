'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Award, 
  DollarSign, 
  Languages, 
  MessageCircle,
  User,
  ChevronRight,
  Heart,
  HeartOff,
  Loader2
} from 'lucide-react'

interface Speaker {
  id: string
  email: string
  name: string
  title?: string
  bio?: string
  location?: string
  profile_image_url?: string
  specialties?: string[]
  years_experience?: number
  languages?: string[]
  speaking_fee_range?: { min: number; max: number }
  average_rating?: number
  total_reviews?: number
  verified?: boolean
  slug?: string
}

interface SavedSpeaker {
  speaker_id: string
}

export default function BrowseSpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([])
  const [savedSpeakers, setSavedSpeakers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    specialty: '',
    minExperience: 0,
    location: '',
    language: '',
    maxFee: 50000,
  })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchSpeakers()
    fetchSavedSpeakers()
  }, [])

  useEffect(() => {
    filterSpeakers()
  }, [searchTerm, filters, speakers])

  async function fetchSpeakers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          email,
          name,
          title,
          bio,
          location,
          profile_image_url,
          specialties,
          years_experience,
          languages,
          speaking_fee_range,
          average_rating,
          total_reviews,
          verified
        `)
        .eq('member_type', 'Speaker')
        .eq('status', 'Active')
        .order('average_rating', { ascending: false })

      if (error) throw error

      // Generate slugs for each speaker based on their name
      const speakersWithSlugs = (data || []).map(speaker => ({
        ...speaker,
        slug: speaker.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }))

      setSpeakers(speakersWithSlugs)
      setFilteredSpeakers(speakersWithSlugs)
    } catch (error) {
      console.error('Error fetching speakers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSavedSpeakers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('saved_speakers')
        .select('speaker_id')
        .eq('organization_id', user.id)

      if (error) throw error

      const savedIds = new Set((data || []).map((item: SavedSpeaker) => item.speaker_id))
      setSavedSpeakers(savedIds)
    } catch (error) {
      console.error('Error fetching saved speakers:', error)
    }
  }

  async function toggleSaveSpeaker(speakerId: string) {
    try {
      setSavingIds(prev => new Set(prev).add(speakerId))
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (savedSpeakers.has(speakerId)) {
        // Unsave
        const { error } = await supabase
          .from('saved_speakers')
          .delete()
          .eq('organization_id', user.id)
          .eq('speaker_id', speakerId)

        if (error) throw error

        setSavedSpeakers(prev => {
          const newSet = new Set(prev)
          newSet.delete(speakerId)
          return newSet
        })
      } else {
        // Save
        const { error } = await supabase
          .from('saved_speakers')
          .insert({
            organization_id: user.id,
            speaker_id: speakerId,
          })

        if (error) throw error

        setSavedSpeakers(prev => new Set(prev).add(speakerId))
      }
    } catch (error) {
      console.error('Error toggling save speaker:', error)
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(speakerId)
        return newSet
      })
    }
  }

  function filterSpeakers() {
    let filtered = speakers

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(speaker =>
        speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        speaker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        speaker.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Specialty filter
    if (filters.specialty) {
      filtered = filtered.filter(speaker =>
        speaker.specialties?.includes(filters.specialty)
      )
    }

    // Experience filter
    if (filters.minExperience > 0) {
      filtered = filtered.filter(speaker =>
        (speaker.years_experience || 0) >= filters.minExperience
      )
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(speaker =>
        speaker.location?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Language filter
    if (filters.language) {
      filtered = filtered.filter(speaker =>
        speaker.languages?.includes(filters.language)
      )
    }

    // Fee range filter
    if (filters.maxFee < 50000) {
      filtered = filtered.filter(speaker => {
        const maxFee = speaker.speaking_fee_range?.max || 0
        return maxFee <= filters.maxFee
      })
    }

    setFilteredSpeakers(filtered)
  }

  function formatFeeRange(range?: { min: number; max: number }) {
    if (!range) return 'Contact for pricing'
    if (range.min === 0 && range.max === 0) return 'Free'
    if (range.min === range.max) return `$${range.min.toLocaleString()}`
    return `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`
  }

  function renderRating(rating: number) {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-sand text-sand" />
      )
    }

    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-sand/50 text-sand" />
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      )
    }

    return stars
  }

  async function handleContactSpeaker(speakerId: string) {
    router.push(`/messages?new=${speakerId}`)
  }

  function handleViewProfile(speaker: Speaker) {
    // Navigate to the speaker profile page with the slug
    router.push(`/speakers/${speaker.slug || speaker.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-calm mx-auto mb-4" />
          <p className="text-gray-600">Loading speakers...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Speakers</h1>
              <p className="text-sm text-gray-600 mt-1">
                Found {filteredSpeakers.length} speaker{filteredSpeakers.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search speakers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-calm"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-calm"
                />
                <input
                  type="text"
                  placeholder="Specialty"
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-calm"
                />
                <input
                  type="number"
                  placeholder="Min years experience"
                  value={filters.minExperience || ''}
                  onChange={(e) => setFilters({ ...filters, minExperience: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-calm"
                />
                <input
                  type="text"
                  placeholder="Language"
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-calm"
                />
                <select
                  value={filters.maxFee}
                  onChange={(e) => setFilters({ ...filters, maxFee: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calm focus:border-calm"
                >
                  <option value={50000}>Any budget</option>
                  <option value={1000}>Under $1,000</option>
                  <option value={5000}>Under $5,000</option>
                  <option value={10000}>Under $10,000</option>
                  <option value={25000}>Under $25,000</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speakers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredSpeakers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No speakers found matching your criteria.</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSpeakers.map((speaker) => (
              <div
                key={speaker.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Speaker Image/Avatar */}
                <div className="relative h-48 bg-gradient-to-br from-calm to-deep flex items-center justify-center">
                  {speaker.profile_image_url ? (
                    <img
                      src={speaker.profile_image_url}
                      alt={speaker.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`text-white text-4xl font-bold ${speaker.profile_image_url ? 'hidden' : ''}`}>
                    {speaker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  
                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSaveSpeaker(speaker.id)
                    }}
                    disabled={savingIds.has(speaker.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    {savingIds.has(speaker.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    ) : savedSpeakers.has(speaker.id) ? (
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    ) : (
                      <HeartOff className="h-4 w-4 text-gray-600" />
                    )}
                  </button>

                  {/* Verified Badge */}
                  {speaker.verified && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Speaker Details */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{speaker.name}</h3>
                  {speaker.title && (
                    <p className="text-sm text-gray-600 mb-2">{speaker.title}</p>
                  )}

                  {/* Location */}
                  {speaker.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{speaker.location}</span>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {renderRating(speaker.average_rating || 0)}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({speaker.total_reviews || 0})
                    </span>
                  </div>

                  {/* Bio */}
                  {speaker.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {speaker.bio}
                    </p>
                  )}

                  {/* Specialties */}
                  {speaker.specialties && speaker.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {speaker.specialties.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-foam text-deep text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                      {speaker.specialties.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{speaker.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-1 mb-4 text-sm text-gray-600">
                    {speaker.years_experience !== undefined && (
                      <div className="flex items-center gap-2">
                        <Award className="h-3 w-3 text-gray-400" />
                        <span>{speaker.years_experience} years experience</span>
                      </div>
                    )}
                    {speaker.languages && speaker.languages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Languages className="h-3 w-3 text-gray-400" />
                        <span>{speaker.languages.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span>{formatFeeRange(speaker.speaking_fee_range)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewProfile(speaker)}
                      className="flex-1 px-3 py-2 bg-calm text-white rounded-lg hover:bg-deep transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    >
                      View Profile
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleContactSpeaker(speaker.id)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}