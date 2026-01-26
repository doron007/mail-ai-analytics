'use client'

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { useVolumeStats } from '@/hooks/useAnalytics'
import { useUIStore } from '@/hooks/useUIStore'

import { useRouter } from 'next/navigation'

export function VolumeChart() {
    const { theme } = useTheme()
    const { dataSource, timeRange, customDateRange } = useUIStore()

    // Convert timeRange to days for useVolumeStats (approx) 
    // Ideally useVolumeStats should accept TimeRange string
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365

    const { data: volumeData, isLoading } = useVolumeStats(days, dataSource, customDateRange)
    const isDark = theme === 'dark'
    const router = useRouter()

    return (
        <Card className="col-span-2 h-full border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                        Processing Volume (Unique Emails)
                    </CardTitle>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-gray-500">Processed</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-gray-500">Corrections</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={volumeData || []}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        const dateStr = data.activePayload[0].payload.fullDate
                                        if (dateStr) {
                                            router.push(`/search?date=${dateStr}`)
                                        }
                                    }
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCorrections" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke={isDark ? '#374151' : '#e5e7eb'}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                        borderColor: isDark ? '#374151' : '#e5e7eb',
                                        borderRadius: '0.75rem',
                                        color: isDark ? '#f3f4f6' : '#111827',
                                    }}
                                    itemStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="processed"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorProcessed)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="corrections"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCorrections)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
