import { useEffect, useState, DependencyList } from 'react'

export function useMemoAsync<T>(runner: () => Promise<T> | undefined | null, deps: DependencyList, initialValue?: T, errorValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue)
  const [isRunning, setIsRunning] = useState(false)
  const [isResolved, setIsResolved] = useState(false)
  const [isError, setIsError] = useState(false)
  useEffect(() => {
    let _mounted = true
    if (runner) {
      setValue(initialValue)
      setIsResolved(false)
      setIsRunning(true)
      setIsError(false)
      runner()
        .then((val) => {
          if (_mounted) {
            setValue(val)
            setIsRunning(false)
            setIsResolved(true)
          }
        })
        .catch((e) => {
          console.warn(`useMemoAsync() exception:`, e)
          if (_mounted) {
            setValue(errorValue)
            setIsRunning(false)
            setIsResolved(false)
            setIsError(true)
          }
        })
    }
    return () => {
      _mounted = false
    }
  }, deps)
  return {
    value,
    isRunning,
    isResolved,
    isError,
  }
}