'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  X, 
  Loader2,
  DollarSign,
  FileText,
  Target,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface ApplicationModalProps {
  opportunity: any
  onClose: () => void
  onSuccess: () => void
}

export default function ApplicationModal({ opportunity, onClose, onSuccess }: ApplicationModalProps) {
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedTopics: [''],
    requestedFee: '',
    availabilityConfirmed: false,
    notes: ''
  })

  const handleAddTopic = () => {
    setFormData(prev => ({
      ...prev,
      proposedTopics: [...prev.proposedTopics, '']
    }))
  }

  const handleRemoveTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      proposedTopics: prev.proposedTopics.filter((_, i) => i !== index)
    }))
  }

  const handleTopicChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      proposedTopics: prev.proposedTopics.map((topic, i) => i === index ? value : topic)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.coverLetter.trim()) {
      setError('Please provide a cover letter')
      return
    }
    
    if (!formData.availabilityConfirmed) {
      setError('Please confirm your availability for the event date')
      return
    }

    // Filter out empty topics
    const topics = formData.proposedTopics.filter(t => t.trim())
    
    setSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to apply')
        return
      }

      // Create application
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          opportunity_id: opportunity.id,
          speaker_id: user.id,
          cover_letter: formData.coverLetter,
          proposed_topics: topics.length > 0 ? topics : null,
          requested_fee: formData.requestedFee ? parseFloat(formData.requestedFee) : null,
          availability_confirmed: formData.availabilityConfirmed,
          notes: formData.notes || null,
          status: 'Pending'
        })

      if (appError) {
        if (appError.message.includes('duplicate')) {
          setError('You have already applied to this opportunity')
        } else {
          setError(appError.message)
        }
        return
      }

      // Update application count on the opportunity
      await supabase
        .from('speaking_opportunities')
        .update({ 
          application_count: (opportunity.application_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunity.id)

      // Success!
      onSuccess()
    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper function to format duration
  function formatDuration(hours: number | null): string {
    if (!hours) return 'TBD'
    if (hours === 1) return '1 hour'
    if (hours % 1 === 0) return `${hours} hours`
    const wholeHours = Math.floor(hours)
    const minutes = (hours % 1) * 60
    if (wholeHours === 0) return `${minutes} minutes`
    return `${wholeHours} hour${wholeHours > 1 ? 's' : ''} ${minutes} minutes`
  }

  // Helper function to format time
  function formatTime(timeString: string | null): string {
    if (!timeString) return ''
    try {
      const [hours, minutes] = timeString.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `at ${displayHour}:${minutes} ${ampm}`
    } catch {
      return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-deep">Apply to Opportunity</h2>
            <p className="text-sm text-gray-600 mt-1">{opportunity.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Event Date Reminder */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Event Details</p>
                <p className="text-sm text-blue-700">
                  {new Date(opportunity.event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {opportunity.event_time && ` ${formatTime(opportunity.event_time)}`}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Location: {opportunity.event_format === 'Virtual' ? 'Virtual Event' : opportunity.location || 'TBD'}
                  {opportunity.venue_name && ` - ${opportunity.venue_name}`}
                </p>
                {opportunity.duration_hours && (
                  <p className="text-sm text-blue-700 mt-1">
                    Duration: {formatDuration(opportunity.duration_hours)}
                  </p>
                )}
                {opportunity.speaker_type && (
                  <p className="text-sm text-blue-700 mt-1">
                    Speaker Type: {opportunity.speaker_type}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline-block h-4 w-4 mr-1" />
              Cover Letter *
            </label>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
              placeholder="Explain why you're the perfect speaker for this opportunity. Include your relevant experience, expertise, and what unique value you'll bring to their audience..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Min 100 characters</p>
          </div>

          {/* Proposed Topics */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="inline-block h-4 w-4 mr-1" />
              Proposed Topics (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-3">
              What specific topics or themes would you cover in your presentation?
            </p>
            {formData.proposedTopics.map((topic, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                  placeholder={`Topic ${index + 1}`}
                />
                {formData.proposedTopics.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddTopic}
              className="text-sm text-calm hover:underline mt-2"
            >
              + Add another topic
            </button>
          </div>

          {/* Requested Fee */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline-block h-4 w-4 mr-1" />
              Requested Speaking Fee (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.requestedFee}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedFee: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
                placeholder="5000"
                min="0"
                step="100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Organization's budget: {opportunity.compensation_amount 
                ? `$${opportunity.compensation_amount.toLocaleString()} ${opportunity.compensation_type || ''}`.trim()
                : 'Not specified'}
            </p>
            {opportunity.additional_benefits && (
              <p className="text-xs text-gray-500 mt-1">
                Additional benefits: {opportunity.additional_benefits}
              </p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calm focus:border-transparent"
              placeholder="Any special requirements, questions, or additional information..."
            />
          </div>

          {/* Travel & Accommodation Info */}
          {(opportunity.travel_covered || opportunity.accommodation_covered) && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-1">Travel & Accommodation</p>
              <ul className="text-sm text-green-700">
                {opportunity.travel_covered && <li>✓ Travel expenses will be covered</li>}
                {opportunity.accommodation_covered && <li>✓ Accommodation will be provided</li>}
              </ul>
            </div>
          )}

          {/* Availability Confirmation */}
          <div className="mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.availabilityConfirmed}
                onChange={(e) => setFormData(prev => ({ ...prev, availabilityConfirmed: e.target.checked }))}
                className="mt-1 rounded border-gray-300 text-calm focus:ring-calm"
                required
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  I confirm that I am available on the event date *
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  By checking this box, you confirm that you have no scheduling conflicts for {new Date(opportunity.event_date).toLocaleDateString()}
                  {opportunity.event_time && ` at ${formatTime(opportunity.event_time).replace('at ', '')}`}
                </p>
              </div>
            </label>
          </div>

          {/* Additional Terms Notice */}
          {opportunity.additional_terms && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-1">Additional Terms</p>
              <p className="text-sm text-amber-700">{opportunity.additional_terms}</p>
              <p className="text-xs text-amber-600 mt-2">
                By submitting this application, you agree to these terms.
              </p>
            </div>
          )}

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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.availabilityConfirmed || !formData.coverLetter.trim()}
              className="flex-1 px-6 py-2 bg-calm text-white rounded-md hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}