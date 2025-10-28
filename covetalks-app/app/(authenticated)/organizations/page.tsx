'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Search,
  Filter,
  Globe,
  Phone,
  Mail,
  DollarSign,
  ChevronRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  organization_type: string
  description: string
  location: string
  city: string
  state: string
  website: string
  logo_url: string
  event_frequency: string
  typical_audience_size: number
  average_audience_size: string
  employee_count: number
  industry: string
  event_types: string[]
  typical_budget: string
  verified: boolean
  memberCount?: number
}

export default function OrganizationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    try {
      // Check if user is a speaker
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: member } = await supabase
        .from('members')
        .select('member_type')
        .eq('id', user.id)
        .single()

      if (member?.member_type !== 'Speaker') {
        router.push('/dashboard')
        return
      }

      // Fetch organizations with member count
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members(count)
        `)
        .order('name')

      if (error) throw error

      // Format the data with member count
      const formattedOrgs = orgs?.map(org => ({
        ...org,
        memberCount: org.organization_members?.[0]?.count || 0
      })) || []

      setOrganizations(formattedOrgs)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter organizations based on search and filters
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = searchQuery === '' || 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.location?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === 'all' || org.organization_type === selectedType
    const matchesIndustry = selectedIndustry === 'all' || org.industry === selectedIndustry
    
    const matchesSize = selectedSize === 'all' || 
      (selectedSize === 'small' && org.employee_count < 50) ||
      (selectedSize === 'medium' && org.employee_count >= 50 && org.employee_count < 500) ||
      (selectedSize === 'large' && org.employee_count >= 500)

    return matchesSearch && matchesType && matchesIndustry && matchesSize
  })

  // Get unique values for filters
  const organizationTypes = Array.from(new Set(organizations.map(org => org.organization_type).filter(Boolean)))
  const industries = Array.from(new Set(organizations.map(org => org.industry).filter(Boolean)))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Organizations</h1>
              <p className="mt-2 text-gray-600">
                Discover organizations looking for speakers like you
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {filteredOrganizations.length} organizations found
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search organizations by name, description, or location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                {organizationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
              >
                <option value="all">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Size
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (1-49 employees)</option>
                <option value="medium">Medium (50-499 employees)</option>
                <option value="large">Large (500+ employees)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

function OrganizationCard({ organization }: { organization: Organization }) {
  return (
    <Link href={`/organizations/${organization.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-16 w-16 rounded-lg object-cover mr-4"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  {organization.name}
                  {organization.verified && (
                    <span className="ml-2 text-blue-500">✓</span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">{organization.organization_type}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {organization.description || 'No description available'}
          </p>

          {/* Details Grid */}
          <div className="space-y-2 mb-4">
            {organization.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                {organization.city && organization.state 
                  ? `${organization.city}, ${organization.state}`
                  : organization.location}
              </div>
            )}
            
            {organization.industry && (
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                {organization.industry}
              </div>
            )}

            {organization.memberCount !== undefined && (
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                {organization.memberCount} team {organization.memberCount === 1 ? 'member' : 'members'}
              </div>
            )}

            {organization.event_frequency && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {organization.event_frequency} events
              </div>
            )}

            {organization.average_audience_size && (
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                {organization.average_audience_size} audience size
              </div>
            )}
          </div>

          {/* Event Types Tags */}
          {organization.event_types && organization.event_types.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {organization.event_types.slice(0, 3).map((type, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {type}
                </span>
              ))}
              {organization.event_types.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{organization.event_types.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* View Details Link */}
          <div className="flex items-center justify-end text-primary text-sm font-medium">
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}