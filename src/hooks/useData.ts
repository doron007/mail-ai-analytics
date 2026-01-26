import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataService } from '@/services/api/data.service'

export function useDataStats() {
    return useQuery({
        queryKey: ['data-stats'],
        queryFn: () => dataService.getStats(),
    })
}

export function usePurgeTestData() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => dataService.purgeTestData(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['data-stats'] })
            queryClient.invalidateQueries({ queryKey: ['analytics'] }) // Refresh dashboard too
        }
    })
}
