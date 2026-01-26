'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

type DateRange = '24h' | '7d' | '30d'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d')

  const getStartDate = () => {
    const now = new Date()
    switch (dateRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  // Fetch volume timeline
  const { data: timeline } = useQuery({
    queryKey: ['analytics-timeline', dateRange],
    queryFn: async () => {
      const startDate = getStartDate()
      const { data, error } = await supabase
        .from('email_analytics')
        .select('timestamp, operation_type')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true })

      if (error) throw error

      // Group by hour/day depending on range
      const grouped: Record<string, number> = {}
      ;(data || []).forEach((item: { timestamp: string; operation_type: string | null }) => {
        const date = new Date(item.timestamp)
        const key =
          dateRange === '24h'
            ? `${date.getHours()}:00`
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        grouped[key] = (grouped[key] || 0) + 1
      })

      return Object.entries(grouped).map(([time, count]) => ({
        time,
        count,
      }))
    },
  })

  // Fetch action distribution
  const { data: actionDistribution } = useQuery({
    queryKey: ['analytics-actions', dateRange],
    queryFn: async () => {
      const startDate = getStartDate()
      const { data, error } = await supabase
        .from('email_decisions')
        .select('ai_action')
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const counts: Record<string, number> = {}
      ;(data || []).forEach((item: { ai_action: string | null }) => {
        const action = item.ai_action || 'unknown'
        counts[action] = (counts[action] || 0) + 1
      })

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }))
    },
  })

  // Fetch folder distribution
  const { data: folderDistribution } = useQuery({
    queryKey: ['analytics-folders', dateRange],
    queryFn: async () => {
      const startDate = getStartDate()
      const { data, error } = await supabase
        .from('email_decisions')
        .select('final_folder_path')
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const counts: Record<string, number> = {}
      ;(data || []).forEach((item: { final_folder_path: string | null }) => {
        const folder = item.final_folder_path?.split('/').pop() || 'Unknown'
        counts[folder] = (counts[folder] || 0) + 1
      })

      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))
    },
  })

  // Fetch cost breakdown
  const { data: costBreakdown } = useQuery({
    queryKey: ['analytics-costs', dateRange],
    queryFn: async () => {
      const startDate = getStartDate()
      const { data, error } = await supabase
        .from('email_analytics')
        .select('model_used, estimated_cost_usd, input_tokens, output_tokens')
        .gte('timestamp', startDate.toISOString())

      if (error) throw error

      type CostItem = { model_used: string | null; estimated_cost_usd: number | null; input_tokens: number | null; output_tokens: number | null }
      const byModel: Record<
        string,
        { cost: number; inputTokens: number; outputTokens: number }
      > = {}
      ;(data || []).forEach((item: CostItem) => {
        const model = item.model_used || 'unknown'
        if (!byModel[model]) {
          byModel[model] = { cost: 0, inputTokens: 0, outputTokens: 0 }
        }
        byModel[model].cost += item.estimated_cost_usd || 0
        byModel[model].inputTokens += item.input_tokens || 0
        byModel[model].outputTokens += item.output_tokens || 0
      })

      return Object.entries(byModel).map(([model, data]) => ({
        model,
        ...data,
      }))
    },
  })

  // Fetch reply skip reasons
  const { data: skipReasons } = useQuery({
    queryKey: ['analytics-skip-reasons', dateRange],
    queryFn: async () => {
      const startDate = getStartDate()
      const { data, error } = await supabase
        .from('email_decisions')
        .select('ai_reply_skip_reason')
        .gte('created_at', startDate.toISOString())
        .not('ai_reply_skip_reason', 'is', null)

      if (error) throw error

      const counts: Record<string, number> = {}
      ;(data || []).forEach((item: { ai_reply_skip_reason: string | null }) => {
        const reason = item.ai_reply_skip_reason || 'unknown'
        counts[reason] = (counts[reason] || 0) + 1
      })

      return Object.entries(counts).map(([name, value]) => ({ name, value }))
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Email processing patterns and trends
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Email Volume
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
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
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Action Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={actionDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {actionDistribution?.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {actionDistribution?.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name}: {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skip Reasons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Reply Skip Reasons
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skipReasons || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {skipReasons?.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {skipReasons?.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name}: {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Folder Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Folders
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={folderDistribution || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cost by Model
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3 text-right">Input Tokens</th>
                <th className="px-4 py-3 text-right">Output Tokens</th>
                <th className="px-4 py-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {costBreakdown?.map((row) => (
                <tr
                  key={row.model}
                  className="border-b border-gray-100 dark:border-gray-700/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {row.model}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                    {formatNumber(row.inputTokens)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                    {formatNumber(row.outputTokens)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {formatCurrency(row.cost)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  Total
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                  {formatNumber(
                    costBreakdown?.reduce((sum, r) => sum + r.inputTokens, 0) || 0
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                  {formatNumber(
                    costBreakdown?.reduce((sum, r) => sum + r.outputTokens, 0) || 0
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                  {formatCurrency(
                    costBreakdown?.reduce((sum, r) => sum + r.cost, 0) || 0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
