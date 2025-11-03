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
  Users,
  X,
  Plus,
  Camera,
  Search,
  Building2
} from 'lucide-react'

export default function ProfileSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [member, setMember] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Organization search states
  const [searchingOrg, setSearchingOrg] = useState(false)
  const [existingOrganizations, setExistingOrganizations] = useState<any[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null)
  const [showOrgSearch, setShowOrgSearch] = useState(false)
  
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
    linkedinUrl: '',
    linkedinProfile: '',
    twitterHandle: '',
    experienceYears: '',
    bookingLink: '',
    
    // Speaker Expertise
    specialties: [] as string[],
    topics: [] as string[],
    speakingTopics: [] as string[],
    audienceTypes: [] as string[],
    formats: [] as string[],
    presentationFormats: [] as string[],
    
    // Speaker Rates & Availability  
    minimumFee: '',
    maximumFee: '',
    hourlyRate: '',
    willingToTravel: false,
    virtualAvailable: true,
    travelRequirements: '',
    preferredAudienceSize: '',
    
    // Speaker Experience
    pastTalks: '',
    pastEngagements: '',
    certifications: '',
    achievements: '',
    awards: '',
    languages: ['English'] as string[],
    
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

  // Constants for options
  const specialtyOptions = [
    'Leadership', 'Motivation', 'Business', 'Technology', 'Education',
    'Health & Wellness', 'Personal Development', 'Sales', 'Marketing',
    'Innovation', 'Entrepreneurship', 'Finance', 'Communication',
    'Diversity & Inclusion', 'Team Building', 'Change Management'
  ]

  const audienceOptions = [
    'Corporate Executives', 'Entrepreneurs', 'Students', 'Educators',
    'Healthcare Professionals', 'Tech Professionals', 'General Public',
    'Non-Profit Organizations', 'Government', 'Youth', 'Women Groups'
  ]

  const formatOptions = [
    'Keynote', 'Workshop', 'Panel Discussion', 'Seminar', 'Webinar',
    'Training Session', 'Breakout Session', 'Virtual Presentation'
  ]

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
    'Portuguese', 'Arabic', 'Hindi', 'Russian'
  ]

  const eventTypeOptions = [
    'Conference', 'Workshop', 'Seminar', 'Annual Meeting', 'Gala',
    'Training', 'Retreat', 'Summit', 'Symposium', 'Forum'
  ]

  const venueOptions = [
    'Convention Center', 'Hotel', 'Corporate Office', 'University',
    'Virtual/Online', 'Outdoor Venue', 'Restaurant', 'Theater'
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
        const subscription = searchParams.get('subscription')
        if (subscription === 'success') {
          router.push('/dashboard?subscription=success')
        } else {
          router.push('/dashboard')
        }
        return
      }

      // Pre-fill existing data - FIXED VERSION
      const updates: any = {}
      
      // Basic fields from member table
      if (memberData.bio) updates.bio = memberData.bio
      if (memberData.location) updates.location = memberData.location
      if (memberData.phone) updates.phone = memberData.phone
      if (memberData.website) updates.website = memberData.website
      if (memberData.specialties) updates.specialties = memberData.specialties
      if (memberData.profile_image_url) updates.profileImageUrl = memberData.profile_image_url
      if (memberData.linkedin_url) updates.linkedinUrl = memberData.linkedin_url
      if (memberData.booking_link) updates.bookingLink = memberData.booking_link
      if (memberData.languages) updates.languages = memberData.languages
      if (memberData.willing_to_travel !== null) updates.willingToTravel = memberData.willing_to_travel
      if (memberData.virtual_available !== null) updates.virtualAvailable = memberData.virtual_available
      
      // Speaker-specific fields
      if (memberData.member_type === 'Speaker') {
        if (memberData.current_title) updates.currentTitle = memberData.current_title
        if (memberData.company) updates.company = memberData.company
        if (memberData.experience_years) updates.experienceYears = memberData.experience_years.toString()
        if (memberData.minimum_fee) updates.minimumFee = memberData.minimum_fee.toString()
        if (memberData.maximum_fee) updates.maximumFee = memberData.maximum_fee.toString()
        if (memberData.hourly_rate) updates.hourlyRate = memberData.hourly_rate.toString()
        if (memberData.speaking_topics) updates.topics = memberData.speaking_topics
        if (memberData.audience_types) updates.audienceTypes = memberData.audience_types
        if (memberData.presentation_formats) updates.formats = memberData.presentation_formats
        if (memberData.preferred_formats) updates.formats = memberData.preferred_formats
        if (memberData.certifications) updates.certifications = memberData.certifications
        if (memberData.awards) updates.achievements = memberData.awards
        if (memberData.past_engagements) updates.pastTalks = memberData.past_engagements
        if (memberData.travel_requirements) updates.travelRequirements = memberData.travel_requirements
        if (memberData.typical_audience_size) updates.preferredAudienceSize = memberData.typical_audience_size
        if (memberData.preferred_audience_size) updates.preferredAudienceSize = memberData.preferred_audience_size
      }

      // FIXED: Load organization data if applicable
      if (memberData.member_type === 'Organization') {
        try {
          // Find organization through organization_members table
          const { data: memberOrg, error: memberOrgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('member_id', user.id)
            .maybeSingle()

          if (memberOrg && !memberOrgError) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', memberOrg.organization_id)
              .single()

            if (orgData) {
              updates.organizationName = orgData.name || memberData.name
              updates.organizationType = orgData.organization_type || ''
              updates.industry = orgData.industry || ''
              updates.taxId = orgData.tax_id || ''
              updates.employeeCount = orgData.employee_count || ''
              updates.eventTypes = orgData.event_types || []
              updates.eventFrequency = orgData.event_frequency || ''
              updates.averageAudienceSize = orgData.average_audience_size || ''
              updates.typicalBudget = orgData.typical_budget || ''
              updates.venueTypes = orgData.venue_types || []
              updates.preferredTopics = orgData.preferred_topics || []
              updates.missionStatement = orgData.mission_statement || ''
              updates.pastSpeakers = orgData.past_speakers || ''
              updates.speakerRequirements = orgData.speaker_requirements || ''
              setSelectedOrganization(orgData)
            }
          }
        } catch (err) {
          console.log('Could not pre-load organization data:', err)
        }
      }
      
      // Apply all updates to form data at once using setFormData
      setFormData(prev => ({ ...prev, ...updates }))

    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user makes changes
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // File type validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    setUploadingImage(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `members/${fileName}`

      // Upload image to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update form data with new image URL
      handleInputChange('profileImageUrl', publicUrl)

      // Update member profile with new image
      await supabase
        .from('members')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(`Failed to upload image: ${err.message || 'Please try again.'}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const addCustomSpecialty = () => {
    if (customSpecialtyInput.trim() && !formData.specialties.includes(customSpecialtyInput.trim())) {
      handleInputChange('specialties', [...formData.specialties, customSpecialtyInput.trim()])
      setCustomSpecialtyInput('')
    }
  }

  // Organization Search Functions
  const searchOrganizations = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setExistingOrganizations([])
      return
    }

    setSearchingOrg(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%`)
        .limit(10)

      if (!error && data) {
        setExistingOrganizations(data)
      }
    } catch (err) {
      console.error('Error searching organizations:', err)
    } finally {
      setSearchingOrg(false)
    }
  }

  const selectExistingOrganization = async (org: any) => {
    setSelectedOrganization(org)
    setShowOrgSearch(false)
    
    // Pre-fill form with organization data
    setFormData(prev => ({
      ...prev,
      organizationName: org.name,
      organizationType: org.organization_type,
      industry: org.industry || '',
      location: org.location || `${org.city || ''}, ${org.state || ''}`.trim(),
      website: org.website || '',
      phone: org.phone || '',
      employeeCount: org.employee_count || '',
      eventTypes: org.event_types || [],
      eventFrequency: org.event_frequency || '',
      averageAudienceSize: org.average_audience_size || '',
      typicalBudget: org.typical_budget || '',
      venueTypes: org.venue_types || [],
      preferredTopics: org.preferred_topics || [],
      missionStatement: org.mission_statement || '',
      pastSpeakers: org.past_speakers || '',
      speakerRequirements: org.speaker_requirements || ''
    }))
    
    // Link member to organization
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('organization_members')
          .upsert({
            organization_id: org.id,
            member_id: user.id,
            role: 'Admin',
            joined_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Error linking to organization:', error)
        }
      }
    } catch (err) {
      console.error('Error linking member:', err)
    }
  }

  const validateStep = (step: number) => {
    setError('')
    
    switch (step) {
      case 1:
        // Basic Information validation
        if (member?.member_type === 'Speaker') {
          if (!formData.bio || formData.bio.trim() === '') {
            setError('Please provide a bio')
            return false
          }
          if (!formData.location || formData.location.trim() === '') {
            setError('Please provide your location')
            return false
          }
        } else {
          // Organization validation - NOW INCLUDING organizationType
          if (!formData.organizationName || formData.organizationName.trim() === '') {
            setError('Please provide organization name')
            return false
          }
          if (!formData.organizationType || formData.organizationType === '') {
            setError('Please select organization type')
            return false
          }
          if (!formData.location || formData.location.trim() === '') {
            setError('Please provide organization location')
            return false
          }
        }
        return true
        
      case 2:
        // Professional Information
        if (member?.member_type === 'Speaker') {
          if (!formData.specialties || formData.specialties.length === 0) {
            setError('Please select or add at least one specialty')
            return false
          }
        } else {
          // Organization type is now validated in step 1, so step 2 has no required fields
          return true
        }
        return true
        
      case 3:
        // Experience - mostly optional
        if (formData.minimumFee && formData.maximumFee) {
          const min = Number(formData.minimumFee)
          const max = Number(formData.maximumFee)
          if (min > max) {
            setError('Minimum fee cannot be greater than maximum fee')
            return false
          }
        }
        return true
        
      case 4:
      case 5:
        // Additional Details - all optional
        return true
        
      default:
        return true
    }
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    setSaving(true)
    try {
      await saveProgress()
      
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } catch (err) {
      console.error('Error saving progress:', err)
      setError('Failed to save progress. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save member data
    const memberUpdate: any = {
      bio: formData.bio,
      location: formData.location,
      phone: formData.phone,
      website: formData.website,
      profile_image_url: formData.profileImageUrl,
      linkedin_url: formData.linkedinUrl,
      booking_link: formData.bookingLink,
      specialties: formData.specialties,
      languages: formData.languages,
      updated_at: new Date().toISOString()
    }

    if (member?.member_type === 'Speaker') {
      memberUpdate.current_title = formData.currentTitle
      memberUpdate.company = formData.company
      memberUpdate.experience_years = formData.experienceYears ? parseInt(formData.experienceYears) : null
      memberUpdate.minimum_fee = formData.minimumFee ? parseFloat(formData.minimumFee) : null
      memberUpdate.maximum_fee = formData.maximumFee ? parseFloat(formData.maximumFee) : null
      memberUpdate.hourly_rate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null
      memberUpdate.willing_to_travel = formData.willingToTravel
      memberUpdate.virtual_available = formData.virtualAvailable
      memberUpdate.travel_requirements = formData.travelRequirements
      memberUpdate.speaking_topics = formData.specialties
      memberUpdate.audience_types = formData.audienceTypes
      memberUpdate.presentation_formats = formData.formats
      memberUpdate.preferred_formats = formData.formats
      memberUpdate.certifications = formData.certifications
      memberUpdate.awards = formData.achievements
      memberUpdate.past_engagements = formData.pastTalks
      memberUpdate.preferred_audience_size = formData.preferredAudienceSize
      memberUpdate.typical_audience_size = formData.preferredAudienceSize
    }

    const { error: memberError } = await supabase
      .from('members')
      .update(memberUpdate)
      .eq('id', user.id)

    if (memberError) throw memberError

    // Save organization data if applicable
    if (member?.member_type === 'Organization') {
      // If they selected an existing organization, just ensure the link exists
      if (selectedOrganization) {
        // Already linked in selectExistingOrganization
        return
      }

      // Only save organization if we have the required fields (name and type)
      if (!formData.organizationName || !formData.organizationType) {
        console.log('Skipping organization save - required fields not yet filled')
        return
      }

      // Create new organization
      const orgData: any = {
        name: formData.organizationName,
        organization_type: formData.organizationType,
        description: formData.bio,
        location: formData.location,
        city: formData.location?.includes(',') ? formData.location.split(',')[0].trim() : formData.location,
        state: formData.location?.includes(',') ? formData.location.split(',')[1]?.trim() : null,
        website: formData.website,
        phone: formData.phone,
        email: member.email,
        tax_id: formData.taxId || null,
        industry: formData.industry || null,
        employee_count: formData.employeeCount 
          ? parseInt(formData.employeeCount.split('-')[0]) 
          : null,
        event_types: formData.eventTypes || [],
        event_frequency: formData.eventFrequency || null,
        average_audience_size: formData.averageAudienceSize || null,
        typical_budget: formData.typicalBudget || null,
        venue_types: formData.venueTypes || [],
        preferred_topics: formData.preferredTopics || [],
        mission_statement: formData.missionStatement || null,
        past_speakers: formData.pastSpeakers || null,
        speaker_requirements: formData.speakerRequirements || null,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      try {
        // Check if organization already exists
        const { data: existingOrg, error: searchError } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', formData.organizationName)
          .maybeSingle()

        let organizationId: string

        if (existingOrg) {
          // Update existing organization
          console.log('Updating existing organization:', existingOrg.id)
          
          // Remove created_at for update
          delete orgData.created_at
          
          const { error: updateError } = await supabase
            .from('organizations')
            .update(orgData)
            .eq('id', existingOrg.id)

          if (updateError) {
            console.error('Error updating organization:', updateError)
            throw updateError
          }
          
          organizationId = existingOrg.id
        } else {
          // Insert new organization
          console.log('Creating new organization')
          
          const { data: newOrg, error: insertError } = await supabase
            .from('organizations')
            .insert([orgData])
            .select('id')
            .single()

          if (insertError) {
            console.error('Error creating organization:', insertError)
            throw insertError
          }
          
          if (!newOrg) {
            throw new Error('Failed to create organization')
          }
          
          organizationId = newOrg.id
        }

        // Link member to organization
        console.log('Linking member to organization')
        
        const { error: linkError } = await supabase
          .from('organization_members')
          .upsert({
            organization_id: organizationId,
            member_id: user.id,
            role: 'Owner',
            joined_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id,member_id'
          })

        if (linkError) {
          console.error('Error linking member to organization:', linkError)
          // Don't throw here - org was created successfully
        }
        
        console.log('Organization saved successfully')
        
      } catch (orgError: any) {
        console.error('Organization save error:', orgError)
        // Don't throw - allow member save to succeed even if org fails
        setError(`Organization save warning: ${orgError.message}. You can continue.`)
      }
    }
  }

  const completeOnboarding = async () => {
    setSaving(true)
    setError('')

    try {
      // Save all progress including final step
      await saveProgress()

      // Mark onboarding as complete
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: completeError } = await supabase
        .from('members')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (completeError) throw completeError

      // Redirect to dashboard with success message
      const subscription = searchParams.get('subscription')
      if (subscription === 'success') {
        router.push('/dashboard?welcome=true&subscription=success')
      } else {
        router.push('/dashboard?welcome=true')
      }
    } catch (err: any) {
      console.error('Error completing onboarding:', err)
      setError('Failed to complete setup. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render different steps based on member type
  const renderStepContent = () => {
    if (member?.member_type === 'Speaker') {
      return renderSpeakerStep()
    } else {
      return renderOrganizationStep()
    }
  }

  const renderSpeakerStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            <p className="text-gray-600">Let's start with your basic profile information.</p>

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {formData.profileImageUrl ? (
                    <img
                      src={formData.profileImageUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  {uploadingImage ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <p>Upload a professional photo</p>
                      <p className="text-xs text-gray-500">Max size: 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Professional Bio * <span className="text-gray-500 text-xs">({formData.bio.length}/500)</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Tell us about your experience, expertise, and what makes you unique as a speaker..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="City, State/Country"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Professional Information</h2>
            <p className="text-gray-600">Tell us about your professional background and expertise.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Title
                </label>
                <input
                  type="text"
                  value={formData.currentTitle}
                  onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="e.g., CEO, Motivational Speaker"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Your company or organization"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select experience</option>
                <option value="0">Less than 1 year</option>
                <option value="1">1-2 years</option>
                <option value="3">3-5 years</option>
                <option value="6">6-10 years</option>
                <option value="11">11-15 years</option>
                <option value="16">16+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Speaking Specialties * 
                <span className="text-gray-500 text-xs ml-2">Select all that apply or add your own</span>
              </label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {specialtyOptions.map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('specialties', [...formData.specialties, specialty])
                        } else {
                          handleInputChange('specialties', formData.specialties.filter(s => s !== specialty))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customSpecialtyInput}
                  onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSpecialty())}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Add custom specialty..."
                />
                <button
                  type="button"
                  onClick={addCustomSpecialty}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm"
                >
                  Add
                </button>
              </div>

              {formData.specialties.filter(s => !specialtyOptions.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialties.filter(s => !specialtyOptions.includes(s)).map((specialty) => (
                    <span key={specialty} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleInputChange('specialties', formData.specialties.filter(s => s !== specialty))}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target Audience
              </label>
              <div className="grid grid-cols-2 gap-3">
                {audienceOptions.map((audience) => (
                  <label key={audience} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.audienceTypes.includes(audience)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('audienceTypes', [...formData.audienceTypes, audience])
                        } else {
                          handleInputChange('audienceTypes', formData.audienceTypes.filter(a => a !== audience))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{audience}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Presentation Formats
              </label>
              <div className="grid grid-cols-2 gap-3">
                {formatOptions.map((format) => (
                  <label key={format} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.formats.includes(format)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('formats', [...formData.formats, format])
                        } else {
                          handleInputChange('formats', formData.formats.filter(f => f !== format))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{format}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Speaking Experience & Rates</h2>
            <p className="text-gray-600">Share your experience and fee information (optional).</p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Audience Size
              </label>
              <select
                value={formData.preferredAudienceSize}
                onChange={(e) => handleInputChange('preferredAudienceSize', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select size</option>
                <option value="Small (1-50)">Small (1-50)</option>
                <option value="Medium (51-200)">Medium (51-200)</option>
                <option value="Large (201-500)">Large (201-500)</option>
                <option value="Very Large (500+)">Very Large (500+)</option>
                <option value="Any Size">Any Size</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Speaking Fee Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Minimum Fee ($)
                  </label>
                  <input
                    type="number"
                    value={formData.minimumFee}
                    onChange={(e) => handleInputChange('minimumFee', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="e.g., 500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Maximum Fee ($)
                  </label>
                  <input
                    type="number"
                    value={formData.maximumFee}
                    onChange={(e) => handleInputChange('maximumFee', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="e.g., 5000"
                    min="0"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional: Leave blank if you prefer not to disclose
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="e.g., 250"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Availability
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.willingToTravel}
                    onChange={(e) => handleInputChange('willingToTravel', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Willing to travel for speaking engagements</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.virtualAvailable}
                    onChange={(e) => handleInputChange('virtualAvailable', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Available for virtual presentations</span>
                </label>
              </div>
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="e.g., Business class for flights over 4 hours, hotel accommodations, etc."
                />
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Additional Details</h2>
            <p className="text-gray-600">Add more details to strengthen your profile.</p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Past Speaking Engagements
              </label>
              <textarea
                value={formData.pastTalks}
                onChange={(e) => handleInputChange('pastTalks', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="List notable speaking engagements, conferences, or events..."
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
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Professional certifications, degrees, or credentials..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Awards & Achievements
              </label>
              <textarea
                value={formData.achievements}
                onChange={(e) => handleInputChange('achievements', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Awards, recognition, or notable achievements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Languages Spoken
              </label>
              <div className="grid grid-cols-3 gap-3">
                {languageOptions.map((language) => (
                  <label key={language} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('languages', [...formData.languages, language])
                        } else {
                          handleInputChange('languages', formData.languages.filter(l => l !== language))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Booking/Calendar Link
              </label>
              <input
                type="url"
                value={formData.bookingLink}
                onChange={(e) => handleInputChange('bookingLink', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="https://calendly.com/yourname"
              />
            </div>

            {/* Review section before completing */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Profile Summary</h3>
              <p className="text-sm text-blue-700">
                You've added {formData.specialties.length} specialties, 
                {formData.formats.length > 0 && ` ${formData.formats.length} presentation formats,`}
                {formData.audienceTypes.length > 0 && ` ${formData.audienceTypes.length} audience types,`}
                {formData.languages.length > 0 && ` and speak ${formData.languages.length} language(s).`}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Organization Search Component
  const renderOrganizationSearch = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Search for Your Organization First</h3>
        <p className="text-sm text-blue-700 mb-4">
          To avoid duplicates, please search if your organization already exists in our system.
        </p>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by organization name or location..."
            className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-primary"
            onChange={(e) => {
              const value = e.target.value
              if (value.length >= 2) {
                searchOrganizations(value)
              } else {
                setExistingOrganizations([])
              }
            }}
          />
        </div>

        {searchingOrg && (
          <div className="mt-4 text-center">
            <Loader2 className="animate-spin h-5 w-5 mx-auto text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">Searching...</p>
          </div>
        )}

        {existingOrganizations.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Found Organizations:</p>
            {existingOrganizations.map((org) => (
              <div
                key={org.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => selectExistingOrganization(org)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{org.name}</h4>
                    <p className="text-sm text-gray-600">
                      {org.city && org.state ? `${org.city}, ${org.state}` : org.location}
                    </p>
                    <p className="text-xs text-gray-500">{org.organization_type}</p>
                  </div>
                  <button
                    type="button"
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {existingOrganizations.length === 0 && !searchingOrg && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowOrgSearch(false)}
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              → Create New Organization
            </button>
          </div>
        )}
      </div>

      {selectedOrganization && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="font-medium text-green-900">Organization Selected</p>
              <p className="text-sm text-green-700">{selectedOrganization.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderOrganizationStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Organization Information</h2>
            <p className="text-gray-600">Tell us about your organization.</p>

            {/* Organization Search */}
            {!selectedOrganization && (
              <>
                {showOrgSearch ? (
                  renderOrganizationSearch()
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOrgSearch(true)}
                    className="w-full mb-6 p-4 border-2 border-dashed border-primary rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-primary font-medium">Search Existing Organizations First</p>
                    <p className="text-sm text-gray-600 mt-1">Click to search and avoid duplicates</p>
                  </button>
                )}
              </>
            )}

            {selectedOrganization && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-900">Organization Selected</p>
                      <p className="text-sm text-green-700">{selectedOrganization.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrganization(null)
                      setFormData(prev => ({
                        ...prev,
                        organizationName: '',
                        organizationType: '',
                      }))
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Organization Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {formData.profileImageUrl ? (
                    <img
                      src={formData.profileImageUrl}
                      alt="Organization Logo"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Building className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  {uploadingImage ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <p>Upload your organization logo</p>
                      <p className="text-xs text-gray-500">Max size: 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* MODIFIED: Organization Name and Type in a grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Your organization name"
                  disabled={selectedOrganization !== null}
                />
              </div>

              {/* MOVED FROM STEP 2 TO STEP 1 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Organization Type *
                </label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => handleInputChange('organizationType', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  disabled={selectedOrganization !== null}
                >
                  <option value="">Select type</option>
                  <option value="Non-Profit">Non-Profit</option>
                  <option value="Educational">Educational</option>
                  <option value="Government">Government</option>
                   <option value="Corporate">Corporate</option>                   
                  <option value="Religious">Religious</option>                  
                  <option value="Community">Community</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Organization Bio <span className="text-gray-500 text-xs">({formData.bio.length}/500)</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Describe your organization, mission, and values..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="City, State/Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="https://yourorganization.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="https://linkedin.com/company/yourorg"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
            <p className="text-gray-600">Help speakers understand your organization better.</p>

            {/* MODIFIED: Removed Organization Type, now only Industry */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Employees
                </label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select range</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tax ID/EIN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mission Statement
              </label>
              <textarea
                value={formData.missionStatement}
                onChange={(e) => handleInputChange('missionStatement', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Your organization's mission and core values..."
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Event Information</h2>
            <p className="text-gray-600">Tell us about the types of events you organize.</p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Event Types
              </label>
              <div className="grid grid-cols-2 gap-3">
                {eventTypeOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.eventTypes.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('eventTypes', [...formData.eventTypes, option])
                        } else {
                          handleInputChange('eventTypes', formData.eventTypes.filter(t => t !== option))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Frequency
                </label>
                <select
                  value={formData.eventFrequency}
                  onChange={(e) => handleInputChange('eventFrequency', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select frequency</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Bi-Annual">Bi-Annual</option>
                  <option value="Annual">Annual</option>
                  <option value="As Needed">As Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Average Audience Size
                </label>
                <select
                  value={formData.averageAudienceSize}
                  onChange={(e) => handleInputChange('averageAudienceSize', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select size</option>
                  <option value="Small (1-50)">Small (1-50)</option>
                  <option value="Medium (51-200)">Medium (51-200)</option>
                  <option value="Large (201-500)">Large (201-500)</option>
                  <option value="Very Large (500+)">Very Large (500+)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Typical Speaker Budget
              </label>
              <select
                value={formData.typicalBudget}
                onChange={(e) => handleInputChange('typicalBudget', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select budget range</option>
                <option value="Under $1,000">Under $1,000</option>
                <option value="$1,000 - $5,000">$1,000 - $5,000</option>
                <option value="$5,001 - $10,000">$5,001 - $10,000</option>
                <option value="$10,001 - $25,000">$10,001 - $25,000</option>
                <option value="$25,001 - $50,000">$25,001 - $50,000</option>
                <option value="Over $50,000">Over $50,000</option>
                <option value="Varies">Varies</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Venue Types
              </label>
              <div className="grid grid-cols-2 gap-3">
                {venueOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.venueTypes.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('venueTypes', [...formData.venueTypes, option])
                        } else {
                          handleInputChange('venueTypes', formData.venueTypes.filter(v => v !== option))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Speaker Preferences</h2>
            <p className="text-gray-600">Help us understand what you look for in speakers.</p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preferred Speaking Topics
              </label>
              <div className="grid grid-cols-2 gap-3">
                {specialtyOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferredTopics.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('preferredTopics', [...formData.preferredTopics, option])
                        } else {
                          handleInputChange('preferredTopics', formData.preferredTopics.filter(t => t !== option))
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Speaker Requirements
              </label>
              <textarea
                value={formData.speakerRequirements}
                onChange={(e) => handleInputChange('speakerRequirements', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="What qualifications, experience, or characteristics do you look for in speakers?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Past Speakers
              </label>
              <textarea
                value={formData.pastSpeakers}
                onChange={(e) => handleInputChange('pastSpeakers', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Notable speakers who have presented at your events..."
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review & Complete</h2>
            <p className="text-gray-600">Review your organization profile before completing.</p>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Organization Summary</h3>
                <p className="text-sm text-gray-600">{formData.organizationName}</p>
                <p className="text-sm text-gray-600">{formData.organizationType} • {formData.industry}</p>
                <p className="text-sm text-gray-600">{formData.location}</p>
              </div>

              {formData.eventTypes.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Event Information</h3>
                  <p className="text-sm text-gray-600">
                    {formData.eventTypes.length} event types • 
                    {formData.eventFrequency} events • 
                    {formData.averageAudienceSize} audience
                  </p>
                </div>
              )}

              {formData.preferredTopics.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Speaker Topics</h3>
                  <p className="text-sm text-gray-600">
                    Interested in {formData.preferredTopics.length} speaking topics
                  </p>
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Ready to Complete!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your organization profile is ready. Click "Complete Profile" to finish setup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentStep === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft className="inline-block w-4 h-4 mr-2" />
            Back
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Profile
                  <CheckCircle className="inline-block w-4 h-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="inline-block w-4 h-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}