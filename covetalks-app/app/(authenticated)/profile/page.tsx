'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Camera, Edit, Save, X, Plus, Trash2, Globe, 
  Linkedin, Twitter, Award, BookOpen, Users, Star,
  DollarSign, MapPin, Briefcase, Languages, Calendar,
  Upload, Check
} from 'lucide-react'

interface SpeakerProfile {
  id: string
  name: string
  email: string
  bio: string
  title: string
  company: string
  location: string
  website: string
  linkedin: string
  twitter: string
  profile_image_url: string
  specialties: string[]
  languages: string[]
  years_experience: number
  speaking_fee_range: { min: number; max: number }
  preferred_audience_size: string
  preferred_formats: string[]
  phone: string
  booking_link: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<SpeakerProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [newFormat, setNewFormat] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Transform member data to profile structure
      setProfile({
        id: member.id,
        name: member.name || '',
        email: member.email,
        bio: member.bio || '',
        title: member.title || '',
        company: '',
        location: member.location || '',
        website: member.website || '',
        linkedin: member.linkedin || member.linkedin_url || '',
        twitter: '',
        profile_image_url: member.profile_image_url || '',
        specialties: member.specialties || [],
        languages: member.languages || ['English'],
        years_experience: member.years_experience || 0,
        speaking_fee_range: member.speaking_fee_range || { min: 0, max: 0 },
        preferred_audience_size: member.preferred_audience_size || 'medium',
        preferred_formats: member.preferred_formats || [],
        phone: member.phone || '',
        booking_link: member.booking_link || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: profile.name,
          bio: profile.bio,
          title: profile.title,
          location: profile.location,
          website: profile.website,
          linkedin: profile.linkedin,
          linkedin_url: profile.linkedin,
          phone: profile.phone,
          booking_link: profile.booking_link,
          specialties: profile.specialties,
          languages: profile.languages,
          years_experience: profile.years_experience,
          speaking_fee_range: profile.speaking_fee_range,
          preferred_audience_size: profile.preferred_audience_size,
          preferred_formats: profile.preferred_formats,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setUploadingImage(true)
    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `members/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Update local state
      setProfile({ ...profile, profile_image_url: publicUrl })
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  function addSpecialty() {
    if (newSpecialty && profile && !profile.specialties.includes(newSpecialty)) {
      setProfile({
        ...profile,
        specialties: [...profile.specialties, newSpecialty]
      })
      setNewSpecialty('')
    }
  }

  function removeSpecialty(index: number) {
    if (profile) {
      setProfile({
        ...profile,
        specialties: profile.specialties.filter((_, i) => i !== index)
      })
    }
  }

  function addLanguage() {
    if (newLanguage && profile && !profile.languages.includes(newLanguage)) {
      setProfile({
        ...profile,
        languages: [...profile.languages, newLanguage]
      })
      setNewLanguage('')
    }
  }

  function removeLanguage(index: number) {
    if (profile) {
      setProfile({
        ...profile,
        languages: profile.languages.filter((_, i) => i !== index)
      })
    }
  }

  function addFormat() {
    if (newFormat && profile && !profile.preferred_formats.includes(newFormat)) {
      setProfile({
        ...profile,
        preferred_formats: [...profile.preferred_formats, newFormat]
      })
      setNewFormat('')
    }
  }

  function removeFormat(index: number) {
    if (profile) {
      setProfile({
        ...profile,
        preferred_formats: profile.preferred_formats.filter((_, i) => i !== index)
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cover Photo Area */}
        <div className="h-48 bg-gradient-primary"></div>
        
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-16">
            {/* Profile Photo */}
            <div className="relative">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name}
                  className="h-32 w-32 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-white bg-foam flex items-center justify-center">
                  <span className="text-3xl font-bold text-deep">
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 bg-calm text-white p-2 rounded-full hover:bg-deep cursor-pointer">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Edit/Save Button */}
            <div className="mt-20">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="btn btn-outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-primary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="mt-4">
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="(555) 123-4567"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Professional Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., CEO, Speaker, Consultant"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City, State/Country"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://yourwebsite.com"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">LinkedIn</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Booking Link</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://calendly.com/yourlink"
                      value={profile.booking_link}
                      onChange={(e) => setProfile({ ...profile, booking_link: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-deep">{profile.name}</h1>
                <p className="text-lg text-gray-600">{profile.title}</p>
                {profile.location && (
                  <p className="text-gray-500 mt-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </p>
                )}
                {profile.phone && (
                  <p className="text-gray-500 mt-1">📱 {profile.phone}</p>
                )}
              </>
            )}
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mt-4">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                 className="text-gray-600 hover:text-calm">
                <Globe className="h-5 w-5" />
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                 className="text-gray-600 hover:text-calm">
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {profile.booking_link && (
              <a href={profile.booking_link} target="_blank" rel="noopener noreferrer"
                 className="text-gray-600 hover:text-calm">
                <Calendar className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">About</h2>
            {editing ? (
              <textarea
                className="form-textarea w-full"
                rows={8}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself, your experience, and what you speak about..."
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {profile.bio || 'No bio provided yet.'}
              </p>
            )}
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Speaking Topics & Expertise</h2>
            {editing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty, index) => (
                    <div key={index} className="badge badge-info flex items-center gap-2">
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Add a specialty or topic..."
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  />
                  <button
                    type="button"
                    onClick={addSpecialty}
                    className="btn btn-outline"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.specialties.length > 0 ? (
                  profile.specialties.map((specialty, index) => (
                    <span key={index} className="badge badge-info">
                      {specialty}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No specialties added yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Preferred Formats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Preferred Speaking Formats</h2>
            {editing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_formats.map((format, index) => (
                    <div key={index} className="badge badge-success flex items-center gap-2">
                      {format}
                      <button
                        onClick={() => removeFormat(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    className="form-select flex-1"
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                  >
                    <option value="">Select a format...</option>
                    <option value="Keynote">Keynote</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Panel">Panel Discussion</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Fireside Chat">Fireside Chat</option>
                    <option value="Training">Training Session</option>
                    <option value="Breakout">Breakout Session</option>
                  </select>
                  <button
                    type="button"
                    onClick={addFormat}
                    disabled={!newFormat}
                    className="btn btn-outline"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.preferred_formats.length > 0 ? (
                  profile.preferred_formats.map((format, index) => (
                    <span key={index} className="badge badge-success">
                      {format}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No preferred formats specified.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Speaking Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Speaking Details</h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className="form-input"
                    value={profile.years_experience}
                    onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="form-label">Speaking Fee Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Min ($)"
                      value={profile.speaking_fee_range.min}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        speaking_fee_range: { 
                          ...profile.speaking_fee_range, 
                          min: parseInt(e.target.value) || 0 
                        }
                      })}
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Max ($)"
                      value={profile.speaking_fee_range.max}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        speaking_fee_range: { 
                          ...profile.speaking_fee_range, 
                          max: parseInt(e.target.value) || 0 
                        }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Preferred Audience Size</label>
                  <select
                    className="form-select"
                    value={profile.preferred_audience_size}
                    onChange={(e) => setProfile({ ...profile, preferred_audience_size: e.target.value })}
                  >
                    <option value="small">Small (< 50)</option>
                    <option value="medium">Medium (50-200)</option>
                    <option value="large">Large (200-500)</option>
                    <option value="very-large">Very Large (500+)</option>
                    <option value="any">Any Size</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-semibold">{profile.years_experience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fee Range</span>
                  <span className="font-semibold">
                    ${profile.speaking_fee_range.min.toLocaleString()} - ${profile.speaking_fee_range.max.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Audience Size</span>
                  <span className="font-semibold capitalize">{profile.preferred_audience_size}</span>
                </div>
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Languages</h2>
            {editing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((language, index) => (
                    <div key={index} className="badge badge-info flex items-center gap-2">
                      {language}
                      <button
                        onClick={() => removeLanguage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder="Add language..."
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="btn btn-outline"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((language, index) => (
                  <span key={index} className="badge badge-info">
                    {language}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Profile Strength</h2>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-calm h-2 rounded-full"
                  style={{ 
                    width: `${calculateProfileCompletion()}%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Your profile is {calculateProfileCompletion()}% complete
              </p>
              <div className="space-y-2 text-sm">
                {profile.bio && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    Added bio
                  </div>
                )}
                {profile.specialties.length > 0 && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    Added specialties
                  </div>
                )}
                {profile.profile_image_url && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    Added profile photo
                  </div>
                )}
                {!profile.profile_image_url && (
                  <div className="flex items-center text-gray-400">
                    <X className="h-4 w-4 mr-2" />
                    Add profile photo
                  </div>
                )}
                {!profile.website && (
                  <div className="flex items-center text-gray-400">
                    <X className="h-4 w-4 mr-2" />
                    Add website
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  function calculateProfileCompletion(): number {
    if (!profile) return 0
    let score = 0
    const checks = [
      profile.bio,
      profile.title,
      profile.location,
      profile.website,
      profile.linkedin,
      profile.profile_image_url,
      profile.specialties.length > 0,
      profile.languages.length > 0,
      profile.years_experience > 0,
      profile.speaking_fee_range.max > 0,
      profile.phone,
      profile.preferred_formats.length > 0
    ]
    
    checks.forEach(check => {
      if (check) score += 100 / checks.length
    })
    
    return Math.round(score)
  }
}