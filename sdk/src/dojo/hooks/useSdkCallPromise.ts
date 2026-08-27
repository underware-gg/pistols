import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CairoCustomEnum, CallResult } from 'starknet'
import { arrayHasNullElements } from 'src/utils/misc/types'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

const callIds = new WeakMap<Function, number>()
let nextCallId = 1

const getCallId = (call: Function) => {
  let id = callIds.get(call)
  if (id == null) {
    id = nextCallId++
    callIds.set(call, id)
  }
  return id
}

const normalizeQueryValue = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(normalizeQueryValue)
  if (value instanceof CairoCustomEnum) {
    return {
      variant: value.activeVariant(),
      value: normalizeQueryValue(value.unwrap()),
    }
  }
  if (value != null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, normalizeQueryValue(entry)]),
    )
  }
  return value
}

export const useSdkCallPromise = <T extends CallResult>({
  call,
  args,
  enabled,
  defaultValue = undefined,
  forceCounter = 0,
}: {
  call: (...args: any[]) => Promise<CallResult>,
  enabled: boolean,
  args: any[],
  defaultValue?: T | null | undefined
  forceCounter?: number
}): {
  value: typeof defaultValue,
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
} => {
  const canFetch = Boolean(call) && enabled === true && !arrayHasNullElements(args)
  const queryKey = useMemo(() => [
    'pistols',
    'call',
    call ? getCallId(call) : 0,
    normalizeQueryValue(args ?? []),
  ], [call, args])
  const { data, isLoading, isError, error, refetch } = useQuery<T>({
    ...QUERY_ONCE,
    queryKey,
    enabled: canFetch,
    queryFn: async () => await call(...args) as T,
  })

  const previousForceCounter = useRef(forceCounter)
  useEffect(() => {
    if (previousForceCounter.current !== forceCounter) {
      previousForceCounter.current = forceCounter
      if (canFetch) void refetch()
    }
  }, [canFetch, forceCounter, refetch])

  return {
    value: !canFetch ? defaultValue : isError ? undefined : (data ?? defaultValue),
    isLoading,
    isError,
    error,
  }
}
