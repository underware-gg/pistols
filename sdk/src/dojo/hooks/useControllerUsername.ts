import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BigNumberish } from 'starknet'
import { lookupAddresses } from '@cartridge/controller'
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

export function useControllerUsername(address: BigNumberish) {
  const { usernames, isLoading } = useControllerUsernames(address)
  const { exists, username } = useMemo(() => {
    if (isLoading) {
      return { username: undefined, exists: undefined }
    }
    const username = usernames.get(bigintToHex(address))
    return {
      username: username ?? 'Unknown',
      exists: username !== undefined,
    }
  }, [isLoading, usernames, address])
  return {
    exists,
    username,
    isLoading,
  }
}

export function useControllerUsernames(addresses: BigNumberish | BigNumberish[]) {
  const hexAddresses = useMemo(() => {
    const list =
      Array.isArray(addresses) ? addresses
        : isPositiveBigint(addresses) ? [addresses]
          : []
    return list.map(a => bigintToHex(a))
  }, [addresses])

  // Converted from useEffect + useState. Addresses are hex strings by the time
  // they reach the key, so it serialises; the raw values are BigNumberish and
  // react-query hashes keys with JSON.stringify, which throws on a bigint.
  const { data, isLoading } = useQuery<Map<string, string>>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'controller', 'usernames', hexAddresses],
    enabled: hexAddresses.length > 0,
    queryFn: () => lookupAddresses(hexAddresses),
  })

  // The original held an empty Map as initial state and reset to one when there
  // were no addresses, so callers can rely on a Map being present.
  const usernames = useMemo(() => (data ?? new Map<string, string>()), [data])

  return {
    usernames,
    isLoading,
  }
}
