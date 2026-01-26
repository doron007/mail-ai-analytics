'use client'

import { Card } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'

// Helper for compact number formatting
function formatMetric(value: number) {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
}

interface StatProps {
    label: string
    value: string | number
    trend?: number
    trendLabel?: string
    color?: 'blue' | 'violet' | 'green' | 'red' | 'amber'
}

function StatCard({ label, value, trend, trendLabel, color = 'blue' }: StatProps) {
    // For now we don't have historical trend data for cards, so we hide the trend pill if undefined
    const isPositive = trend && trend >= 0
    // Sparkline data placeholder - we will hide this for now as we don't have real 10-point history per card yet
    const sparkData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    const colorMap = {
        blue: '#3b82f6',
        violet: '#8b5cf6',
        green: '#10b981',
        red: '#f43f5e',
        amber: '#f59e0b'
    }

    return (
        <div className="bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-${color}-500 blur-xl rounded-full w-24 h-24 -mr-6 -mt-6`} />

            <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                {/* Hide Trend for now until we have comparative data */}
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400'
                        }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <div className="space-y-1 mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
                {trendLabel && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{trendLabel}</p>
                )}
            </div>

            {/* Hidden Sparkline for now to avoid confusion */}
            <div className="h-10 -mx-2 opacity-0">
                <Sparkline data={sparkData} color={colorMap[color]} height={40} />
            </div>
        </div>
    )
}

import { TimeRange } from '@/services/api/analytics.service'

export function StatsOverview({ stats, loading, timeRange }: { stats: any, loading: boolean, timeRange: TimeRange }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
                ))}
            </div>
        )
    }

    const rangeLabel = timeRange === '24h' ? 'Today' : timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : 'all time'

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Emails Processed"
                value={formatMetric(stats?.emailsProcessed || 0)}
                // trend={12.5}  // Removed hardcoded trend
                trendLabel={`Unique subjects (${rangeLabel})`}
                color="blue"
            />
            <StatCard
                label="Success Rate"
                value={`${(stats?.successRate || 0).toFixed(1)}%`}
                // trend={0.8} // Removed hardcoded trend
                trendLabel="Based on ops status"
                color="green"
            />
            {/* Only show Avg Response Time if we have valid data (> 0) */
                (stats?.avgProcessingTime || 0) > 0 && (
                    <StatCard
                        label="Avg Response Time"
                        value={`${(stats?.avgProcessingTime || 0).toFixed(0)}ms`}
                        trendLabel="End-to-end duration"
                        color="violet"
                    />
                )}
            {/* Clickable Corrections Card - Drills down to Corrections Page */}
            <div className="cursor-pointer" onClick={() => window.location.href = '/corrections'}>
                <StatCard
                    label="Corrections"
                    value={stats?.corrections || 0}
                    // trend={-2.1} // Removed hardcoded trend
                    trendLabel="Requires attention"
                    color="amber"
                />
            </div>
        </div>
    )
}
