import { useQuery } from '@tanstack/react-query'
import { BigNumberish, StarknetDomain } from 'starknet'
import { useAccount } from 'src/utils/hooks/useAccount'
import { apiGenerateControllerSalt } from 'src/api/salt'
import { isPositiveBigint } from 'src/utils/misc/types'
import { feltToString } from 'src/starknet/starknet'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// Converted from useEffect + useState. The original treated a non-positive
// result as an error rather than a value, which is preserved by throwing from
// queryFn so react-query records it as an error and salt stays undefined.
//
// messageHash and signature are BigNumberish; react-query hashes keys with
// JSON.stringify, which throws on a bigint, so both are stringified.
export const useApiGenerateControllerSalt = (
  serverUrl: string,
  starknetDomain: StarknetDomain,
  messageHash: BigNumberish,
  signature: BigNumberish[],
  fromAccount?: string,
) => {
  const { address, account } = useAccount();
  const effectiveAddress = fromAccount || address
  const domainChainId = typeof starknetDomain?.chainId === 'number'
    ? feltToString(starknetDomain.chainId)
    : String(starknetDomain?.chainId ?? '')

  const { data: salt, isLoading, isError, error } = useQuery<bigint>({
    ...QUERY_ONCE,
    queryKey: [
      'pistols',
      'api',
      'generateControllerSalt',
      serverUrl,
      String(effectiveAddress ?? ''),
      domainChainId,
      String(messageHash),
      (signature ?? []).map(String),
    ],
    enabled: Boolean(account) && isPositiveBigint(messageHash) && signature?.length > 0,
    queryFn: async () => {
      const result = await apiGenerateControllerSalt(
        serverUrl,
        effectiveAddress,
        starknetDomain,
        messageHash,
        signature,
      )
      if (!isPositiveBigint(result)) throw new Error('apiGenerateControllerSalt() returned no salt')
      return result as bigint
    },
  })

  return {
    isLoading,
    isError,
    error,
    salt,
  }
}
