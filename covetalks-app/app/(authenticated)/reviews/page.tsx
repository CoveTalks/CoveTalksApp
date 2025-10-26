'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, ThumbsUp, MessageSquare, TrendingUp, Award, Calendar, User } from 'lucide-react'

interface Review {
  id: string
  speaker_id: string
  organization_id: string
  opportunity_id: string
  rating: number
  review_text: string
  reviewer_name: string
  reviewer_role: string
  event_name: string
  event_date: string
  is_featured: boolean
  helpful_count: number
  created_at: string
  organizations: {
    name: string
    logo_url: string
  }
}

interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: { [key: number]: number }
  recentTrend: 'up' | 'down' | 'stable'
  featuredCount: number
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          organizations (
            name,
            logo_url
          )
        `)
        .eq('speaker_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setReviews(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(reviewData: Review[]) {
    const total = reviewData.length
    const sum = reviewData.reduce((acc, r) => acc + r.rating, 0)
    const average = total > 0 ? sum / total : 0

    const distribution: { [key: number]: number } = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }

    reviewData.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })

    // Calculate trend (comparing last 3 months to previous 3 months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recentReviews = reviewData.filter(r => 
      new Date(r.created_at) > threeMonthsAgo
    )
    const previousReviews = reviewData.filter(r => {
      const date = new Date(r.created_at)
      return date > sixMonthsAgo && date <= threeMonthsAgo
    })

    const recentAvg = recentReviews.length > 0 
      ? recentReviews.reduce((acc, r) => acc + r.rating, 0) / recentReviews.length
      : 0
    const previousAvg = previousReviews.length > 0
      ? previousReviews.reduce((acc, r) => acc + r.rating, 0) / previousReviews.length
      : 0

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (recentAvg > previousAvg + 0.1) trend = 'up'
    else if (recentAvg < previousAvg - 0.1) trend = 'down'

    setStats({
      totalReviews: total,
      averageRating: average,
      ratingDistribution: distribution,
      recentTrend: trend,
      featuredCount: reviewData.filter(r => r.is_featured).length
    })
  }

  function getFilteredReviews() {
    let filtered = [...reviews]

    // Filter
    switch(filter) {
      case '5star':
        filtered = filtered.filter(r => r.rating === 5)
        break
      case '4star':
        filtered = filtered.filter(r => r.rating === 4)
        break
      case 'featured':
        filtered = filtered.filter(r => r.is_featured)
        break
    }

    // Sort
    switch(sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'helpful':
        filtered.sort((a, b) => b.helpful_count - a.helpful_count)
        break
      case 'rating-high':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'rating-low':
        filtered.sort((a, b) => a.rating - b.rating)
        break
    }

    return filtered
  }

  function renderStars(rating: number) {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  async function markHelpful(reviewId: string) {
    try {
      const review = reviews.find(r => r.id === reviewId)
      if (!review) return

      const { error } = await supabase
        .from('reviews')
        .update({ helpful_count: review.helpful_count + 1 })
        .eq('id', reviewId)

      if (!error) {
        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, helpful_count: r.helpful_count + 1 }
            : r
        ))
      }
    } catch (error) {
      console.error('Error marking review helpful:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calm mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  const filteredReviews = getFilteredReviews()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep">Reviews & Ratings</h1>
        <p className="mt-2 text-gray-600">
          See what organizations are saying about your speaking engagements
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Average Rating</p>
              {stats.recentTrend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-deep">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="ml-2 text-gray-500">/5.0</span>
            </div>
            {renderStars(Math.round(stats.averageRating))}
          </div>

          {/* Total Reviews */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Reviews</p>
              <MessageSquare className="h-5 w-5 text-calm opacity-50" />
            </div>
            <p className="text-3xl font-bold text-deep">{stats.totalReviews}</p>
            <p className="text-sm text-gray-500">From speaking engagements</p>
          </div>

          {/* 5-Star Reviews */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">5-Star Reviews</p>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-deep">
              {stats.ratingDistribution[5]}
            </p>
            <p className="text-sm text-gray-500">
              {stats.totalReviews > 0 
                ? `${Math.round((stats.ratingDistribution[5] / stats.totalReviews) * 100)}%`
                : '0%'} of all reviews
            </p>
          </div>

          {/* Featured Reviews */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Featured</p>
              <Award className="h-5 w-5 text-sand opacity-50" />
            </div>
            <p className="text-3xl font-bold text-deep">{stats.featuredCount}</p>
            <p className="text-sm text-gray-500">Highlighted reviews</p>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-deep mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating] || 0
              const percentage = stats.totalReviews > 0 
                ? (count / stats.totalReviews) * 100 
                : 0

              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-calm h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter and Sort */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-calm text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('5star')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === '5star'
                  ? 'bg-calm text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              5 Stars ({stats?.ratingDistribution[5] || 0})
            </button>
            <button
              onClick={() => setFilter('4star')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === '4star'
                  ? 'bg-calm text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              4 Stars ({stats?.ratingDistribution[4] || 0})
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'featured'
                  ? 'bg-calm text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Featured ({stats?.featuredCount || 0})
            </button>
          </div>

          <select
            className="form-select w-full sm:w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating-high">Highest Rated</option>
            <option value="rating-low">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="empty-state bg-white rounded-lg shadow-md p-12">
          <div className="text-center">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500">
              Complete speaking engagements to start receiving reviews
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                review.is_featured ? 'ring-2 ring-sand' : ''
              }`}
            >
              {review.is_featured && (
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-sand" />
                  <span className="text-sm font-medium text-sand">Featured Review</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Organization Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {review.organizations?.logo_url ? (
                      <img
                        src={review.organizations.logo_url}
                        alt={review.organizations.name}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-foam flex items-center justify-center">
                        <span className="text-deep font-bold">
                          {review.organizations?.name?.[0] || 'O'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                      <p className="text-sm text-gray-600">
                        {review.reviewer_role} at {review.organizations?.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.event_date).toLocaleDateString()}
                        </span>
                        <span>{review.event_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium text-gray-700">
                      {review.rating}.0
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-700 mb-4">{review.review_text}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => markHelpful(review.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-calm"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Helpful ({review.helpful_count})
                    </button>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}