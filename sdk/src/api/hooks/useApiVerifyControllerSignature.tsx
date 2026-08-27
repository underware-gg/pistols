import { useQuery } from '@tanstack/react-query'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { apiVerifyControllerSignature } from 'src/api/verify'
import { isPositiveBigint } from 'src/utils/misc/types'
import { feltToString } from 'src/starknet/starknet'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// Converted from useEffect + useState. messageHash and signature are
// BigNumberish, and react-query hashes keys with JSON.stringify which throws on
// a bigint, so both are stringified into the key.
export const useApiVerifyControllerSignature = (
  serverUrl: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
  fromAccount?: string,
) => {
  const { address, account, chainId } = useAccount();
  const effectiveAddress = fromAccount || address
  const chainName = chainId == null ? '' : feltToString(chainId)

  const { data: isValid, isLoading, isError, error } = useQuery({
    ...QUERY_ONCE,
    queryKey: [
      'pistols',
      'api',
      'verifyControllerSignature',
      serverUrl,
      String(effectiveAddress ?? ''),
      chainName,
      String(messageHash),
      (signature ?? []).map(String),
    ],
    enabled: Boolean(account) && isPositiveBigint(messageHash) && signature?.length > 0,
    queryFn: () => apiVerifyControllerSignature(
      serverUrl,
      effectiveAddress,
      chainName,
      messageHash,
      signature,
    ),
  })

  return {
    isLoading,
    isError,
    error,
    isValid,
  }
}
