'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, MapPin, Users, DollarSign, Clock, 
  Globe, Info, Plus, X, ChevronRight, Save 
} from 'lucide-react'

interface OpportunityForm {
  title: string
  description: string
  event_date: string
  application_deadline: string
  location: string
  venue_name: string
  event_format: 'In-Person' | 'Virtual' | 'Hybrid'
  topics: string[]
  required_specialties: string[]
  preferred_experience_years: number
  audience_size: number
  audience_type: string
  compensation_amount: number
  compensation_type: string
  travel_covered: boolean
  accommodation_covered: boolean
  additional_benefits: string
  speaker_type: string
  additional_terms: string
}

export default function PostOpportunityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [newTopic, setNewTopic] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  
  const [form, setForm] = useState<OpportunityForm>({
    title: '',
    description: '',
    event_date: '',
    application_deadline: '',
    location: '',
    venue_name: '',
    event_format: 'In-Person',
    topics: [],
    required_specialties: [],
    preferred_experience_years: 0,
    audience_size: 0,
    audience_type: '',
    compensation_amount: 0,
    compensation_type: 'Fixed Fee',
    travel_covered: false,
    accommodation_covered: false,
    additional_benefits: '',
    speaker_type: '',
    additional_terms: ''
  })

  const [errors, setErrors] = useState<Partial<Record<keyof OpportunityForm, string>>>({})

  function validateStep(step: number): boolean {
    const newErrors: Partial<Record<keyof OpportunityForm, string>> = {}

    if (step === 1) {
      if (!form.title) newErrors.title = 'Title is required'
      if (!form.description) newErrors.description = 'Description is required'
      if (!form.event_date) newErrors.event_date = 'Event date is required'
      if (!form.application_deadline) newErrors.application_deadline = 'Application deadline is required'
      
      // Validate dates
      const eventDate = new Date(form.event_date)
      const deadline = new Date(form.application_deadline)
      const today = new Date()
      
      if (deadline >= eventDate) {
        newErrors.application_deadline = 'Deadline must be before event date'
      }
      if (deadline <= today) {
        newErrors.application_deadline = 'Deadline must be in the future'
      }
    }

    if (step === 2) {
      if (!form.event_format) newErrors.event_format = 'Event format is required'
      if (form.event_format !== 'Virtual' && !form.location) {
        newErrors.location = 'Location is required for in-person events'
      }
      if (!form.venue_name) newErrors.venue_name = 'Venue name is required'
    }

    if (step === 3) {
      if (form.topics.length === 0) newErrors.topics = 'At least one topic is required'
      if (!form.audience_type) newErrors.audience_type = 'Audience type is required'
      if (!form.audience_size || form.audience_size <= 0) {
        newErrors.audience_size = 'Valid audience size is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    setCurrentStep(currentStep - 1)
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get organization ID
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_id', user.id)
        .single()

      if (!orgMember) throw new Error('Organization not found')

      const { error } = await supabase
        .from('speaking_opportunities')
        .insert({
          ...form,
          organization_id: orgMember.organization_id,
          posted_by: user.id,
          status: 'Open'
        })

      if (error) throw error

      // Success - redirect to opportunities list
      router.push('/opportunities?created=true')
    } catch (error) {
      console.error('Error creating opportunity:', error)
      alert('Failed to create opportunity. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function addTopic() {
    if (newTopic && !form.topics.includes(newTopic)) {
      setForm({ ...form, topics: [...form.topics, newTopic] })
      setNewTopic('')
      setErrors({ ...errors, topics: '' })
    }
  }

  function removeTopic(topic: string) {
    setForm({ ...form, topics: form.topics.filter(t => t !== topic) })
  }

  function addSpecialty() {
    if (newSpecialty && !form.required_specialties.includes(newSpecialty)) {
      setForm({ ...form, required_specialties: [...form.required_specialties, newSpecialty] })
      setNewSpecialty('')
    }
  }

  function removeSpecialty(specialty: string) {
    setForm({ ...form, required_specialties: form.required_specialties.filter(s => s !== specialty) })
  }

  const steps = [
    { number: 1, title: 'Basic Information', icon: Info },
    { number: 2, title: 'Event Details', icon: Calendar },
    { number: 3, title: 'Requirements', icon: Users },
    { number: 4, title: 'Compensation', icon: DollarSign }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">Post a Speaking Opportunity</h1>
        <p className="mt-2 text-gray-600">
          Find the perfect speaker for your event
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="relative flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isActive
                        ? 'bg-calm text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-deep">Basic Information</h2>
            
            <div className="form-group">
              <label className="form-label">
                Opportunity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g., Keynote Speaker for Tech Innovation Summit 2024"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`form-textarea ${errors.description ? 'border-red-500' : ''}`}
                rows={6}
                placeholder="Describe the event, what you're looking for in a speaker, and what they'll be speaking about..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Minimum 100 characters ({form.description.length}/100)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.event_date ? 'border-red-500' : ''}`}
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.event_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.event_date}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Application Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.application_deadline ? 'border-red-500' : ''}`}
                  value={form.application_deadline}
                  onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  max={form.event_date}
                />
                {errors.application_deadline && (
                  <p className="text-sm text-red-500 mt-1">{errors.application_deadline}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Event Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-deep">Event Details</h2>

            <div className="form-group">
              <label className="form-label">
                Event Format <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['In-Person', 'Virtual', 'Hybrid'].map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setForm({ ...form, event_format: format as any })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      form.event_format === format
                        ? 'border-calm bg-calm text-white'
                        : 'border-gray-200 hover:border-calm'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {format === 'In-Person' && <MapPin className="h-5 w-5 mb-1" />}
                      {format === 'Virtual' && <Globe className="h-5 w-5 mb-1" />}
                      {format === 'Hybrid' && <Users className="h-5 w-5 mb-1" />}
                      <span className="text-sm font-medium">{format}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {form.event_format !== 'Virtual' && (
              <div className="form-group">
                <label className="form-label">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.location ? 'border-red-500' : ''}`}
                  placeholder="City, State/Country"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1">{errors.location}</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.venue_name ? 'border-red-500' : ''}`}
                placeholder="e.g., Convention Center, Company HQ, Zoom"
                value={form.venue_name}
                onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
              />
              {errors.venue_name && (
                <p className="text-sm text-red-500 mt-1">{errors.venue_name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Speaker Type</label>
              <select
                className="form-select"
                value={form.speaker_type}
                onChange={(e) => setForm({ ...form, speaker_type: e.target.value })}
              >
                <option value="">Select speaker type...</option>
                <option value="Keynote">Keynote Speaker</option>
                <option value="Workshop">Workshop Leader</option>
                <option value="Panelist">Panelist</option>
                <option value="Moderator">Moderator</option>
                <option value="Presenter">Presenter</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Requirements */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-deep">Speaker Requirements</h2>

            <div className="form-group">
              <label className="form-label">
                Topics <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {form.topics.map((topic) => (
                    <div key={topic} className="badge badge-info flex items-center gap-2">
                      {topic}
                      <button
                        onClick={() => removeTopic(topic)}
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
                    placeholder="Add a topic..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  />
                  <button
                    type="button"
                    onClick={addTopic}
                    className="btn btn-outline"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errors.topics && (
                  <p className="text-sm text-red-500">{errors.topics}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Required Specialties</label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {form.required_specialties.map((specialty) => (
                    <div key={specialty} className="badge badge-info flex items-center gap-2">
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(specialty)}
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
                    placeholder="Add a required specialty..."
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Audience Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.audience_size ? 'border-red-500' : ''}`}
                  placeholder="Expected number of attendees"
                  value={form.audience_size || ''}
                  onChange={(e) => setForm({ ...form, audience_size: parseInt(e.target.value) || 0 })}
                />
                {errors.audience_size && (
                  <p className="text-sm text-red-500 mt-1">{errors.audience_size}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Audience Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.audience_type ? 'border-red-500' : ''}`}
                  placeholder="e.g., Business executives, Students, Healthcare professionals"
                  value={form.audience_type}
                  onChange={(e) => setForm({ ...form, audience_type: e.target.value })}
                />
                {errors.audience_type && (
                  <p className="text-sm text-red-500 mt-1">{errors.audience_type}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Years of Experience</label>
              <select
                className="form-select"
                value={form.preferred_experience_years}
                onChange={(e) => setForm({ ...form, preferred_experience_years: parseInt(e.target.value) })}
              >
                <option value={0}>No preference</option>
                <option value={1}>1+ years</option>
                <option value={3}>3+ years</option>
                <option value={5}>5+ years</option>
                <option value={10}>10+ years</option>
                <option value={15}>15+ years</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Compensation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-deep">Compensation & Benefits</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Speaking Fee</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Amount in USD"
                  value={form.compensation_amount || ''}
                  onChange={(e) => setForm({ ...form, compensation_amount: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Compensation Type</label>
                <select
                  className="form-select"
                  value={form.compensation_type}
                  onChange={(e) => setForm({ ...form, compensation_type: e.target.value })}
                >
                  <option value="Fixed Fee">Fixed Fee</option>
                  <option value="Hourly Rate">Hourly Rate</option>
                  <option value="Negotiable">Negotiable</option>
                  <option value="Volunteer">Volunteer (No Fee)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-calm rounded focus:ring-calm"
                  checked={form.travel_covered}
                  onChange={(e) => setForm({ ...form, travel_covered: e.target.checked })}
                />
                <span className="text-gray-700">Travel expenses covered</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-calm rounded focus:ring-calm"
                  checked={form.accommodation_covered}
                  onChange={(e) => setForm({ ...form, accommodation_covered: e.target.checked })}
                />
                <span className="text-gray-700">Accommodation covered</span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Benefits</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g., Conference pass, networking events, meals included..."
                value={form.additional_benefits}
                onChange={(e) => setForm({ ...form, additional_benefits: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Terms & Requirements</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Any other requirements or information speakers should know..."
                value={form.additional_terms}
                onChange={(e) => setForm({ ...form, additional_terms: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`btn btn-outline ${currentStep === 1 ? 'invisible' : ''}`}
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>Posting...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Post Opportunity
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}