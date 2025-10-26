'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  User,
  Settings,
  FileText,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  LogOut,
  Plus,
  Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  userType: 'Speaker' | 'Organization'
  userName?: string
  userEmail?: string
}

// For Speakers
const speakerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/applications', label: 'My Applications', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
]

// For Organizations
const organizationNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'My Opportunities', icon: Briefcase },
  { href: '/opportunities/new', label: 'Post Opportunity', icon: Plus },
  { href: '/speakers', label: 'Browse Speakers', icon: Users },
  { href: '/applications', label: 'Applications', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/saved', label: 'Saved Speakers', icon: Heart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ userType, userName, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = userType === 'Speaker' ? speakerNavItems : organizationNavItems

  const handleSignOut = async () => {
    // TODO: Implement sign out logic
    console.log('Sign out')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className={cn(
          'flex h-16 items-center border-b px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">CoveTalks</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="border-b p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{userName || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                <p className="text-xs text-primary font-medium mt-1">
                  {userType === 'Speaker' ? '🎤 Speaker' : '🏢 Organization'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100',
                      collapsed && 'justify-center'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className={cn(
              'w-full',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
            onClick={handleSignOut}
          >
            <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
