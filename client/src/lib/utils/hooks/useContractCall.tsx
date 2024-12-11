import { useEffect, useState } from 'react'
import { arrayHasNullElements } from '@/lib/utils/types'

export const useContractCall = <T extends any>({
  call,
  args = [],
  enabled = true,
  defaultValue = undefined,
}: {
  call: (...args: any[]) => Promise<T>,
  args?: any[],
  enabled?: boolean,
  defaultValue?: T | null | undefined
}): {
  value: typeof defaultValue,
  isLoading: boolean,
} => {
  const [isLoading, setIsLoading] = useState(false)
  const [value, setValue] = useState<T>(defaultValue)
  
  useEffect(() => {
    let _mounted = true
    const _get = async (): Promise<T> => {
      return await call(...args) as T
    }
    if (call && enabled && !arrayHasNullElements(args)) {
      setIsLoading(true)
      _get().then((v) => {
        if (_mounted) {
          setIsLoading(false)
          setValue(v)
        }
      }).catch((e) => {
        console.error(`useContractCall() ERROR:`, call, args, e)
        if (_mounted) {
          setIsLoading(false)
          setValue(defaultValue)
        }
      })
    } else {
      setValue(defaultValue)
    }
    return () => {
      _mounted = false
    }
  }, [call, args, enabled])
  
  return {
    value,
    isLoading,
  }
}
