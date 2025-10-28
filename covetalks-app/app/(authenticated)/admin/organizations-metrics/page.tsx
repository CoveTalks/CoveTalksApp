'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OrganizationMetrics() {
  const [metrics, setMetrics] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchMetrics() {
      const { data } = await supabase
        .from('organization_performance_metrics')
        .select('*')
      
      setMetrics(data || [])
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <div key={metric.metric} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">{metric.metric}</h3>
          <p className="text-2xl font-bold">{metric.value}</p>
        </div>
      ))}
    </div>
  )
}