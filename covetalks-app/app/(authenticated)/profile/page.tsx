'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Camera, Edit, Save, X, Plus, Trash2, Globe, 
  Linkedin, Twitter, Award, BookOpen, Users, Star,
  DollarSign, MapPin, Briefcase, Languages, Calendar,
  Upload, Check, Facebook, Instagram, Youtube, Link2,
  Mic, Trophy
} from 'lucide-react'

interface PastTalk {
  id: string
  title: string
  event: string
  date: string
  location: string
  audience_size: string
  topics: string[]
}

interface Achievement {
  id: string
  title: string
  description: string
  year: string
  icon?: string
}

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
  linkedin_url: string
  twitter: string
  facebook: string
  instagram: string
  youtube: string
  profile_image_url: string
  specialties: string[]
  languages: string[]
  years_experience: number
  speaking_fee_range: { min: number; max: number }
  preferred_audience_size: string
  preferred_formats: string[]
  phone: string
  booking_link: string
  past_talks: PastTalk[]
  achievements: Achievement[]
  social_media: {
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
    other?: string
  }
  metadata?: {
    past_talks?: PastTalk[]
    achievements?: Achievement[]
    social_media?: any
  }
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
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'social'>('overview')
  const [editingTalk, setEditingTalk] = useState<PastTalk | null>(null)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  
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

      const metadata = member.metadata || {}
      
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
        linkedin_url: member.linkedin_url || '',
        twitter: metadata.social_media?.twitter || '',
        facebook: metadata.social_media?.facebook || '',
        instagram: metadata.social_media?.instagram || '',
        youtube: metadata.social_media?.youtube || '',
        profile_image_url: member.profile_image_url || '',
        specialties: member.specialties || [],
        languages: member.languages || ['English'],
        years_experience: member.years_experience || 0,
        speaking_fee_range: member.speaking_fee_range || { min: 0, max: 0 },
        preferred_audience_size: member.preferred_audience_size || 'medium',
        preferred_formats: member.preferred_formats || [],
        phone: member.phone || '',
        booking_link: member.booking_link || '',
        past_talks: metadata.past_talks || [],
        achievements: metadata.achievements || [],
        social_media: metadata.social_media || {},
        metadata: metadata
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
      const metadata = {
        past_talks: profile.past_talks,
        achievements: profile.achievements,
        social_media: {
          twitter: profile.twitter,
          facebook: profile.facebook,
          instagram: profile.instagram,
          youtube: profile.youtube
        }
      }

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
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setEditing(false)
      alert('Profile saved successfully!')
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

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    setUploadingImage(true)
    try {
      if (profile.profile_image_url && profile.profile_image_url.includes('supabase.co/storage')) {
        const oldPath = profile.profile_image_url.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `members/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, profile_image_url: publicUrl })
      alert('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  function addPastTalk() {
    const newTalk: PastTalk = {
      id: Date.now().toString(),
      title: '',
      event: '',
      date: '',
      location: '',
      audience_size: '',
      topics: []
    }
    setEditingTalk(newTalk)
  }

  function savePastTalk(talk: PastTalk) {
    if (!profile) return
    
    const isExisting = editingTalk && profile.past_talks.find(t => t.id === editingTalk.id)
    const updatedTalks = isExisting
      ? profile.past_talks.map(t => t.id === talk.id ? talk : t)
      : [...profile.past_talks, talk]
    
    setProfile({ ...profile, past_talks: updatedTalks })
    setEditingTalk(null)
  }

  function deletePastTalk(id: string) {
    if (!profile) return
    setProfile({
      ...profile,
      past_talks: profile.past_talks.filter(t => t.id !== id)
    })
  }

  function addAchievement() {
    const newAchievement: Achievement = {
      id: Date.now().toString(),
      title: '',
      description: '',
      year: new Date().getFullYear().toString()
    }
    setEditingAchievement(newAchievement)
  }

  function saveAchievement(achievement: Achievement) {
    if (!profile) return
    
    const isExisting = editingAchievement && profile.achievements.find(a => a.id === editingAchievement.id)
    const updatedAchievements = isExisting
      ? profile.achievements.map(a => a.id === achievement.id ? achievement : a)
      : [...profile.achievements, achievement]
    
    setProfile({ ...profile, achievements: updatedAchievements })
    setEditingAchievement(null)
  }

  function deleteAchievement(id: string) {
    if (!profile) return
    setProfile({
      ...profile,
      achievements: profile.achievements.filter(a => a.id !== id)
    })
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
      profile.preferred_formats.length > 0,
      profile.past_talks.length > 0,
      profile.achievements.length > 0
    ]
    
    checks.forEach(check => {
      if (check) score += 100 / checks.length
    })
    
    return Math.round(score)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Unable to load profile. Please try refreshing the page.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-deep">My Profile</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  fetchProfile()
                }}
                className="btn btn-outline"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <Camera className="h-12 w-12" />
                </div>
              )}
            </div>
            {editing && (
              <label className="absolute bottom-0 right-0 bg-calm text-white rounded-full p-2 cursor-pointer hover:bg-opacity-90">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </label>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <>
                <input
                  type="text"
                  className="form-input text-2xl font-bold mb-2"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Name"
                />
                <input
                  type="text"
                  className="form-input mb-2"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  placeholder="Professional Title"
                />
                <input
                  type="text"
                  className="form-input mb-2"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Location"
                />
                <input
                  type="tel"
                  className="form-input"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Phone Number"
                />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-deep">{profile.name}</h2>
                <p className="text-gray-600">{profile.title}</p>
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
        </div>
      </div>

      {editing && (
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-calm text-calm' : 'text-gray-600'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`pb-2 px-4 ${activeTab === 'experience' ? 'border-b-2 border-calm text-calm' : 'text-gray-600'}`}
          >
            Experience & Achievements
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`pb-2 px-4 ${activeTab === 'social' ? 'border-b-2 border-calm text-calm' : 'text-gray-600'}`}
          >
            Links & Social Media
          </button>
        </div>
      )}

      {(!editing || activeTab === 'overview') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ProfileOverviewSection
              profile={profile}
              setProfile={setProfile}
              editing={editing}
              newSpecialty={newSpecialty}
              setNewSpecialty={setNewSpecialty}
              addSpecialty={addSpecialty}
              removeSpecialty={removeSpecialty}
              newFormat={newFormat}
              setNewFormat={setNewFormat}
              addFormat={addFormat}
              removeFormat={removeFormat}
            />
          </div>

          <div className="space-y-6">
            <ProfileDetailsSection
              profile={profile}
              setProfile={setProfile}
              editing={editing}
              newLanguage={newLanguage}
              setNewLanguage={setNewLanguage}
              addLanguage={addLanguage}
              removeLanguage={removeLanguage}
              calculateProfileCompletion={calculateProfileCompletion}
            />
          </div>
        </div>
      )}

      {editing && activeTab === 'experience' && (
        <ProfileExperienceSection
          profile={profile}
          addPastTalk={addPastTalk}
          deletePastTalk={deletePastTalk}
          setEditingTalk={setEditingTalk}
          addAchievement={addAchievement}
          deleteAchievement={deleteAchievement}
          setEditingAchievement={setEditingAchievement}
        />
      )}

      {editing && activeTab === 'social' && (
        <ProfileSocialSection
          profile={profile}
          setProfile={setProfile}
        />
      )}

      {editingTalk && (
        <PastTalkModal
          editingTalk={editingTalk}
          setEditingTalk={setEditingTalk}
          savePastTalk={savePastTalk}
        />
      )}

      {editingAchievement && (
        <AchievementModal
          editingAchievement={editingAchievement}
          setEditingAchievement={setEditingAchievement}
          saveAchievement={saveAchievement}
        />
      )}
    </div>
  )
}

function ProfileOverviewSection({ profile, setProfile, editing, newSpecialty, setNewSpecialty, addSpecialty, removeSpecialty, newFormat, setNewFormat, addFormat, removeFormat }: any) {
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-deep mb-4">About</h2>
        {editing ? (
          <textarea
            className="form-textarea w-full"
            rows={8}
            value={profile.bio}
            onChange={(e: any) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell us about yourself, your experience, and what you speak about..."
          />
        ) : (
          <p className="text-gray-600 whitespace-pre-wrap">
            {profile.bio || 'No bio provided yet.'}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-deep mb-4">Speaking Topics & Expertise</h2>
        {editing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty: string, index: number) => (
                <div key={index} className="badge badge-primary flex items-center gap-2">
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
                placeholder="Add specialty..."
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
              profile.specialties.map((specialty: string, index: number) => (
                <span key={index} className="badge badge-primary">
                  {specialty}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No specialties added yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-deep mb-4">Preferred Speaking Formats</h2>
        {editing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.preferred_formats.map((format: string, index: number) => (
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
                <option value="">Select format...</option>
                <option value="Keynote">Keynote</option>
                <option value="Workshop">Workshop</option>
                <option value="Panel Discussion">Panel Discussion</option>
                <option value="Webinar">Webinar</option>
                <option value="Seminar">Seminar</option>
                <option value="Training Session">Training Session</option>
                <option value="Fireside Chat">Fireside Chat</option>
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
              profile.preferred_formats.map((format: string, index: number) => (
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
    </>
  )
}

function ProfileDetailsSection({ profile, setProfile, editing, newLanguage, setNewLanguage, addLanguage, removeLanguage, calculateProfileCompletion }: any) {
  return (
    <>
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
                onChange={(e: any) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })}
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
                  onChange={(e: any) => setProfile({ 
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
                  onChange={(e: any) => setProfile({ 
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
                <option value="small">Small (&lt; 50)</option>
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-deep mb-4">Languages</h2>
        {editing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((language: string, index: number) => (
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
            {profile.languages.map((language: string, index: number) => (
              <span key={index} className="badge badge-info">
                {language}
              </span>
            ))}
          </div>
        )}
      </div>

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
        </div>
      </div>
    </>
  )
}

function ProfileExperienceSection({ profile, addPastTalk, deletePastTalk, setEditingTalk, addAchievement, deleteAchievement, setEditingAchievement }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-deep">Past Speaking Engagements</h2>
          <button
            onClick={addPastTalk}
            className="btn btn-sm btn-outline flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Talk
          </button>
        </div>
        
        {profile.past_talks.length > 0 ? (
          <div className="space-y-4">
            {profile.past_talks.map((talk: PastTalk) => (
              <div key={talk.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{talk.title || 'Untitled Talk'}</h3>
                    <p className="text-sm text-gray-600">{talk.event}</p>
                    <p className="text-sm text-gray-500">
                      {talk.date} • {talk.location}
                    </p>
                    {talk.audience_size && (
                      <p className="text-sm text-gray-500">Audience: {talk.audience_size}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTalk(talk)}
                      className="text-calm hover:text-deep"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePastTalk(talk.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No past talks added yet.</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-deep">Achievements & Awards</h2>
          <button
            onClick={addAchievement}
            className="btn btn-sm btn-outline flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Achievement
          </button>
        </div>
        
        {profile.achievements.length > 0 ? (
          <div className="space-y-4">
            {profile.achievements.map((achievement: Achievement) => (
              <div key={achievement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold">{achievement.title || 'Untitled Achievement'}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{achievement.year}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAchievement(achievement)}
                      className="text-calm hover:text-deep"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAchievement(achievement.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No achievements added yet.</p>
        )}
      </div>
    </div>
  )
}

function ProfileSocialSection({ profile, setProfile }: any) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-deep mb-6">Links & Social Media</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Professional Links</h3>
          
          <div>
            <label className="form-label flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.website}
              onChange={(e: any) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Link
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.booking_link}
              onChange={(e: any) => setProfile({ ...profile, booking_link: e.target.value })}
              placeholder="https://calendly.com/yourname"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Social Media</h3>
          
          <div>
            <label className="form-label flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.linkedin}
              onChange={(e: any) => setProfile({ ...profile, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter/X
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.twitter}
              onChange={(e: any) => setProfile({ ...profile, twitter: e.target.value })}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.facebook}
              onChange={(e: any) => setProfile({ ...profile, facebook: e.target.value })}
              placeholder="https://facebook.com/yourprofile"
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.instagram}
              onChange={(e: any) => setProfile({ ...profile, instagram: e.target.value })}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube
            </label>
            <input
              type="url"
              className="form-input"
              value={profile.youtube}
              onChange={(e: any) => setProfile({ ...profile, youtube: e.target.value })}
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PastTalkModal({ editingTalk, setEditingTalk, savePastTalk }: any) {
  const [localTalk, setLocalTalk] = useState(editingTalk)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">
          {editingTalk.title ? 'Edit' : 'Add'} Speaking Engagement
        </h3>
        <div className="space-y-4">
          <div>
            <label className="form-label">Talk Title</label>
            <input
              type="text"
              className="form-input"
              value={localTalk.title}
              onChange={(e) => setLocalTalk({ ...localTalk, title: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Event Name</label>
            <input
              type="text"
              className="form-input"
              value={localTalk.event}
              onChange={(e) => setLocalTalk({ ...localTalk, event: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={localTalk.date}
              onChange={(e) => setLocalTalk({ ...localTalk, date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={localTalk.location}
              onChange={(e) => setLocalTalk({ ...localTalk, location: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Audience Size</label>
            <input
              type="text"
              className="form-input"
              value={localTalk.audience_size}
              onChange={(e) => setLocalTalk({ ...localTalk, audience_size: e.target.value })}
              placeholder="e.g., 100-200 people"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingTalk(null)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                savePastTalk(localTalk)
              }}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AchievementModal({ editingAchievement, setEditingAchievement, saveAchievement }: any) {
  const [localAchievement, setLocalAchievement] = useState(editingAchievement)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">
          {editingAchievement.title ? 'Edit' : 'Add'} Achievement
        </h3>
        <div className="space-y-4">
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={localAchievement.title}
              onChange={(e) => setLocalAchievement({ ...localAchievement, title: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={localAchievement.description}
              onChange={(e) => setLocalAchievement({ ...localAchievement, description: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="text"
              className="form-input"
              value={localAchievement.year}
              onChange={(e) => setLocalAchievement({ ...localAchievement, year: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingAchievement(null)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                saveAchievement(localAchievement)
              }}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}