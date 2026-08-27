import { useEffect, useRef, DependencyList } from 'react'

export const useEffectOnce = (effect: () => void, deps: DependencyList) => {
  const dataFetch = useRef(false)
  useEffect(() => {
    if (dataFetch.current) return
    dataFetch.current = true
    effect()
  // The caller owns the trigger contract; the ref guarantees the body can still
  // run only once even when the supplied dependencies change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
