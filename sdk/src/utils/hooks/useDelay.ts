import { useEffect, useState } from 'react'

export const useDelay = <T,>(value: T, millis: number): T => {
  const [result, setResult] = useState<T>(undefined)
  useEffect(() => {
    let _mounted = true
    const timeout = setTimeout(() => {
      if (_mounted) {
        setResult(value)
      }
    }, millis)
    return () => {
      _mounted = false
      clearTimeout(timeout)
    }
  }, [value, millis])

  return result
}
