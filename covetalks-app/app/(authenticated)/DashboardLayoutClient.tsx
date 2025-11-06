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
      <div className="flex flex-col w-full lg:flex-1">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden w-full sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 h-16">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center justify-center p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Open menu"
              type="button"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
            
            <div className="flex-1 flex items-center justify-center">
              <span className="text-lg font-semibold text-deep">CoveTalks</span>
            </div>
            
            <div className="w-10"></div>
          </div>
        </div>

        {/* Main Content with Responsive Margin */}
        <main
          className={cn(
            'flex-1 w-full overflow-y-auto transition-all duration-300',
            // Mobile: no margin (sidebar is overlay)
            'ml-0 lg:ml-64',
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