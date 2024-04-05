import { useEffect, useState, DependencyList } from 'react'

export function useAsyncMemo<T>(factory: () => Promise<T> | undefined | null, deps: DependencyList, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue)
  const [isRunning, setIsRunning] = useState(false)
  const [isResolved, setIsResolved] = useState(false)
  useEffect(() => {
    let _mounted = true
    const promise = factory()
    if (initialValue !== undefined) {
      setValue(initialValue)
      setIsResolved(false)
    }
    setIsRunning(true)
    promise?.then((val) => {
      if (_mounted) {
        setValue(val)
        setIsRunning(false)
        setIsResolved(true)
      }
    })
    return () => {
      _mounted = false
    }
  }, deps)
  return {
    value,
    isRunning,
    isResolved,
  }
}