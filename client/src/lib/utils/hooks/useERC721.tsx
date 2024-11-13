import { useMemo } from 'react'
import { useReadContract } from '@starknet-react/core'
import { BigNumberish, BlockTag } from 'starknet'
import { bigintToHex, isPositiveBigint } from '@/lib/utils/types'
import { erc721_abi } from '@/lib/abi'

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
  const { data, isFetching: isPending } = useReadContract(options);
  return {
    owner: data ?? null,
    isPending,
  }
}
