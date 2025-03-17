import { useMemo } from 'react'
import { BigNumberish, BlockTag } from 'starknet'
import { useReadContract } from '@starknet-react/core'
import { bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { decodeMetadata } from 'src/utils/misc/decoder'
import { erc721_abi } from 'src/abis/abis'

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
    owner: (data ?? null) as BigNumberish,
    isLoading,
  }
}

export const useERC721TokenUri = (contractAddress: BigNumberish, tokenId: BigNumberish) => {
  const options = useMemo(() => ({
    abi: erc721_abi,
    functionName: 'token_uri',
    address: bigintToHex(contractAddress ?? 0n),
    args: [bigintToHex(tokenId ?? 0n)],
    enabled: isPositiveBigint(contractAddress) && isPositiveBigint(tokenId),
    watch: false,
    blockIdentifier: BlockTag.LATEST,
    // blockIdentifier: BlockTag.PENDING,
  }), [contractAddress, tokenId])
  const { data, isFetching: isLoading } = useReadContract(options);
  const { metadata, image, animation } = useMemo(() => decodeMetadata(data ?? ''), [data])
  return {
    metadata,
    image,
    animation,
    isLoading,
  }
}
