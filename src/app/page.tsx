'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useUIStore } from '@/hooks/useUIStore'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { RecentEmails } from '@/components/dashboard/RecentEmails'
import { VolumeChart } from '@/components/dashboard/VolumeChart'
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter'

export default function DashboardPage() {
  const { dataSource, timeRange, customDateRange } = useUIStore()
  const { data: stats, isLoading: statsLoading } = useAnalytics(timeRange, dataSource, customDateRange)

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Real-time overview of email processing activity.</p>
        </div>
        <DateRangeFilter />
      </div>

      <StatsOverview stats={stats} loading={statsLoading} timeRange={timeRange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 h-full">
          <VolumeChart />
        </div>

        {/* Recent Emails */}
        <div className="lg:col-span-1 h-full">
          <RecentEmails />
        </div>
      </div>
    </div>
  )
}
