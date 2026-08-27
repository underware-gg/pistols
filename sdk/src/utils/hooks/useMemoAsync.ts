import { useEffect, useState, DependencyList } from 'react'

export function useMemoAsync<T>(runner: () => Promise<T> | undefined | null, deps: DependencyList, initialValue?: T, errorValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue)
  const [isRunning, setIsRunning] = useState(false)
  const [isResolved, setIsResolved] = useState(false)
  const [isError, setIsError] = useState(false)
  useEffect(() => {
    let _mounted = true
    if (runner) {
      // A generic "run an async thing when these deps change" utility. Its deps are an
      // opaque DependencyList, so there is no stable serialisable key to hand
      // react-query, and inventing one from String(dep) would collide across distinct
      // objects. Effect-shaped by nature.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // This hook mirrors useEffect: callers own the dependency contract for runner
  // and its associated values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return {
    value,
    isRunning,
    isResolved,
    isError,
  }
}
