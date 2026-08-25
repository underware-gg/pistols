import { useQuery } from '@tanstack/react-query'
import { apiSlotServiceStatus, SlotServiceStatusResponse } from 'src/api/slotServiceStatus'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// Was a useEffect driving three useState calls, with a mounted flag to avoid
// setting state after unmount. react-query owns that lifecycle; the hook's
// published shape is unchanged.
export const useApiSlotServiceStatus = (
  serviceUrl: string,
) => {
  const { data: status, isLoading, isError } = useQuery<SlotServiceStatusResponse>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'api', 'slotServiceStatus', serviceUrl],
    enabled: Boolean(serviceUrl),
    queryFn: () => apiSlotServiceStatus(serviceUrl),
  })

  return {
    isLoading,
    isError,
    status,
  }
}
