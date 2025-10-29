'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  X, 
  Loader2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Briefcase,
  Award,
  Info
} from 'lucide-react'

interface OpportunityEditModalProps {
  opportunity: any
  onClose: () => void
  onSuccess: () => void
}

export default function OpportunityEditModal({ opportunity, onClose, onSuccess }: OpportunityEditModalProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Initialize with empty values first, then populate with useEffect
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '', // Added to match DB
    duration_hours: '', // Changed from event_duration/presentation_duration
    location: '',
    venue_name: '',
    event_format: 'In-Person' as 'In-Person' | 'Virtual' | 'Hybrid',
    compensation_amount: '',
    compensation_type: '',
    audience_size: '',
    audience_type: '', // Added to match DB
    topics: [] as string[],
    required_specialties: [] as string[], // Changed from requirements
    preferred_experience_years: '', // Changed from preferred_experience
    travel_covered: false, // Changed from travel_provided
    accommodation_covered: false, // Changed from accommodation_provided
    additional_benefits: '', // Added to match DB
    speaker_type: '', // Added to match DB
    additional_terms: '', // Added to match DB
    status: 'Open' as 'Open' | 'Closed' | 'Filled' | 'Cancelled',
    application_deadline: ''
  })

  const [newTopic, setNewTopic] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')

  // Populate form data when component mounts or opportunity changes
  useEffect(() => {
    if (opportunity) {
      setFormData({
        title: opportunity.title || '',
        description: opportunity.description || '',
        event_date: opportunity.event_date ? opportunity.event_date.split('T')[0] : '',
        event_time: opportunity.event_time || '',
        duration_hours: opportunity.duration_hours?.toString() || '',
        location: opportunity.location || '',
        venue_name: opportunity.venue_name || '',
        event_format: opportunity.event_format || 'In-Person',
        compensation_amount: opportunity.compensation_amount?.toString() || '',
        compensation_type: opportunity.compensation_type || '',
        audience_size: opportunity.audience_size?.toString() || '',
        audience_type: opportunity.audience_type || '',
        topics: opportunity.topics || [],
        required_specialties: opportunity.required_specialties || [],
        preferred_experience_years: opportunity.preferred_experience_years?.toString() || '',
        travel_covered: opportunity.travel_covered || false,
        accommodation_covered: opportunity.accommodation_covered || false,
        additional_benefits: opportunity.additional_benefits || '',
        speaker_type: opportunity.speaker_type || '',
        additional_terms: opportunity.additional_terms || '',
        status: opportunity.status || 'Open',
        application_deadline: opportunity.application_deadline ? opportunity.application_deadline.split('T')[0] : ''
      })
    }
  }, [opportunity])

  // Safety check - don't render if no opportunity
  if (!opportunity) {
    return null
  }

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }))
      setNewTopic('')
    }
  }

  const handleRemoveTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }))
  }

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      setFormData(prev => ({
        ...prev,
        required_specialties: [...prev.required_specialties, newSpecialty.trim()]
      }))
      setNewSpecialty('')
    }
  }

  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_specialties: prev.required_specialties.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    
    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }
    
    if (!formData.event_date) {
      setError('Event date is required')
      return
    }
    
    if (!formData.application_deadline) {
      setError('Application deadline is required')
      return
    }
    
    // Check deadline is before event date
    if (new Date(formData.application_deadline) >= new Date(formData.event_date)) {
      setError('Application deadline must be before the event date')
      return
    }
    
    setSaving(true)
    
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        location: formData.location || null,
        venue_name: formData.venue_name || null,
        event_format: formData.event_format,
        compensation_amount: formData.compensation_amount ? parseFloat(formData.compensation_amount) : null,
        compensation_type: formData.compensation_type || null,
        audience_size: formData.audience_size ? parseInt(formData.audience_size) : null,
        audience_type: formData.audience_type || null,
        topics: formData.topics.length > 0 ? formData.topics : null,
        required_specialties: formData.required_specialties.length > 0 ? formData.required_specialties : null,
        preferred_experience_years: formData.preferred_experience_years ? parseInt(formData.preferred_experience_years) : null,
        travel_covered: formData.travel_covered,
        accommodation_covered: formData.accommodation_covered,
        additional_benefits: formData.additional_benefits || null,
        speaker_type: formData.speaker_type || null,
        additional_terms: formData.additional_terms || null,
        status: formData.status,
        application_deadline: formData.application_deadline,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('speaking_opportunities')
        .update(updateData)
        .eq('id', opportunity.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Success!
      onSuccess()
    } catch (err: any) {
      console.error('Error updating opportunity:', err)
      setError('Failed to update opportunity. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-deep">Edit Opportunity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Status */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
            >
              <option value="Open">Open - Accepting applications</option>
              <option value="Closed">Closed - No longer accepting</option>
              <option value="Filled">Filled - Position filled</option>
              <option value="Cancelled">Cancelled - Event cancelled</option>
            </select>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., Keynote Speaker for Annual Conference"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="Describe the opportunity, event theme, and what you're looking for..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline-block h-4 w-4 mr-1" />
                  Event Date *
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline-block h-4 w-4 mr-1" />
                  Event Time
                </label>
                <input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline-block h-4 w-4 mr-1" />
                  Application Deadline *
                </label>
                <input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline-block h-4 w-4 mr-1" />
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., 1.5"
                  min="0"
                  max="999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Format
                </label>
                <select
                  value={formData.event_format}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_format: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline-block h-4 w-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="City, State or Virtual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venue_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., Convention Center, Hotel Name"
                />
              </div>
            </div>
          </div>

          {/* Audience Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline-block h-4 w-4 mr-1" />
                  Audience Size
                </label>
                <input
                  type="number"
                  value={formData.audience_size}
                  onChange={(e) => setFormData(prev => ({ ...prev, audience_size: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., 500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline-block h-4 w-4 mr-1" />
                  Audience Type
                </label>
                <input
                  type="text"
                  value={formData.audience_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, audience_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., Business professionals, Students, General public"
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline-block h-4 w-4 mr-1" />
                  Speaker Fee
                </label>
                <input
                  type="number"
                  value={formData.compensation_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="5000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Type
                </label>
                <input
                  type="text"
                  value={formData.compensation_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, compensation_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., Flat fee, Hourly, Per session"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="inline-block h-4 w-4 mr-1" />
                  Additional Benefits
                </label>
                <textarea
                  value={formData.additional_benefits}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_benefits: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., Networking opportunities, Complimentary conference pass, Marketing exposure..."
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.travel_covered}
                  onChange={(e) => setFormData(prev => ({ ...prev, travel_covered: e.target.checked }))}
                  className="rounded border-gray-300 text-calm focus:ring-calm"
                />
                <span className="text-sm font-medium text-gray-700">Travel expenses covered</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.accommodation_covered}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodation_covered: e.target.checked }))}
                  className="rounded border-gray-300 text-calm focus:ring-calm"
                />
                <span className="text-sm font-medium text-gray-700">Accommodation provided</span>
              </label>
            </div>
          </div>

          {/* Topics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics of Interest</h3>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                placeholder="Add a topic..."
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-4 py-2 bg-calm text-white rounded-md hover:bg-deep"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-calm/10 text-calm rounded-full text-sm font-medium"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(index)}
                    className="ml-2 text-calm hover:text-deep"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Speaker Requirements */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Speaker Requirements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="inline-block h-4 w-4 mr-1" />
                  Preferred Experience (Years)
                </label>
                <input
                  type="number"
                  value={formData.preferred_experience_years}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_experience_years: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., 5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speaker Type
                </label>
                <input
                  type="text"
                  value={formData.speaker_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, speaker_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="e.g., Keynote, Workshop Leader, Panelist"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Specialties</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder="Add a required specialty..."
                />
                <button
                  type="button"
                  onClick={handleAddSpecialty}
                  className="px-4 py-2 bg-calm text-white rounded-md hover:bg-deep"
                >
                  Add
                </button>
              </div>

              <ul className="space-y-2">
                {formData.required_specialties.map((specialty, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{specialty}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Terms */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Info className="inline-block h-4 w-4 mr-1" />
              Additional Terms & Conditions
            </label>
            <textarea
              value={formData.additional_terms}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_terms: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
              placeholder="Any additional terms, conditions, or requirements..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-calm text-white rounded-md hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}