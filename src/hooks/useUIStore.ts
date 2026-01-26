import { create } from 'zustand'
import { DataSource } from '@/services/api/analytics.service'

import { TimeRange } from '@/services/api/analytics.service'

interface UIState {
    sidebarOpen: boolean
    dataSource: DataSource
    timeRange: TimeRange
    customDateRange: { from: Date | null, to: Date | null }
    toggleSidebar: () => void
    setDataSource: (source: DataSource) => void
    setTimeRange: (range: TimeRange) => void
    setCustomDateRange: (range: { from: Date | null, to: Date | null }) => void
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    dataSource: 'live',
    timeRange: '7d', // Default to 7d to show chart data immediately
    customDateRange: { from: null, to: null },
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setDataSource: (source) => set({ dataSource: source }),
    setTimeRange: (range) => set({ timeRange: range }),
    setCustomDateRange: (range) => set({ customDateRange: range }),
}))
