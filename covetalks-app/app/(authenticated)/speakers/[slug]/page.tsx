'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  MapPin,
  Award,
  Star,
  Languages,
  DollarSign,
  Calendar,
  MessageCircle,
  Heart,
  HeartOff,
  Share2,
  Globe,
  Linkedin,
  CheckCircle,
  Clock,
  Users,
  Briefcase,
  BookOpen,
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
  website?: string
  linkedin_url?: string
  preferred_audience_size?: string
  preferred_formats?: string[]
  typical_audience_size?: string | null
  profile_views?: number
  slug?: string
}

interface Review {
  id: string
  rating: number
  review_text?: string  // Changed from 'comment' to 'review_text'
  content?: string       // Alternative column name
  created_at: string
  reviewer: {
    name: string
    organization?: string
  }
}

export default function SpeakerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'expertise' | 'reviews'>('about')
  
  const supabase = createClient()
  const speakerSlug = params?.slug as string

  useEffect(() => {
    if (speakerSlug) {
      fetchSpeakerProfile()
    }
  }, [speakerSlug])

  useEffect(() => {
    if (speaker) {
      checkIfSaved()
      incrementProfileView()
    }
  }, [speaker])

  async function fetchSpeakerProfile() {
    try {
      setLoading(true)
      
      // Check if the slug looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(speakerSlug)
      
      let data = null
      let error = null

      if (isUuid) {
        // If it's a UUID, search by ID
        const result = await supabase
          .from('members')
          .select('*')
          .eq('member_type', 'Speaker')
          .eq('id', speakerSlug)
          .single()
        
        data = result.data
        error = result.error
      } else {
        // If it's a slug, first try to find by slug column
        const slugResult = await supabase
          .from('members')
          .select('*')
          .eq('member_type', 'Speaker')
          .eq('slug', speakerSlug)
          .single()
        
        if (slugResult.data) {
          data = slugResult.data
          error = slugResult.error
        } else {
          // If no slug column or not found, try to match by name
          const nameResult = await supabase
            .from('members')
            .select('*')
            .eq('member_type', 'Speaker')
            .ilike('name', speakerSlug.replace(/-/g, ' '))
            .single()
          
          data = nameResult.data
          error = nameResult.error
        }
      }

      if (error) throw error
      if (data) {
        setSpeaker(data)
        // Fetch reviews
        fetchReviews(data.id)
      }
    } catch (error) {
      console.error('Error fetching speaker profile:', error)
      router.push('/speakers')
    } finally {
      setLoading(false)
    }
  }

  async function fetchReviews(speakerId: string) {
    try {
      // First try to get the reviews table structure
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('speaker_id', speakerId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching reviews:', error)
        // Reviews table might not exist or have different structure
        return
      }

      // Map the data to our expected format
      const formattedReviews = (data || []).map(review => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text || review.content || review.comment || '', // Try different column names
        content: review.review_text || review.content || review.comment || '',
        created_at: review.created_at,
        reviewer: {
          name: review.reviewer_name || 'Anonymous',
          organization: review.organization_name || ''
        }
      }))

      setReviews(formattedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // If reviews fail to load, just continue without them
    }
  }

  async function checkIfSaved() {
    if (!speaker) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if saved_speakers table exists and has proper access
      const { data, error } = await supabase
        .from('saved_speakers')
        .select('id')
        .eq('organization_id', user.id)
        .eq('speaker_id', speaker.id)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors if not found

      if (!error && data) {
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error checking saved status:', error)
      // If saved_speakers doesn't exist or has issues, just continue
    }
  }

  async function toggleSave() {
    if (!speaker) return
    
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (isSaved) {
        const { error } = await supabase
          .from('saved_speakers')
          .delete()
          .eq('organization_id', user.id)
          .eq('speaker_id', speaker.id)

        if (error) {
          console.error('Error unsaving speaker:', error)
          alert('Unable to unsave speaker. The saved speakers feature may not be available yet.')
        } else {
          setIsSaved(false)
        }
      } else {
        const { error } = await supabase
          .from('saved_speakers')
          .insert({
            organization_id: user.id,
            speaker_id: speaker.id,
          })

        if (error) {
          console.error('Error saving speaker:', error)
          alert('Unable to save speaker. The saved speakers feature may not be available yet.')
        } else {
          setIsSaved(true)
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    } finally {
      setSaving(false)
    }
  }

  async function incrementProfileView() {
    if (!speaker) return
    
    try {
      // Try to increment using RPC function if it exists
      const { error } = await supabase.rpc('increment_profile_views', {
        speaker_id: speaker.id
      })

      if (error) {
        // If RPC doesn't exist, try direct update (if user has permission)
        const currentViews = speaker.profile_views || 0
        await supabase
          .from('members')
          .update({ profile_views: currentViews + 1 })
          .eq('id', speaker.id)
      }
    } catch (error) {
      // Profile view increment is not critical, just log and continue
      console.log('Profile view tracking not available')
    }
  }

  function handleContact() {
    if (!speaker) return
    router.push(`/messages?new=${speaker.id}`)
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    // You could show a toast notification here
    alert('Profile link copied to clipboard!')
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
      stars.push(<Star key={i} className="h-5 w-5 fill-sand text-sand" />)
    }

    if (hasHalfStar && fullStars < 5) {
      stars.push(<Star key="half" className="h-5 w-5 fill-sand/50 text-sand" />)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />)
    }

    return stars
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-calm mx-auto mb-4" />
          <p className="text-gray-600">Loading speaker profile...</p>
        </div>
      </div>
    )
  }

  if (!speaker) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Speaker not found</p>
          <button
            onClick={() => router.push('/speakers')}
            className="btn btn-primary"
          >
            Browse Speakers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Speakers
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-br from-calm to-deep relative">
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <Share2 className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={toggleSave}
              disabled={saving}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              title={isSaved ? 'Remove from saved speakers' : 'Save speaker'}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              ) : isSaved ? (
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              ) : (
                <HeartOff className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="px-8 pb-8">
          {/* Profile Picture */}
          <div className="relative -mt-20 mb-4">
            <div className="w-32 h-32 bg-white rounded-full border-4 border-white overflow-hidden">
              {speaker.profile_image_url ? (
                <img
                  src={speaker.profile_image_url}
                  alt={speaker.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full bg-gradient-to-br from-calm to-deep flex items-center justify-center text-white text-3xl font-bold ${speaker.profile_image_url ? 'hidden' : ''}`}
              >
                {speaker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            </div>
            {speaker.verified && (
              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Speaker Info */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{speaker.name}</h1>
              {speaker.title && (
                <p className="text-lg text-gray-600 mb-3">{speaker.title}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                {speaker.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{speaker.location}</span>
                  </div>
                )}
                {speaker.years_experience !== undefined && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{speaker.years_experience} years experience</span>
                  </div>
                )}
                {speaker.languages && speaker.languages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    <span>{speaker.languages.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {renderRating(speaker.average_rating || 0)}
                </div>
                <span className="text-sm text-gray-600">
                  {speaker.average_rating?.toFixed(1) || '0.0'} ({speaker.total_reviews || 0} reviews)
                </span>
              </div>

              {/* Fee Range */}
              <div className="flex items-center gap-2 text-lg font-semibold text-deep mb-6">
                <DollarSign className="h-5 w-5" />
                <span>{formatFeeRange(speaker.speaking_fee_range)}</span>
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleContact}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Speaker
                </button>
                <button className="btn btn-secondary flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check Availability
                </button>
                {speaker.website && (
                  <a
                    href={speaker.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {speaker.linkedin_url && (
                  <a
                    href={speaker.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="lg:w-64">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Profile Views</span>
                  </div>
                  <span className="font-semibold">{speaker.profile_views || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">Bookings</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Response Time</span>
                  </div>
                  <span className="font-semibold">&lt; 24h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'about'
                  ? 'border-calm text-calm'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('expertise')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'expertise'
                  ? 'border-calm text-calm'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Expertise
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'reviews'
                  ? 'border-calm text-calm'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About {speaker.name}</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {speaker.bio || 'No biography available.'}
              </p>

              {speaker.preferred_formats && speaker.preferred_formats.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Speaking Formats</h3>
                  <div className="flex flex-wrap gap-2">
                    {speaker.preferred_formats.map((format, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {speaker.preferred_audience_size && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Preferred Audience Size</h3>
                  <p className="text-gray-600 capitalize">{speaker.preferred_audience_size}</p>
                </div>
              )}
            </div>
          )}

          {/* Expertise Tab */}
          {activeTab === 'expertise' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas of Expertise</h2>
              
              {speaker.specialties && speaker.specialties.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {speaker.specialties.map((specialty, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-foam rounded-lg"
                    >
                      <BookOpen className="h-4 w-4 text-deep" />
                      <span className="text-gray-900">{specialty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No specialties listed.</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.reviewer.name}</p>
                          {review.reviewer.organization && (
                            <p className="text-sm text-gray-600">{review.reviewer.organization}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderRating(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600">{review.review_text || review.content || 'No review text provided.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet. Be the first to review this speaker!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}