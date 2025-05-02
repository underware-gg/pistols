import { useMemo, DependencyList } from 'react'

//
// like useMemo()
// but if any of the deps is null, return the defaultValue (null)
//
export function useMemoGate<T>(runner: () => T, deps: DependencyList, defaultValue: T | null | undefined = null): (T | null | undefined) {
  const result = useMemo<T | null | undefined>(() => (
    deps.some(e => (e == null)) ? defaultValue : runner()
  ), deps);
  return result;
}
