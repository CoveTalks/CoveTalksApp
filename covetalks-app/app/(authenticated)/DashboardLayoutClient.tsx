'use client'

import { useState } from 'react'
import { redirect } from 'next/navigation'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userType: 'Speaker' | 'Organization'
  userName?: string
  userEmail: string
}

export default function DashboardLayoutClient({
  children,
  userType,
  userName,
  userEmail
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        userType={userType}
        userName={userName}
        userEmail={userEmail}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full lg:w-auto">
        {/* Mobile Header with Hamburger */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-600" />
            <span className="sr-only">Open menu</span>
          </button>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">CoveTalks</span>
          </div>
        </header>

        {/* Main Content with Responsive Margin */}
        <main
          className={cn(
            'flex-1 overflow-y-auto transition-all duration-300',
            // Mobile: no margin (sidebar is overlay)
            'lg:ml-64',
            // Desktop: margin based on collapse state
            sidebarCollapsed && 'lg:ml-20'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}