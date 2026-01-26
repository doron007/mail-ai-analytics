import { BaseService } from './base.service'
import { Database } from '@/types/database'

export type TimeRange = '24h' | '7d' | '30d' | 'all' | 'custom'
export type DataSource = 'live' | 'test' | 'all'

export class AnalyticsService extends BaseService {
    async getStats(range: TimeRange = '24h', source: DataSource = 'live', customRange?: { from: Date | null, to: Date | null }) {
        const startDate = new Date()
        let endDate: Date | undefined = undefined

        switch (range) {
            case '24h':
                // User requested "Today" behavior (Since Midnight)
                startDate.setHours(0, 0, 0, 0)
                break
            case '7d':
                startDate.setDate(startDate.getDate() - 7)
                break
            case '30d':
                startDate.setDate(startDate.getDate() - 30)
                break
            case 'all':
                startDate.setTime(0) // Start of epoch
                break
            case 'custom':
                if (customRange?.from) {
                    startDate.setTime(customRange.from.getTime())
                    // If to is provided, use it, otherwise default to now
                    if (customRange.to) {
                        endDate = new Date(customRange.to)
                        // Make sure endDate includes the full last day
                        endDate.setHours(23, 59, 59, 999)
                    }
                }
                break
            default:
                startDate.setDate(startDate.getDate() - 1)
        }

        // Base query - remove limits to get full stats for aggregation
        let query = this.supabase
            .from('email_analytics')
            .select('*')
            .gte('timestamp', startDate.toISOString())

        if (endDate) {
            query = query.lte('timestamp', endDate.toISOString())
        }

        if (source === 'live') {
            query = query
                .neq('workflow_name', 'Historical Backfill')
                .not('workflow_name', 'ilike', '%test%')
        } else if (source === 'test') {
            query = query.or('workflow_name.eq.Historical Backfill,workflow_name.ilike.%test%')
        }

        const { data, error } = await query.returns<any[]>()
        if (error) throw error

        // Client-side Aggregation
        if (!data || data.length === 0) {
            return {
                emailsProcessed: 0,
                successRate: 0,
                avgProcessingTime: 0,
                corrections: 0
            }
        }

        // 1. Processed = Unique Subjects (approx. unique emails)
        const uniqueEmails = new Set(data.map(d => d.subject))
        const emailsProcessed = uniqueEmails.size

        // 2. Success Rate = (Successful Operations / Total Operations) * 100
        const successCount = data.filter(d => d.status === 'success').length
        const totalOps = data.length
        const successRate = totalOps > 0 ? (successCount / totalOps) * 100 : 0

        // 3. Avg Duration (ms)
        // Filter out 0 or null durations to avoid skewing average down if data is missing
        const durations = data.map(d => d.duration_ms || 0).filter(d => d > 0)
        const totalDuration = durations.reduce((a, b) => a + b, 0)
        const avgProcessingTime = durations.length > 0 ? totalDuration / durations.length : 0

        // 4. Corrections (Joined count)
        let correctionsQuery = this.supabase
            .from('email_corrections')
            .select('id', { count: 'exact' })
            .gte('created_at', startDate.toISOString())

        if (endDate) {
            correctionsQuery = correctionsQuery.lte('created_at', endDate.toISOString())
        }

        const { count: correctionsCount } = await correctionsQuery

        return {
            emailsProcessed,
            successRate,
            avgProcessingTime,
            corrections: correctionsCount || 0
        }
    }

    async getRecentActivity(limit = 50, source: DataSource = 'live') {
        let query = this.supabase
            .from('email_analytics')
            .select('id, timestamp, operation_type, subject, status, duration_ms, workflow_name')
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (source === 'live') {
            query = query
                .neq('workflow_name', 'Historical Backfill')
                .not('workflow_name', 'ilike', '%test%')
        }

        const { data, error } = await query
        if (error) throw error
        return data
    }

    async getDailyVolume(days = 7, source: DataSource = 'live', customRange?: { from: Date | null, to: Date | null }) {
        const startDate = new Date()
        let endDate: Date | undefined = undefined

        if (customRange?.from && customRange?.to) {
            startDate.setTime(customRange.from.getTime())
            endDate = new Date(customRange.to)
            endDate.setHours(23, 59, 59, 999)

            // Calculate days between
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        } else {
            startDate.setDate(startDate.getDate() - days)
            startDate.setHours(0, 0, 0, 0)
        }

        // Fetch raw analytics
        let query = this.supabase
            .from('email_analytics')
            .select('timestamp, operation_type, workflow_name, status, subject')
            .gte('timestamp', startDate.toISOString())

        if (endDate) {
            query = query.lte('timestamp', endDate.toISOString())
        }

        if (source === 'live') {
            query = query
                .neq('workflow_name', 'Historical Backfill')
                .not('workflow_name', 'ilike', '%test%')
        }

        const { data: analyticsData, error } = await query.returns<any[]>()
        if (error) throw error

        // Fetch corrections
        let correctionsQuery = this.supabase
            .from('email_corrections')
            .select('created_at')
            .gte('created_at', startDate.toISOString())

        const { data: correctionsData } = await correctionsQuery.returns<any[]>()

        // Aggregate by Day
        const dailyMap = new Map<string, {
            date: string,
            fullDate: string,
            processedSubjects: Set<string>, // Use Set to track unique subjects per day
            processed: number,
            corrections: number
        }>()

        // Init last n days
        for (let i = 0; i < days; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toDateString()
            // Use local YYYY-MM-DD format to match the visual "Today" and avoid UTC +1 day shifts
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const localFullDate = `${year}-${month}-${day}`

            dailyMap.set(key, {
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: localFullDate,
                processedSubjects: new Set(),
                processed: 0,
                corrections: 0
            })
        }

        // Fill Analytics (Unique Subjects per Day)
        analyticsData?.forEach(record => {
            const date = new Date(record.timestamp!)
            const key = date.toDateString()
            if (dailyMap.has(key)) {
                const entry = dailyMap.get(key)!
                // Add subject to Set. processing volume = unique emails that touched the system that day
                if (record.subject) {
                    entry.processedSubjects.add(record.subject)
                }
            }
        })

        // Fill Corrections
        correctionsData?.forEach(record => {
            const date = new Date(record.created_at)
            const key = date.toDateString()
            if (dailyMap.has(key)) {
                dailyMap.get(key)!.corrections++
            }
        })

        // Convert Sets to counts
        const result = Array.from(dailyMap.values()).map(entry => ({
            date: entry.date,
            fullDate: entry.fullDate,
            processed: entry.processedSubjects.size, // The aggregated count
            corrections: entry.corrections
        }))

        return result.reverse()
    }
}

export const analyticsService = new AnalyticsService()
