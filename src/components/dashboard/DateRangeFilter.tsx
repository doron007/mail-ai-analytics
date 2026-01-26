'use client'

import { useUIStore } from '@/hooks/useUIStore'
import { TimeRange } from '@/services/api/analytics.service'
import { Calendar } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export function DateRangeFilter() {
    const { timeRange, setTimeRange, customDateRange, setCustomDateRange } = useUIStore()

    const handleDateChange = (type: 'from' | 'to', value: string) => {
        const date = value ? new Date(value) : null
        // Adjust for timezone offset to keep the selected date
        if (date) {
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const offsetDate = new Date(date.getTime() + userTimezoneOffset);
            setCustomDateRange({ ...customDateRange, [type]: offsetDate })
        } else {
            setCustomDateRange({ ...customDateRange, [type]: null })
        }
    }

    return (
        <div className="flex items-center gap-4">
            {timeRange === 'custom' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">From</span>
                        <input
                            type="date"
                            className="h-9 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onChange={(e) => handleDateChange('from', e.target.value)}
                            value={customDateRange.from ? customDateRange.from.toISOString().split('T')[0] : ''}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">To</span>
                        <input
                            type="date"
                            className="h-9 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onChange={(e) => handleDateChange('to', e.target.value)}
                            value={customDateRange.to ? customDateRange.to.toISOString().split('T')[0] : ''}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center text-sm text-gray-500 gap-2 px-2">
                    <Calendar className="h-4 w-4" />
                    <span>Time Range:</span>
                </div>
                <Select value={timeRange} onValueChange={(val: string) => setTimeRange(val as TimeRange)}>
                    <SelectTrigger className="w-[140px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="24h">Today</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
