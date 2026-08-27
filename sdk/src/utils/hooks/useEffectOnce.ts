import { useEffect, DependencyList, EffectCallback } from 'react'

export const useEffectOnce = (effect: EffectCallback, deps: DependencyList) => {
  // This remains a named convenience for existing SDK consumers, but lifecycle
  // semantics belong to React: setup is repeated after a StrictMode probe and
  // the callback's cleanup is always retained and invoked.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, deps)
}
