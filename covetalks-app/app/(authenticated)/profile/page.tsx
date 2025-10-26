'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Camera, Edit, Save, X, Plus, Trash2, Globe, Check, 
  Linkedin, Twitter, Award, BookOpen, Users, Star 
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
  photo_url: string
  specialties: string[]
  languages: string[]
  years_experience: number
  speaking_fee_min: number
  speaking_fee_max: number
  travel_preferences: string
  availability: string
  achievements: Achievement[]
  education: Education[]
  past_talks: PastTalk[]
}

interface Achievement {
  title: string
  year: string
  description: string
}

interface Education {
  degree: string
  institution: string
  year: string
}

interface PastTalk {
  title: string
  event: string
  date: string
  attendees: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<SpeakerProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
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
        name: member.name,
        email: member.email,
        bio: member.bio || '',
        title: member.title || '',
        company: member.company || '',
        location: member.location || '',
        website: member.website || '',
        linkedin: member.linkedin || '',
        twitter: member.twitter || '',
        photo_url: member.photo_url || '',
        specialties: member.specialties || [],
        languages: member.languages || ['English'],
        years_experience: member.years_experience || 0,
        speaking_fee_min: member.speaking_fee_min || 0,
        speaking_fee_max: member.speaking_fee_max || 0,
        travel_preferences: member.travel_preferences || 'Flexible',
        availability: member.availability || 'Available',
        achievements: member.achievements || [],
        education: member.education || [],
        past_talks: member.past_talks || []
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
          bio: profile.bio,
          title: profile.title,
          company: profile.company,
          location: profile.location,
          website: profile.website,
          linkedin: profile.linkedin,
          twitter: profile.twitter,
          specialties: profile.specialties,
          languages: profile.languages,
          years_experience: profile.years_experience,
          speaking_fee_min: profile.speaking_fee_min,
          speaking_fee_max: profile.speaking_fee_max,
          travel_preferences: profile.travel_preferences,
          availability: profile.availability,
          achievements: profile.achievements,
          education: profile.education,
          past_talks: profile.past_talks,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  function addSpecialty() {
    if (newSpecialty && profile) {
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
    if (newLanguage && profile) {
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

  function addAchievement() {
    if (profile) {
      setProfile({
        ...profile,
        achievements: [...profile.achievements, { title: '', year: '', description: '' }]
      })
    }
  }

  function updateAchievement(index: number, field: keyof Achievement, value: string) {
    if (profile) {
      const updated = [...profile.achievements]
      updated[index] = { ...updated[index], [field]: value }
      setProfile({ ...profile, achievements: updated })
    }
  }

  function removeAchievement(index: number) {
    if (profile) {
      setProfile({
        ...profile,
        achievements: profile.achievements.filter((_, i) => i !== index)
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
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="h-32 w-32 rounded-full border-4 border-white"
                />
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-white bg-foam flex items-center justify-center">
                  <span className="text-3xl font-bold text-deep">
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}
              {editing && (
                <button className="absolute bottom-0 right-0 bg-calm text-white p-2 rounded-full hover:bg-deep">
                  <Camera className="h-4 w-4" />
                </button>
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
                <input
                  type="text"
                  className="text-2xl font-bold form-input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Title"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-deep">{profile.name}</h1>
                <p className="text-lg text-gray-600">
                  {profile.title} {profile.company && `at ${profile.company}`}
                </p>
                {profile.location && (
                  <p className="text-gray-500 mt-1">{profile.location}</p>
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
            {profile.twitter && (
              <a href={profile.twitter} target="_blank" rel="noopener noreferrer"
                 className="text-gray-600 hover:text-calm">
                <Twitter className="h-5 w-5" />
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
                rows={6}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {profile.bio || 'No bio provided yet.'}
              </p>
            )}
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Speaking Topics</h2>
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
                    placeholder="Add a specialty..."
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                  />
                  <button
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

          {/* Experience & Achievements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-deep mb-4">Achievements</h2>
            {editing ? (
              <div className="space-y-4">
                {profile.achievements.map((achievement, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Achievement title"
                        value={achievement.title}
                        onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Year"
                        value={achievement.year}
                        onChange={(e) => updateAchievement(index, 'year', e.target.value)}
                      />
                    </div>
                    <textarea
                      className="form-textarea w-full"
                      placeholder="Description"
                      rows={2}
                      value={achievement.description}
                      onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                    />
                    <button
                      onClick={() => removeAchievement(index)}
                      className="text-red-500 hover:text-red-700 text-sm mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAchievement}
                  className="btn btn-outline w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Achievement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.achievements.length > 0 ? (
                  profile.achievements.map((achievement, index) => (
                    <div key={index} className="border-l-4 border-calm pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                          <p className="text-sm text-gray-500">{achievement.year}</p>
                          <p className="text-gray-600 mt-1">{achievement.description}</p>
                        </div>
                        <Award className="h-5 w-5 text-sand" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No achievements added yet.</p>
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
                    onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">Speaking Fee Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Min ($)"
                      value={profile.speaking_fee_min}
                      onChange={(e) => setProfile({ ...profile, speaking_fee_min: parseInt(e.target.value) })}
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Max ($)"
                      value={profile.speaking_fee_max}
                      onChange={(e) => setProfile({ ...profile, speaking_fee_max: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Travel Preferences</label>
                  <select
                    className="form-select"
                    value={profile.travel_preferences}
                    onChange={(e) => setProfile({ ...profile, travel_preferences: e.target.value })}
                  >
                    <option value="Flexible">Flexible</option>
                    <option value="Local Only">Local Only</option>
                    <option value="Regional">Regional</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Availability</label>
                  <select
                    className="form-select"
                    value={profile.availability}
                    onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Not Available">Not Available</option>
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
                    ${profile.speaking_fee_min} - ${profile.speaking_fee_max}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Travel</span>
                  <span className="font-semibold">{profile.travel_preferences}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`badge ${profile.availability === 'Available' ? 'badge-success' : 'badge-warning'}`}>
                    {profile.availability}
                  </span>
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
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <button
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
                  style={{ width: '75%' }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Your profile is 75% complete</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-2" />
                  Added bio
                </div>
                <div className="flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-2" />
                  Added specialties
                </div>
                <div className="flex items-center text-gray-400">
                  <X className="h-4 w-4 mr-2" />
                  Add profile photo
                </div>
                <div className="flex items-center text-gray-400">
                  <X className="h-4 w-4 mr-2" />
                  Add past talks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}