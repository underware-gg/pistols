import { useQuery } from '@tanstack/react-query'
import { CallResult } from 'starknet'
import { arrayHasNullElements } from 'src/utils/misc/types'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// Converted from useEffect + useState + a mounted flag. react-query owns the
// request lifecycle, which is what react-hooks/set-state-in-effect was pointing
// at. The published shape - { value, isLoading } - is unchanged, and there are
// sixteen call sites in the client depending on it.
//
// Keyed on call.name rather than the function reference, because react-query
// hashes keys with JSON.stringify and cannot hash a function. Every call site
// passes a named imported contract function (getDuelProgress, calcMintFee, and
// so on), so the name is stable and distinct. An anonymous function would key as
// '' and collide with any other anonymous call sharing the same args - worth an
// assert if that ever becomes possible.
//
// args are stringified: they routinely contain bigints, which JSON.stringify
// throws on.
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
} => {
  const { data, isLoading } = useQuery<T>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'call', call?.name ?? '', (args ?? []).map(String), forceCounter],
    // Matches the original guard exactly: no call, not enabled, or any null
    // argument meant the effect fell through to defaultValue without fetching.
    enabled: Boolean(call) && enabled === true && !arrayHasNullElements(args),
    queryFn: async () => await call(...args) as T,
  })

  return {
    // The original set defaultValue whenever it did not fetch, and react-query
    // reports undefined for a disabled or pending query, so the fallback
    // reproduces that.
    value: data ?? defaultValue,
    isLoading,
  }
}
