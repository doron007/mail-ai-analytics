'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, truncate } from '@/lib/utils'
import type { Database } from '@/types/database'

type AnalyticsRow = Database['public']['Tables']['email_analytics']['Row']
import { useState } from 'react'
import {
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function ErrorsPage() {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 20

  // Fetch error timeline
  const { data: errorTimeline } = useQuery({
    queryKey: ['error-timeline'],
    queryFn: async () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('email_analytics')
        .select('timestamp')
        .eq('status', 'error')
        .gte('timestamp', sevenDaysAgo.toISOString())

      if (error) throw error

      // Group by day
      const byDay: Record<string, number> = {}
      ;(data || []).forEach((item: { timestamp: string }) => {
        const day = new Date(item.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
        byDay[day] = (byDay[day] || 0) + 1
      })

      return Object.entries(byDay).map(([date, count]) => ({ date, count }))
    },
  })

  // Fetch errors list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['errors', search, page],
    queryFn: async () => {
      let query = supabase
        .from('email_analytics')
        .select('*', { count: 'exact' })
        .eq('status', 'error')
        .order('timestamp', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (search) {
        query = query.or(
          `error_message.ilike.%${search}%,workflow_name.ilike.%${search}%,node_name.ilike.%${search}%`
        )
      }

      const { data, count, error } = await query

      if (error) throw error
      return { errors: (data || []) as AnalyticsRow[], total: count || 0 }
    },
  })

  // Fetch error patterns
  const { data: errorPatterns } = useQuery({
    queryKey: ['error-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_analytics')
        .select('error_code, error_message')
        .eq('status', 'error')

      if (error) throw error

      const patterns: Record<string, number> = {}
      ;(data || []).forEach((item: { error_code: string | null; error_message: string | null }) => {
        const key = item.error_code || item.error_message?.substring(0, 50) || 'Unknown'
        patterns[key] = (patterns[key] || 0) + 1
      })

      return Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }))
    },
  })

  const totalPages = Math.ceil((data?.total || 0) / pageSize)
  const totalErrors = data?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error Monitor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and investigate workflow errors
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Errors
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalErrors}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Top Error Types
          </h3>
          <div className="space-y-2">
            {errorPatterns?.map((pattern, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {pattern.error}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {pattern.count}x
                </span>
              </div>
            ))}
            {(!errorPatterns || errorPatterns.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No errors recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Error Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Errors Over Time (7 days)
        </h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={errorTimeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search errors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Errors Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Workflow</th>
                    <th className="px-4 py-3">Node</th>
                    <th className="px-4 py-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.errors.map((error) => (
                    <>
                      <tr
                        key={error.id}
                        onClick={() =>
                          setExpandedId(expandedId === error.id ? null : error.id)
                        }
                        className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          {expandedId === error.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(error.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {error.workflow_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {error.node_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">
                          {truncate(error.error_message || 'Unknown error', 60)}
                        </td>
                      </tr>
                      {expandedId === error.id && (
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Error Code
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white font-mono">
                                  {error.error_code || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Error Message
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {error.error_message || 'N/A'}
                                </p>
                              </div>
                              {error.error_stack && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Stack Trace
                                  </p>
                                  <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto max-h-48">
                                    {error.error_stack}
                                  </pre>
                                </div>
                              )}
                              {error.subject && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Email Subject
                                  </p>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {error.subject}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.errors.length === 0 && (
              <div className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No errors found</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.total > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {page * pageSize + 1} -{' '}
                  {Math.min((page + 1) * pageSize, data.total)} of {data.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
