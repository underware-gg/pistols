import { useEffect, useState } from 'react'

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
  isPending: boolean,
} => {
  const [isPending, setIsPending] = useState(false)
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    let _mounted = true
    const _get = async (): Promise<T> => {
      return await call(...args) as T
    }
    if (call && enabled) {
      setIsPending(true)
      _get().then((v) => {
        if (_mounted) {
          setIsPending(false)
          setValue(v)
        }
      }).catch((e) => {
        console.error(`useDojoContractCall() ERROR:`, call, args, e)
        if (_mounted) {
          setIsPending(false)
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
    isPending,
  }
}
