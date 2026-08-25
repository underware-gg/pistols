import { useQuery } from '@tanstack/react-query'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { isPositiveBigint } from 'src/utils/misc/types'
import { feltToString } from 'src/starknet/starknet'
import { apiAutoReveal } from 'src/api/reveal'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// Converted from useEffect + useState. QUERY_ONCE matters more here than
// elsewhere: this sends a reveal, so react-query's default refetch-on-focus and
// three retries would re-send it. The trigger stays "once per input change",
// which is what the effect did.
//
// duelId is a BigNumberish and react-query hashes keys with JSON.stringify,
// which throws on a bigint, so it is stringified into the key.
export const useApiAutoReveal = (
  serverUrl: string,
  duelId: BigNumberish,
  enabled: boolean,
) => {
  const { chainId } = useAccount();

  const { data: isRevealed, isLoading: isRevealing } = useQuery({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'api', 'autoReveal', serverUrl, String(chainId), String(duelId)],
    enabled: enabled && isPositiveBigint(duelId),
    queryFn: () => apiAutoReveal(serverUrl, duelId, feltToString(chainId)),
  })

  return {
    isRevealing,
    isRevealed,
  }
}
