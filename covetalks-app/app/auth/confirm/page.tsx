import { Suspense } from 'react'
import ConfirmContent from './ConfirmContent'

export const dynamic = 'force-dynamic'

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Please wait
          </p>
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}