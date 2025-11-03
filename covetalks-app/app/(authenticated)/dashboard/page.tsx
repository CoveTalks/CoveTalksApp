import { createClient } from '@/lib/supabase/server'
import DashboardHeader from '@/components/layout/DashboardHeader'
import {
  Briefcase,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Building2,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single()

  const isSpeaker = member?.member_type === 'Speaker'

  // Get statistics
  const getStats = async () => {
    if (isSpeaker) {
      // Speaker stats
      const { count: opportunitiesCount } = await supabase
        .from('speaking_opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open')

      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('speaker_id', user.id)

      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('status', 'unread')

      return {
        opportunities: opportunitiesCount || 0,
        applications: applicationsCount || 0,
        messages: messagesCount || 0,
        rating: member?.average_rating || 0,
      }
    } else {
      // Organization stats
      const { count: opportunitiesCount } = await supabase
        .from('speaking_opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('posted_by', user.id)

      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*, speaking_opportunities!inner(*)', { count: 'exact', head: true })
        .eq('speaking_opportunities.posted_by', user.id)

      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('status', 'unread')

      return {
        opportunities: opportunitiesCount || 0,
        applications: applicationsCount || 0,
        messages: messagesCount || 0,
        events: 0, // Placeholder for upcoming events
      }
    }
  }

  const stats = await getStats()

  return (
    <div>
      <DashboardHeader
        title={isSpeaker ? 'Speaker Dashboard' : 'Organization Dashboard'}
        description={`Welcome back, ${member?.name || 'User'}!`}
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {isSpeaker ? (
            <>
              <StatCard
                title="Available Opportunities"
                value={stats.opportunities ?? 0}
                icon={Briefcase}
                color="blue"
              />
              <StatCard
                title="My Applications"
                value={stats.applications ?? 0}
                icon={FileText}
                color="green"
              />
              <StatCard
                title="Unread Messages"
                value={stats.messages ?? 0}
                icon={MessageSquare}
                color="purple"
              />
              <StatCard
                title="Average Rating"
                value={stats.rating.toFixed(1)}
                icon={TrendingUp}
                color="amber"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Active Opportunities"
                value={stats.opportunities ?? 0} 
                icon={Briefcase}
                color="blue"
              />
              <StatCard
                title="Total Applications"
                value={stats.applications ?? 0}
                icon={Users}
                color="green"
              />
              <StatCard
                title="Unread Messages"
                value={stats.messages ?? 0}
                icon={MessageSquare}
                color="purple"
              />
              <StatCard
                title="Upcoming Events"
                value={stats.events ?? 0}
                icon={Calendar}
                color="amber"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border bg-white p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isSpeaker ? (
              <>
                <ActionButton
                  title="Browse Opportunities"
                  description="Find your next speaking engagement"
                  href="/opportunities"
                  icon={Briefcase}
                />
                <ActionButton
                  title="Update Profile"
                  description="Keep your profile current"
                  href="/profile"
                  icon={FileText}
                />
                <ActionButton
                  title="View Messages"
                  description="Check your inbox"
                  href="/messages"
                  icon={MessageSquare}
                />
              </>
            ) : (
              <>
                <ActionButton
                  title="Post Opportunity"
                  description="List a new speaking opportunity"
                  href="/opportunities/new"
                  icon={Briefcase}
                />
                <ActionButton
                  title="Browse Speakers"
                  description="Find the perfect speaker"
                  href="/speakers"
                  icon={Users}
                />
                <ActionButton
                  title="Review Applications"
                  description="Check pending applications"
                  href="/applications"
                  icon={FileText}
                />
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <p className="text-muted-foreground text-sm">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number | string
  icon: any
  color: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: any
}) {
  return (
    <a
      href={href}
      className="flex items-start space-x-4 rounded-lg border p-4 hover:border-primary hover:shadow-md transition-all"
    >
      <div className="rounded-lg bg-primary/10 p-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </a>
  )
}
