'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  Heart,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  userType: 'Speaker' | 'Organization'
  userName?: string
  userEmail?: string
  mobileMenuOpen: boolean
  onMobileMenuClose: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

// For Speakers
const speakerNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
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
  { href: '/opportunities/create', label: 'Post Opportunity', icon: Plus },
  { href: '/speakers', label: 'Browse Speakers', icon: Users },
  { href: '/applications', label: 'Applications', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/saved', label: 'Saved Speakers', icon: Heart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ 
  userType, 
  userName, 
  userEmail, 
  mobileMenuOpen, 
  onMobileMenuClose,
  collapsed,
  onCollapsedChange
}: SidebarProps) {
  const [signingOut, setSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = userType === 'Speaker' ? speakerNavItems : organizationNavItems

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      setSigningOut(false)
    }
  }

  // Close mobile menu when route changes
  useEffect(() => {
    onMobileMenuClose()
  }, [pathname, onMobileMenuClose])

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          // Mobile: slide in/out from left
          'lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: respect collapse state
          collapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile: always full width when open
          'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!collapsed && (
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {userName && (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              </div>
            )}

            {/* Desktop Collapse Button */}
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onMobileMenuClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* User Type Badge */}
          {!collapsed && (
            <div className="px-4 py-3 bg-foam border-b border-gray-200">
              <div className="flex items-center">
                <div className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  userType === 'Speaker' 
                    ? 'bg-calm/10 text-calm' 
                    : 'bg-secondary/10 text-secondary'
                )}>
                  {userType === 'Speaker' ? '🎤 Speaker' : '🏢 Organization'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                
                // Better active state detection
                const isActive = (() => {
                  const exactMatchExists = navItems.some(navItem => pathname === navItem.href)
                  
                  if (exactMatchExists) {
                    return pathname === item.href
                  } else {
                    if (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) {
                      return true
                    }
                  }
                  
                  return false
                })()
                
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
                      title={collapsed ? item.label : undefined}
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
              disabled={signingOut}
              title={collapsed ? 'Sign Out' : undefined}
            >
              <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}