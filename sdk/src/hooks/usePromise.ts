import { useEffect, useState } from 'react'
import { arrayHasNullElements } from 'src/utils/types'

export const usePromise = <T extends any>({
  call,
  args = [],
  enabled = true,
  defaultValue = undefined,
  forceCounter = 0,
}: {
  call: (...args: any[]) => Promise<T>,
  args?: any[],
  enabled?: boolean,
  defaultValue?: T | null | undefined
  forceCounter?: number
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
        console.error(`usePromise() ERROR:`, call, args, e)
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
  }, [call, args, enabled, forceCounter])
  
  return {
    value,
    isLoading,
  }
}
