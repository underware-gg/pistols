// Shared react-query options for hooks converted from a useEffect + useState
// fetch, so the conversion preserves behaviour rather than quietly changing it.
//
// A plain `new QueryClient()` defaults to refetching on window focus and on
// reconnect, and to retrying a failed request three times. An effect did none of
// that: it ran once per dependency change and gave up on error. Adopting the
// defaults would be a behaviour change smuggled in under a lint fix — and for
// action-shaped requests like auto-reveal it would re-send the POST every time
// the tab regained focus.
//
// Turning refetching and retries on is a worthwhile improvement, but it is a
// separate decision to take per hook, deliberately.
export const QUERY_ONCE = {
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const
