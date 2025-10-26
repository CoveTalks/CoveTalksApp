'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, Filter, Star, MapPin, DollarSign, 
  Award, Languages, Calendar, Heart, MessageSquare,
  ChevronRight, Globe, Linkedin, Twitter, X
} from 'lucide-react'

interface Speaker {
  id: string
  name: string
  email: string
  title: string
  company: string
  bio: string
  location: string
  photo_url: string
  specialties: string[]
  languages: string[]
  years_experience: number
  speaking_fee_min: number
  speaking_fee_max: number
  travel_preferences: string
  availability: string
  rating: number
  review_count: number
  website: string
  linkedin: string
  twitter: string
}

export default function BrowseSpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([])
  const [savedSpeakers, setSavedSpeakers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [experienceLevel, setExperienceLevel] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSpeakers()
    fetchSavedSpeakers()
  }, [])

  useEffect(() => {
    filterSpeakers()
  }, [speakers, searchTerm, selectedSpecialty, selectedLanguage, priceRange, experienceLevel, availability])

  async function fetchSpeakers() {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('member_type', 'Speaker')
        .eq('status', 'Active')

      if (error) throw error

      if (data) {
        // Calculate ratings for each speaker
        const speakersWithRatings = await Promise.all(
          data.map(async (speaker) => {
            const { data: reviews } = await supabase
              .from('reviews')
              .select('rating')
              .eq('speaker_id', speaker.id)

            const rating = reviews && reviews.length > 0
              ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
              : 0

            return {
              ...speaker,
              rating,
              review_count: reviews?.length || 0
            }
          })
        )

        setSpeakers(speakersWithRatings)
        setFilteredSpeakers(speakersWithRatings)
      }
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

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_id', user.id)
        .single()

      if (orgMember) {
        const { data } = await supabase
          .from('saved_speakers')
          .select('speaker_id')
          .eq('organization_id', orgMember.organization_id)

        if (data) {
          setSavedSpeakers(data.map(s => s.speaker_id))
        }
      }
    } catch (error) {
      console.error('Error fetching saved speakers:', error)
    }
  }

  function filterSpeakers() {
    let filtered = [...speakers]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(speaker =>
        speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        speaker.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        speaker.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Specialty filter
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(speaker =>
        speaker.specialties?.includes(selectedSpecialty)
      )
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(speaker =>
        speaker.languages?.includes(selectedLanguage)
      )
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(speaker => {
        const min = speaker.speaking_fee_min || 0
        const max = speaker.speaking_fee_max || 0
        switch (priceRange) {
          case '0-1000':
            return max <= 1000
          case '1000-5000':
            return min >= 1000 && max <= 5000
          case '5000-10000':
            return min >= 5000 && max <= 10000
          case '10000+':
            return min >= 10000
          default:
            return true
        }
      })
    }

    // Experience level filter
    if (experienceLevel !== 'all') {
      filtered = filtered.filter(speaker => {
        const years = speaker.years_experience || 0
        switch (experienceLevel) {
          case 'beginner':
            return years < 3
          case 'intermediate':
            return years >= 3 && years < 7
          case 'advanced':
            return years >= 7 && years < 15
          case 'expert':
            return years >= 15
          default:
            return true
        }
      })
    }

    // Availability filter
    if (availability !== 'all') {
      filtered = filtered.filter(speaker =>
        speaker.availability === availability
      )
    }

    setFilteredSpeakers(filtered)
  }

  async function toggleSaveSpeaker(speakerId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_id', user.id)
        .single()

      if (!orgMember) return

      if (savedSpeakers.includes(speakerId)) {
        // Remove from saved
        await supabase
          .from('saved_speakers')
          .delete()
          .eq('organization_id', orgMember.organization_id)
          .eq('speaker_id', speakerId)

        setSavedSpeakers(savedSpeakers.filter(id => id !== speakerId))
      } else {
        // Add to saved
        await supabase
          .from('saved_speakers')
          .insert({
            organization_id: orgMember.organization_id,
            speaker_id: speakerId
          })

        setSavedSpeakers([...savedSpeakers, speakerId])
      }
    } catch (error) {
      console.error('Error toggling saved speaker:', error)
    }
  }

  // Extract unique values for filters
  const allSpecialties = Array.from(new Set(speakers.flatMap(s => s.specialties || [])))
  const allLanguages = Array.from(new Set(speakers.flatMap(s => s.languages || [])))

  function renderStars(rating: number) {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading speakers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">Browse Speakers</h1>
        <p className="mt-2 text-gray-600">
          Find the perfect speaker for your next event
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10 w-full"
                placeholder="Search speakers by name, bio, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters && <X className="h-4 w-4 ml-2" />}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t">
            <div>
              <label className="form-label text-sm">Specialty</label>
              <select
                className="form-select text-sm"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="all">All Specialties</option>
                {allSpecialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label text-sm">Language</label>
              <select
                className="form-select text-sm"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="all">All Languages</option>
                {allLanguages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label text-sm">Price Range</label>
              <select
                className="form-select text-sm"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="all">Any Price</option>
                <option value="0-1000">$0 - $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000-10000">$5,000 - $10,000</option>
                <option value="10000+">$10,000+</option>
              </select>
            </div>

            <div>
              <label className="form-label text-sm">Experience</label>
              <select
                className="form-select text-sm"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value="all">Any Experience</option>
                <option value="beginner">Beginner (0-3 years)</option>
                <option value="intermediate">Intermediate (3-7 years)</option>
                <option value="advanced">Advanced (7-15 years)</option>
                <option value="expert">Expert (15+ years)</option>
              </select>
            </div>

            <div>
              <label className="form-label text-sm">Availability</label>
              <select
                className="form-select text-sm"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="all">Any Status</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Found {filteredSpeakers.length} speakers
          </p>
          {(searchTerm || selectedSpecialty !== 'all' || selectedLanguage !== 'all' || 
            priceRange !== 'all' || experienceLevel !== 'all' || availability !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSpecialty('all')
                setSelectedLanguage('all')
                setPriceRange('all')
                setExperienceLevel('all')
                setAvailability('all')
              }}
              className="text-sm text-calm hover:underline"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Speakers Grid */}
      {filteredSpeakers.length === 0 ? (
        <div className="empty-state bg-white rounded-lg shadow-md p-12">
          <div className="text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No speakers found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSpeakers.map((speaker) => (
            <div key={speaker.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Speaker Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {speaker.photo_url ? (
                      <img
                        src={speaker.photo_url}
                        alt={speaker.name}
                        className="h-16 w-16 rounded-full mr-4"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-foam flex items-center justify-center mr-4">
                        <span className="text-xl font-bold text-deep">
                          {speaker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-deep">{speaker.name}</h3>
                      <p className="text-sm text-gray-600">
                        {speaker.title} {speaker.company && `at ${speaker.company}`}
                      </p>
                      {speaker.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {speaker.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSaveSpeaker(speaker.id)}
                    className={`p-2 rounded-full transition-colors ${
                      savedSpeakers.includes(speaker.id)
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-50 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${savedSpeakers.includes(speaker.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Rating */}
                {speaker.review_count > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(speaker.rating)}
                    <span className="text-sm text-gray-600">
                      {speaker.rating.toFixed(1)} ({speaker.review_count} reviews)
                    </span>
                  </div>
                )}

                {/* Bio */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {speaker.bio || 'No bio available'}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {speaker.years_experience > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Award className="h-4 w-4 mr-2 text-calm" />
                      {speaker.years_experience} years experience
                    </div>
                  )}
                  
                  {speaker.languages && speaker.languages.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Languages className="h-4 w-4 mr-2 text-calm" />
                      {speaker.languages.join(', ')}
                    </div>
                  )}
                  
                  {(speaker.speaking_fee_min > 0 || speaker.speaking_fee_max > 0) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-calm" />
                      ${speaker.speaking_fee_min} - ${speaker.speaking_fee_max}
                    </div>
                  )}
                </div>

                {/* Specialties */}
                {speaker.specialties && speaker.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {speaker.specialties.slice(0, 3).map((specialty) => (
                      <span key={specialty} className="badge badge-info text-xs">
                        {specialty}
                      </span>
                    ))}
                    {speaker.specialties.length > 3 && (
                      <span className="badge bg-gray-100 text-gray-600 text-xs">
                        +{speaker.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Availability Badge */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className={`badge ${
                    speaker.availability === 'Available' ? 'badge-success' : 
                    speaker.availability === 'Busy' ? 'badge-warning' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {speaker.availability || 'Unknown'}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSpeaker(speaker)}
                      className="btn btn-outline text-sm"
                    >
                      View Profile
                    </button>
                    <button className="btn btn-primary text-sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Speaker Detail Modal */}
      {selectedSpeaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  {selectedSpeaker.photo_url ? (
                    <img
                      src={selectedSpeaker.photo_url}
                      alt={selectedSpeaker.name}
                      className="h-20 w-20 rounded-full mr-4"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-foam flex items-center justify-center mr-4">
                      <span className="text-2xl font-bold text-deep">
                        {selectedSpeaker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-deep">{selectedSpeaker.name}</h2>
                    <p className="text-gray-600">
                      {selectedSpeaker.title} {selectedSpeaker.company && `at ${selectedSpeaker.company}`}
                    </p>
                    {selectedSpeaker.location && (
                      <p className="text-sm text-gray-500 mt-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {selectedSpeaker.location}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSpeaker(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mb-6">
                {selectedSpeaker.website && (
                  <a
                    href={selectedSpeaker.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-calm"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {selectedSpeaker.linkedin && (
                  <a
                    href={selectedSpeaker.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-calm"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {selectedSpeaker.twitter && (
                  <a
                    href={selectedSpeaker.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-calm"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedSpeaker.bio || 'No bio available'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Speaking Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{selectedSpeaker.years_experience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fee Range:</span>
                      <span className="font-medium">
                        ${selectedSpeaker.speaking_fee_min} - ${selectedSpeaker.speaking_fee_max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travel:</span>
                      <span className="font-medium">{selectedSpeaker.travel_preferences}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`badge ${
                        selectedSpeaker.availability === 'Available' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {selectedSpeaker.availability}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedSpeaker.languages?.map(language => (
                      <span key={language} className="badge badge-info">
                        {language}
                      </span>
                    )) || <span className="text-gray-500">Not specified</span>}
                  </div>
                </div>
              </div>

              {/* Specialties */}
              {selectedSpeaker.specialties && selectedSpeaker.specialties.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Speaking Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpeaker.specialties.map(specialty => (
                      <span key={specialty} className="badge badge-info">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => toggleSaveSpeaker(selectedSpeaker.id)}
                  className={`btn ${
                    savedSpeakers.includes(selectedSpeaker.id) 
                      ? 'btn-outline text-red-600 border-red-600 hover:bg-red-50' 
                      : 'btn-outline'
                  }`}
                >
                  {savedSpeakers.includes(selectedSpeaker.id) ? 'Remove from Saved' : 'Save Speaker'}
                </button>
                <button className="btn btn-primary">
                  Contact Speaker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}