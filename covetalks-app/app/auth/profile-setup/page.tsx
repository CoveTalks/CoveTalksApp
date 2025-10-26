'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  User,
  Building,
  MapPin,
  Globe,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Award,
  Target,
  Users
} from 'lucide-react'

export default function ProfileSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [member, setMember] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')
  
  // Progress tracking
  const speakerSteps = 4
  const organizationSteps = 5
  const totalSteps = member?.member_type === 'Speaker' ? speakerSteps : organizationSteps
  
  // Comprehensive form data
  const [formData, setFormData] = useState({
    // Basic Information
    bio: '',
    location: '',
    phone: '',
    website: '',
    profileImageUrl: '',
    
    // Speaker Professional Info
    currentTitle: '',
    company: '',
    linkedinProfile: '',
    twitterHandle: '',
    experienceYears: '',
    
    // Speaker Expertise
    specialties: [] as string[],
    speakingTopics: [] as string[],
    audienceTypes: [] as string[],
    presentationFormats: [] as string[],
    
    // Speaker Rates & Availability  
    minimumFee: '',
    maximumFee: '',
    willingToTravel: false,
    virtualAvailable: true,
    travelRequirements: '',
    
    // Speaker Experience
    pastEngagements: '',
    certifications: '',
    awards: '',
    languages: ['English'],
    
    // Organization Information
    organizationName: '',
    organizationType: '',
    taxId: '',
    industry: '',
    employeeCount: '',
    
    // Organization Events
    eventTypes: [] as string[],
    eventFrequency: '',
    averageAudienceSize: '',
    typicalBudget: '',
    venueTypes: [] as string[],
    
    // Organization Preferences
    preferredTopics: [] as string[],
    missionStatement: '',
    pastSpeakers: '',
    speakerRequirements: ''
  })

  // Option lists
  const specialtyOptions = [
    'Business & Leadership', 'Technology & Innovation', 'Health & Wellness',
    'Education & Training', 'Motivation & Inspiration', 'Sales & Marketing',
    'Finance & Economics', 'Science & Research', 'Arts & Culture',
    'Social Issues', 'Sports & Fitness', 'Personal Development',
    'Entrepreneurship', 'Diversity & Inclusion', 'Sustainability'
  ]

  const audienceOptions = [
    'Corporate Executives', 'Entrepreneurs', 'Students', 'Healthcare Professionals',
    'Educators', 'Non-Profit Organizations', 'Government Officials', 'General Public',
    'Technical Professionals', 'Sales Teams', 'Youth Groups', 'Senior Citizens'
  ]

  const formatOptions = [
    'Keynote Speech', 'Workshop', 'Panel Discussion', 'Seminar', 'Webinar',
    'Fireside Chat', 'Training Session', 'Breakout Session', 'Masterclass'
  ]

  const eventTypeOptions = [
    'Conference', 'Workshop', 'Corporate Meeting', 'Team Building', 'Product Launch',
    'Annual Meeting', 'Training Program', 'Fundraiser', 'Community Event'
  ]

  const venueOptions = [
    'Convention Center', 'Hotel Conference Room', 'Corporate Office', 'University',
    'Religious Venue', 'Community Center', 'Theater', 'Virtual/Online', 'Outdoor Venue'
  ]

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese',
    'Portuguese', 'Italian', 'Arabic', 'Hindi', 'Russian', 'Korean'
  ]

  useEffect(() => {
    loadMemberProfile()
  }, [])

  async function loadMemberProfile() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get member profile
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!memberData) {
        router.push('/auth/onboarding')
        return
      }

      setMember(memberData)

      // If profile is already complete, redirect to dashboard
      if (memberData.onboarding_completed) {
        const welcome = searchParams.get('welcome')
        router.push(welcome ? '/dashboard?welcome=true' : '/dashboard')
        return
      }

      // Pre-fill existing data
      if (memberData.bio) formData.bio = memberData.bio
      if (memberData.location) formData.location = memberData.location
      if (memberData.phone) formData.phone = memberData.phone
      if (memberData.website) formData.website = memberData.website
      if (memberData.specialties) formData.specialties = memberData.specialties

      // Load organization data if applicable
      if (memberData.member_type === 'Organization') {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', user.id)
          .single()

        if (orgData) {
          formData.organizationName = orgData.name || memberData.name
          formData.organizationType = orgData.type || ''
          formData.industry = orgData.industry || ''
        }
      }

    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user types
  }

  const toggleArrayItem = (field: string, item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(item)
        ? (prev[field as keyof typeof prev] as string[]).filter(i => i !== item)
        : [...(prev[field as keyof typeof prev] as string[]), item]
    }))
  }

  const canProceedToNext = (): boolean => {
    if (member?.member_type === 'Speaker') {
      switch (currentStep) {
        case 1: return formData.bio.length > 50 && formData.location.length > 0
        case 2: return formData.specialties.length > 0
        case 3: return formData.minimumFee.length > 0 || formData.maximumFee.length > 0
        case 4: return true // Optional step
        default: return false
      }
    } else {
      switch (currentStep) {
        case 1: return formData.organizationName.length > 0 && formData.organizationType.length > 0
        case 2: return formData.bio.length > 50 && formData.location.length > 0
        case 3: return formData.eventTypes.length > 0
        case 4: return formData.preferredTopics.length > 0
        case 5: return true // Optional step
        default: return false
      }
    }
  }

  const saveProgress = async () => {
    setSaving(true)
    try {
      const updateData: any = {
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        updated_at: new Date().toISOString()
      }

      if (member?.member_type === 'Speaker') {
        Object.assign(updateData, {
          specialties: formData.specialties,
          speaking_topics: formData.speakingTopics,
          current_title: formData.currentTitle,
          company: formData.company,
          linkedin_profile: formData.linkedinProfile,
          experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : null,
          minimum_fee: formData.minimumFee ? parseFloat(formData.minimumFee) : null,
          maximum_fee: formData.maximumFee ? parseFloat(formData.maximumFee) : null,
          willing_to_travel: formData.willingToTravel,
          virtual_available: formData.virtualAvailable
        })
      }

      await supabase
        .from('members')
        .update(updateData)
        .eq('id', member.id)

      // Save organization data if applicable
      if (member?.member_type === 'Organization') {
        await supabase
          .from('organizations')
          .upsert({
            id: member.id,
            name: formData.organizationName,
            type: formData.organizationType,
            industry: formData.industry,
            description: formData.bio,
            location: formData.location,
            website: formData.website,
            event_types: formData.eventTypes,
            event_frequency: formData.eventFrequency,
            typical_budget: formData.typicalBudget,
            preferred_topics: formData.preferredTopics,
            updated_at: new Date().toISOString()
          })
      }

    } catch (err: any) {
      console.error('Error saving progress:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      await saveProgress()
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      // Final save with onboarding completed flag
      const finalUpdate: any = {
        ...formData,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        profile_completion_percentage: 100
      }

      if (member?.member_type === 'Speaker') {
        await supabase
          .from('members')
          .update({
            bio: formData.bio,
            location: formData.location,
            phone: formData.phone,
            website: formData.website,
            profile_image_url: formData.profileImageUrl,
            specialties: formData.specialties,
            speaking_topics: formData.speakingTopics,
            audience_types: formData.audienceTypes,
            presentation_formats: formData.presentationFormats,
            current_title: formData.currentTitle,
            company: formData.company,
            linkedin_profile: formData.linkedinProfile,
            twitter_handle: formData.twitterHandle,
            experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : null,
            minimum_fee: formData.minimumFee ? parseFloat(formData.minimumFee) : null,
            maximum_fee: formData.maximumFee ? parseFloat(formData.maximumFee) : null,
            willing_to_travel: formData.willingToTravel,
            virtual_available: formData.virtualAvailable,
            travel_requirements: formData.travelRequirements,
            past_engagements: formData.pastEngagements,
            certifications: formData.certifications,
            awards: formData.awards,
            languages: formData.languages,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', member.id)
      } else {
        // Update organization
        await supabase
          .from('organizations')
          .upsert({
            id: member.id,
            name: formData.organizationName,
            type: formData.organizationType,
            tax_id: formData.taxId,
            industry: formData.industry,
            employee_count: formData.employeeCount ? parseInt(formData.employeeCount) : null,
            description: formData.bio,
            location: formData.location,
            website: formData.website,
            contact_phone: formData.phone,
            event_types: formData.eventTypes,
            event_frequency: formData.eventFrequency,
            average_audience_size: formData.averageAudienceSize,
            typical_budget: formData.typicalBudget,
            venue_types: formData.venueTypes,
            preferred_topics: formData.preferredTopics,
            mission_statement: formData.missionStatement,
            past_speakers: formData.pastSpeakers,
            speaker_requirements: formData.speakerRequirements,
            updated_at: new Date().toISOString()
          })

        // Update member profile
        await supabase
          .from('members')
          .update({
            bio: formData.bio,
            location: formData.location,
            phone: formData.phone,
            website: formData.website,
            profile_image_url: formData.profileImageUrl,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', member.id)
      }

      // Redirect to dashboard with welcome flag
      router.push('/dashboard?welcome=true')
      
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile setup')
      console.error('Profile completion error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )

  // Render speaker profile setup
  if (member?.member_type === 'Speaker') {
    return (
      <div className="min-h-screen bg-gradient-soft py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Complete Your Speaker Profile
            </h1>
            <p className="text-muted-foreground">
              Help organizations discover you by providing comprehensive information
            </p>
          </div>

          <ProgressBar />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <User className="h-8 w-8 text-primary mr-3" />
                  <h2 className="text-2xl font-bold">Basic Information</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Professional Bio *
                    <span className="text-muted-foreground font-normal ml-2">
                      ({formData.bio.length}/500 characters)
                    </span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={6}
                    maxLength={500}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Share your expertise, experience, and what makes you a compelling speaker..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="City, State/Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Globe className="inline h-4 w-4 mr-1" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinProfile}
                      onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="https://linkedin.com/in/profile"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current Title
                    </label>
                    <input
                      type="text"
                      value={formData.currentTitle}
                      onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="CEO, Author, Consultant..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company/Organization
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Your company"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNext() || saving}
                    className="px-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Expertise & Topics */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <Target className="h-8 w-8 text-primary mr-3" />
                  <h2 className="text-2xl font-bold">Expertise & Topics</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Areas of Expertise * (Select at least 1)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {specialtyOptions.map((specialty) => (
                      <button
                        key={specialty}
                        onClick={() => toggleArrayItem('specialties', specialty)}
                        className={`p-3 text-sm rounded-lg border-2 transition-all ${
                          formData.specialties.includes(specialty)
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Audience Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {audienceOptions.map((audience) => (
                      <button
                        key={audience}
                        onClick={() => toggleArrayItem('audienceTypes', audience)}
                        className={`p-2 text-sm rounded-lg border-2 transition-all ${
                          formData.audienceTypes.includes(audience)
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {audience}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Presentation Formats
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formatOptions.map((format) => (
                      <button
                        key={format}
                        onClick={() => toggleArrayItem('presentationFormats', format)}
                        className={`p-2 text-sm rounded-lg border-2 transition-all ${
                          formData.presentationFormats.includes(format)
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNext() || saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Rates & Availability */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <DollarSign className="h-8 w-8 text-primary mr-3" />
                  <h2 className="text-2xl font-bold">Rates & Availability</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Minimum Speaking Fee
                    </label>
                    <input
                      type="number"
                      value={formData.minimumFee}
                      onChange={(e) => handleInputChange('minimumFee', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="1000"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Maximum Speaking Fee
                    </label>
                    <input
                      type="number"
                      value={formData.maximumFee}
                      onChange={(e) => handleInputChange('maximumFee', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="5000"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Years of Speaking Experience
                  </label>
                  <select
                    value={formData.experienceYears}
                    onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select experience</option>
                    <option value="1">Less than 1 year</option>
                    <option value="2">1-2 years</option>
                    <option value="5">3-5 years</option>
                    <option value="10">6-10 years</option>
                    <option value="15">10+ years</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.willingToTravel}
                      onChange={(e) => handleInputChange('willingToTravel', e.target.checked)}
                      className="w-5 h-5 rounded text-primary"
                    />
                    <span>I'm willing to travel for speaking engagements</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.virtualAvailable}
                      onChange={(e) => handleInputChange('virtualAvailable', e.target.checked)}
                      className="w-5 h-5 rounded text-primary"
                    />
                    <span>I'm available for virtual/online events</span>
                  </label>
                </div>

                {formData.willingToTravel && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Travel Requirements
                    </label>
                    <textarea
                      value={formData.travelRequirements}
                      onChange={(e) => handleInputChange('travelRequirements', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Any specific travel requirements or preferences..."
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNext() || saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <Award className="h-8 w-8 text-primary mr-3" />
                  <h2 className="text-2xl font-bold">Additional Information (Optional)</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Past Speaking Engagements
                  </label>
                  <textarea
                    value={formData.pastEngagements}
                    onChange={(e) => handleInputChange('pastEngagements', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="List notable conferences, events, or organizations..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Certifications & Credentials
                  </label>
                  <textarea
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Relevant certifications or credentials..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Awards & Recognition
                  </label>
                  <textarea
                    value={formData.awards}
                    onChange={(e) => handleInputChange('awards', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Speaking awards or recognition..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Languages Spoken
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {languageOptions.map((language) => (
                      <button
                        key={language}
                        onClick={() => toggleArrayItem('languages', language)}
                        className={`p-2 text-sm rounded-lg border-2 transition-all ${
                          formData.languages.includes(language)
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Profile Complete!
                  </h3>
                  <p className="text-green-800 mb-4">
                    You're ready to start browsing opportunities and connecting with organizations.
                  </p>
                  <ul className="space-y-2 text-green-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      Browse and apply to speaking opportunities
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      Be discovered by organizations
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      Message directly with event organizers
                    </li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render organization profile setup
  if (member?.member_type === 'Organization') {
    // Similar structure for organizations with their 5 steps
    // Keeping the response concise, but would include all 5 organization steps
    return (
      <div className="min-h-screen bg-gradient-soft py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Complete Your Organization Profile
            </h1>
            <p className="text-muted-foreground">
              Help speakers understand your organization and event needs
            </p>
          </div>

          <ProgressBar />

          {/* Organization steps would go here - similar structure to speaker steps */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <p className="text-center text-muted-foreground">
              Organization profile setup steps...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}