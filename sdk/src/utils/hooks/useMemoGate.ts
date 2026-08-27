import { useMemo, DependencyList } from 'react'

//
// like useMemo()
// but if any of the deps is null, return the defaultValue (null)
//
export function useMemoGate<T>(runner: () => T, deps: DependencyList, defaultValue: T | null | undefined = null): (T | null | undefined) {
  const result = useMemo<T | null | undefined>(() => (
    deps.some(e => (e == null)) ? defaultValue : runner()
  // This hook mirrors useMemo: callers own the dependency contract for runner,
  // the gate values, and the default.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), deps);
  return result;
}
