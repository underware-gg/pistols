import { useEffect, useState } from 'react'
import { CallResult } from 'starknet'
import { arrayHasNullElements } from 'src/utils/misc/types'

export const useSdkCallPromise = <T extends CallResult>({
  call,
  args,
  enabled,
  defaultValue = undefined,
  forceCounter = 0,
}: {
  call: (...args: any[]) => Promise<CallResult>,
  enabled: boolean,
  args: any[],
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
      // console.log(`useSdkCallPromise():`, enabled, call.name, args)
      return await call(...args) as T
    }
    if (call && enabled === true && !arrayHasNullElements(args)) {
      setIsLoading(true)
      _get().then((v) => {
        if (_mounted) {
          // console.log(`useSdkCallPromise() GOT:`, call.name, args, v)
          setIsLoading(false)
          setValue(v)
        } else {
          console.warn(`useSdkCallPromise() UNMOUNTED GOT:`, call.name, args, v)
        }
      }).catch((e) => {
        console.error(`useSdkCallPromise() ERROR:`, call.name, args, e)
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
