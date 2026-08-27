// Shared react-query options for hooks converted from a useEffect + useState
// fetch. Ordinary reads stay stale so a later mount observes the boundary again,
// while inactive cache entries use TanStack's finite default lifetime.
//
// A plain `new QueryClient()` defaults to refetching on window focus and on
// reconnect, and to retrying a failed request three times. An effect did none of
// that: it ran once per dependency change and gave up on error. Adopting those
// defaults would be a behaviour change smuggled in under a lint fix — and for
// action-shaped requests like auto-reveal it would resend the action when the
// tab regained focus.
//
// Turning focus/reconnect refetching and retries on is a worthwhile improvement,
// but it is a separate decision to take per hook, deliberately.
export const QUERY_ONCE = {
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

// Action-shaped reads must not repeat merely because another observer mounts.
// Keep this separate from ordinary data reads, which are allowed to refresh.
export const ACTION_QUERY_ONCE = {
  ...QUERY_ONCE,
  staleTime: Infinity,
  refetchOnMount: false,
} as const
