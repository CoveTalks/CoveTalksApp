import { Suspense } from 'react'
import ProfileSetupContent from './ProfileSetupContent'

export const dynamic = 'force-dynamic'

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  )
}