import { useMemo } from 'react'
import { useCookies } from 'react-cookie'

export const accountNameCookieName = (address) => (`name_${address ?? '?'}`)

export const useAccountName = (address) => {
  const cookieName = useMemo(() => accountNameCookieName(address), [address])
  const [cookies, setCookie] = useCookies([cookieName])
  const accountName = useMemo(() => (cookies[cookieName] ?? 'Unknown'), [cookies[cookieName]])
  return {
    accountName,
  }
}
