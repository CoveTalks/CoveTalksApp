'use client'

import { useState } from 'react'
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
      <div className="flex flex-col flex-1 w-full">
        {/* Mobile Header with Hamburger */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-deep">CoveTalks</span>
          </div>
          {/* Empty div for spacing */}
          <div className="w-10"></div>
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