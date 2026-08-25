import { useQuery } from '@tanstack/react-query'
import { BigNumberish, StarknetDomain } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { apiGenerateControllerSalt } from 'src/api/salt'
import { isPositiveBigint } from 'src/utils/misc/types'
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

  const { data: salt, isLoading, isError } = useQuery<bigint>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'api', 'generateControllerSalt', serverUrl, String(messageHash), (signature ?? []).map(String)],
    enabled: Boolean(account) && isPositiveBigint(messageHash) && signature?.length > 0,
    queryFn: async () => {
      const result = await apiGenerateControllerSalt(
        serverUrl,
        fromAccount || address,
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
    salt,
  }
}
