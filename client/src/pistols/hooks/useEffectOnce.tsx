import { useEffect, useRef } from "react"

export const useEffectOnce = (effect: () => void, deps: any[]) => {
  const dataFetch = useRef(false)
  useEffect(() => {
    if (dataFetch.current) return
    dataFetch.current = true
    effect()
  }, deps)
}
