import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BigNumberish, RpcProvider } from 'starknet'
import { QUERY_ONCE } from 'src/utils/hooks/queryOnce'

// Converted from useEffect + useState + a mounted flag.
//
// The original keyed on the provider instance. A provider is not serialisable, so
// the key uses its node URL instead - the thing that actually distinguishes one
// provider from another for this purpose. Verified present as
// provider.channel.nodeUrl on starknet.js RpcProvider.
export const useContractClassHash = (contractAddress: BigNumberish, provider: RpcProvider) => {
  const nodeUrl = useMemo(() => (provider?.channel?.nodeUrl ?? ''), [provider])

  const { data: classHash, isLoading, isError, error } = useQuery<BigNumberish>({
    ...QUERY_ONCE,
    queryKey: ['pistols', 'classHashAt', nodeUrl, String(contractAddress)],
    enabled: Boolean(contractAddress) && Boolean(provider),
    queryFn: () => provider.getClassHashAt(contractAddress),
  })

  const isDeployed = useMemo(() => (contractAddress ? Boolean(classHash) : undefined), [classHash, contractAddress])

  return {
    classHash,
    isDeployed,
    isLoading,
    isError,
    error,
  }
}
