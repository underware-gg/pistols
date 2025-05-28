import { useState, DependencyList, useCallback } from 'react'

export function useAsyncRunner<T>() {
  const [result, setResult] = useState<T | undefined>(undefined)
  const [isRunning, setIsRunning] = useState(false)
  const [isResolved, setIsResolved] = useState(false)
  const [isError, setIsError] = useState(false)
  const run = useCallback((runner: () => Promise<T> | undefined | null) => {
    let _mounted = true
    if (runner && !isRunning) {
      setResult(undefined)
      setIsRunning(true)
      setIsResolved(false)
      setIsError(false)
      runner()
        .then((v) => {
          if (_mounted) {
            setResult(v)
            setIsRunning(false)
            setIsResolved(true)
          }
        })
        .catch((e) => {
          console.warn(`useAsyncRunner() exception:`, e)
          if (_mounted) {
            setResult(undefined)
            setIsRunning(false)
            setIsResolved(false)
            setIsError(true)
          }
        })
    }
    return () => {
      _mounted = false
    }
  }, [])
  return {
    run,
    result,
    isRunning,
    isResolved,
    isError,
  }
}