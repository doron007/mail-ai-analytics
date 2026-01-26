import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsService } from './analytics.service'

const mockSelect = vi.fn()
const mockSupabase = {
    from: vi.fn(() => ({
        select: mockSelect,
    })),
}

describe('AnalyticsService', () => {
    let service: AnalyticsService

    beforeEach(() => {
        vi.clearAllMocks()
        service = new AnalyticsService(mockSupabase as any)

        // Default chain mocks
        mockSelect.mockReturnThis()
    })

    it('should filter out test and backfill data when source is "live"', async () => {
        const mockGte = vi.fn().mockReturnThis()
        const mockNeq = vi.fn().mockReturnThis()
        const mockNot = vi.fn().mockReturnValue({ data: [], error: null })

        mockSelect.mockReturnValue({
            gte: mockGte,
        })

        // Mock chain for live path
        mockGte.mockReturnValue({
            neq: mockNeq,
        })
        mockNeq.mockReturnValue({ // .neq('workflow_name', 'Historical Backfill')
            not: mockNot // .not('workflow_name', 'ilike', '%test%')
        })

        await service.getStats('24h', 'live')

        // Verify filters were applied
        expect(mockNeq).toHaveBeenCalledWith('workflow_name', 'Historical Backfill')
        expect(mockNot).toHaveBeenCalledWith('workflow_name', 'ilike', '%test%')
    })

    it('should include test data when source is "test"', async () => {
        const mockGte = vi.fn().mockReturnThis()
        const mockOr = vi.fn().mockReturnValue({ data: [], error: null })

        mockSelect.mockReturnValue({
            gte: mockGte,
        })

        // Mock chain for test path
        mockGte.mockReturnValue({
            or: mockOr
        })

        await service.getStats('24h', 'test')

        // Verify OR filter was applied for test data
        expect(mockOr).toHaveBeenCalledWith('workflow_name.eq.Historical Backfill,workflow_name.ilike.%test%')
    })
})
