'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, formatNumber } from '@/lib/utils'
import type { Database } from '@/types/database'
import { GitBranch, ArrowRight, TrendingDown, Zap } from 'lucide-react'

type CorrectionRow = Database['public']['Tables']['email_corrections']['Row'] & {
  email_decisions: { subject: string | null; sender_email: string | null } | null
}
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function LearningPage() {
  // Fetch recent corrections
  const { data: corrections } = useQuery({
    queryKey: ['corrections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_corrections')
        .select(
          `
          *,
          email_decisions (
            subject,
            sender_email
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data || []) as CorrectionRow[]
    },
  })

  // Fetch correction patterns
  const { data: patterns } = useQuery({
    queryKey: ['correction-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_corrections')
        .select('original_folder_path, corrected_folder_path')

      if (error) throw error

      // Group by original -> corrected
      type CorrectionPath = { original_folder_path: string; corrected_folder_path: string }
      const patternMap: Record<string, { count: number; to: string }> = {}
      ;(data || []).forEach((c: CorrectionPath) => {
        const key = `${c.original_folder_path}`
        if (!patternMap[key]) {
          patternMap[key] = { count: 0, to: c.corrected_folder_path }
        }
        // Only track most common correction target
        patternMap[key].count++
      })

      return Object.entries(patternMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([from, data]) => ({
          from: from.split('/').pop() || from,
          to: data.to.split('/').pop() || data.to,
          count: data.count,
        }))
    },
  })

  // Fetch correction rate over time
  const { data: correctionTrend } = useQuery({
    queryKey: ['correction-trend'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get decisions by day
      const { data: decisions } = await supabase
        .from('email_decisions')
        .select('created_at, was_corrected')
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (!decisions) return []

      // Group by day
      type DecisionRow = { created_at: string; was_corrected: boolean }
      const byDay: Record<string, { total: number; corrected: number }> = {}
      ;(decisions as DecisionRow[]).forEach((d) => {
        const day = new Date(d.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
        if (!byDay[day]) {
          byDay[day] = { total: 0, corrected: 0 }
        }
        byDay[day].total++
        if (d.was_corrected) byDay[day].corrected++
      })

      return Object.entries(byDay).map(([date, stats]) => ({
        date,
        rate: stats.total > 0 ? (stats.corrected / stats.total) * 100 : 0,
      }))
    },
  })

  // Calculate stats
  const stats = {
    totalCorrections: corrections?.length || 0,
    avgCorrectionRate:
      correctionTrend && correctionTrend.length > 0
        ? correctionTrend.reduce((sum, d) => sum + d.rate, 0) / correctionTrend.length
        : 0,
    uniquePatterns: patterns?.length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Learning & Corrections
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          How the system learns from your manual folder moves
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Corrections
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(stats.totalCorrections)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Avg Correction Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.avgCorrectionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Learned Patterns
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatNumber(stats.uniquePatterns)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Correction Rate Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Correction Rate Over Time
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Lower is better - shows how AI accuracy improves over time
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={correctionTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Correction Rate']}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correction Patterns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Correction Patterns
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            When AI says X, users correct to Y
          </p>
          <div className="space-y-3">
            {patterns?.map((pattern, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[100px]">
                  {pattern.from}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                  {pattern.to}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {pattern.count}x
                </span>
              </div>
            ))}
            {(!patterns || patterns.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No correction patterns yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Corrections */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Corrections
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {corrections?.map((correction) => (
              <div
                key={correction.id}
                className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                  {(correction.email_decisions as any)?.subject || 'Unknown subject'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(correction.email_decisions as any)?.sender_email}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-red-500 line-through">
                    {correction.original_folder_path?.split('/').pop()}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-green-500">
                    {correction.corrected_folder_path?.split('/').pop()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(correction.created_at)}
                </p>
              </div>
            ))}
            {(!corrections || corrections.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No corrections recorded yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
