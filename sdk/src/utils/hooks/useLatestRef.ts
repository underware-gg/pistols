import { useRef } from 'react'

/** Keep event-style callbacks current without making them lifecycle triggers. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}
