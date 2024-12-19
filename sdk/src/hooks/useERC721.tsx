import { useMemo } from 'react'
import { BigNumberish, BlockTag } from 'starknet'
import { useReadContract } from '@starknet-react/core'
import { bigintToHex, isPositiveBigint } from '../utils'
import { erc721_abi } from '../abi'

export const useERC721OwnerOf = (contractAddress: BigNumberish, tokenId: BigNumberish, watch: boolean = true) => {
  const options = useMemo(() => ({
    abi: erc721_abi,
    functionName: 'owner_of',
    address: bigintToHex(contractAddress ?? 0n),
    args: [bigintToHex(tokenId ?? 0n)],
    enabled: isPositiveBigint(contractAddress) && isPositiveBigint(tokenId),
    watch,
    blockIdentifier: BlockTag.LATEST,
    // blockIdentifier: BlockTag.PENDING,
  }), [contractAddress, tokenId])
  const { data, isFetching: isLoading } = useReadContract(options);
  return {
    owner: data ?? null,
    isLoading,
  }
}
