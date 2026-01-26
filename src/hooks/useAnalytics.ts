import { useQuery } from '@tanstack/react-query'
import { analyticsService, TimeRange, DataSource } from '@/services/api/analytics.service'

export function useAnalytics(range: TimeRange, source: DataSource, customRange?: { from: Date | null, to: Date | null }) {
    return useQuery({
        queryKey: ['analytics', range, source, customRange],
        queryFn: () => analyticsService.getStats(range, source, customRange),
        refetchInterval: 30000,
    })
}

export function useRecentActivity(source: DataSource) {
    return useQuery({
        queryKey: ['recent-activity', source],
        queryFn: () => analyticsService.getRecentActivity(50, source),
        refetchInterval: 10000,
    })
}

export function useVolumeStats(days: number, source: DataSource, customRange?: { from: Date | null, to: Date | null }) {
    return useQuery({
        queryKey: ['volume-stats', days, source, customRange],
        queryFn: () => analyticsService.getDailyVolume(days, source, customRange),
        refetchInterval: 60000,
    })
}
