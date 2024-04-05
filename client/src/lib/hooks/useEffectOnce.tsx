import { useEffect, useRef, DependencyList } from 'react'

export const useEffectOnce = (effect: () => void, deps: DependencyList) => {
  const dataFetch = useRef(false)
  useEffect(() => {
    if (dataFetch.current) return
    dataFetch.current = true
    effect()
  }, deps)
}
