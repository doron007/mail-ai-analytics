import { useQuery } from '@tanstack/react-query'
import { decisionsService } from '@/services/api/decisions.service'

export function useDecisions() {
    return useQuery({
        queryKey: ['decisions'],
        queryFn: () => decisionsService.getDecisions(),
        refetchInterval: 15000,
    })
}

export function useCorrections() {
    return useQuery({
        queryKey: ['corrections'],
        queryFn: () => decisionsService.getCorrections(),
        refetchInterval: 30000,
    })
}
