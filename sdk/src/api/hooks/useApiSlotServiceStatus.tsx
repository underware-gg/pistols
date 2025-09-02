import { useEffect, useState } from 'react'
import { apiSlotServiceStatus, SlotServiceStatusResponse } from 'src/api/slotServiceStatus'

export const useApiSlotServiceStatus = (
  serviceUrl: string,
) => {
  const [status, setStatus] = useState<SlotServiceStatusResponse | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const [isError, setIsError] = useState<boolean>();

  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      setIsLoading(true);
      setIsError(undefined);
      try {
        const result = await apiSlotServiceStatus(serviceUrl);  
        if (_mounted) {
          setIsLoading(false);
          setStatus(result);
        }
      } catch (e) {
        console.error(e)
        if (_mounted) {
          setIsLoading(false);
          setIsError(true);
        }
      }
    }
    setStatus(undefined);
    if (serviceUrl) {
      _fetch()
    }
    return () => {
      _mounted = false
    }
  }, [serviceUrl])

  return {
    isLoading,
    isError,
    status,
  }
}

