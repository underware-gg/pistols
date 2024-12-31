import { useEffect, useState } from 'react'
import { Result } from 'starknet'
import { arrayHasNullElements } from 'src/utils/misc/types'

export const useSdkCallPromise = <T extends Result>({
  call,
  args = [],
  enabled = true,
  defaultValue = undefined,
  forceCounter = 0,
}: {
  call: (...args: any[]) => Promise<Result>,
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
        console.error(`useSdkCallPromise() ERROR:`, call, args, e)
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
