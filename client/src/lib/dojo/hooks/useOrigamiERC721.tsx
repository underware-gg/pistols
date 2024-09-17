import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { Components, getComponentValue } from '@dojoengine/recs'
import { useComponentValue } from '@dojoengine/react'
import { keysToEntity } from '@/lib/utils/types'


type MetadataResult = {
  name: string
  symbol: string
  baseUri: string
  isPending: boolean
}
export const useOrigamiERC721Metadata = (token_address: BigNumberish, components: Components): MetadataResult => {
  const { ERC721MetaModel } = components
  const entityId = useMemo(() => keysToEntity([token_address]), [token_address])
  const result: any = useComponentValue(ERC721MetaModel, entityId)
  return {
    name: (result?.name ?? null),
    symbol: (result?.symbol ?? null),
    baseUri: (result?.base_uri ?? null),
    isPending: (result == null),
  }
}

type TotalSupplyResult = {
  totalSupply: number
  isPending: boolean
}
export const useOrigamiERC721TotalSupply = (token_address: BigNumberish, components: Components): TotalSupplyResult => {
  const { ERC721EnumerableTotalModel } = components
  const entityId = useMemo(() => keysToEntity([token_address]), [token_address])
  const result: any = useComponentValue(ERC721EnumerableTotalModel, entityId)
  return {
    totalSupply: result ? Number(result.total_supply) : null,
    isPending: (result == null),
  }
}

type OwnerOfResult = {
  owner: bigint
  isPending: boolean
}
export const useOrigamiERC721OwnerOf = (token_address: BigNumberish, token_id: BigNumberish, components: Components): OwnerOfResult => {
  const { ERC721OwnerModel } = components
  const entityId = useMemo(() => keysToEntity([token_address, token_id]), [token_address, token_id])
  const result: any = useComponentValue(ERC721OwnerModel, entityId)
  return {
    owner: result ? BigInt(result.address) : null,
    isPending: (result == null),
  }
}

type BalanceOfResult = {
  amount: number
  isPending: boolean
}
export const useOrigamiERC721BalanceOf = (token_address: BigNumberish, account: BigNumberish, components: Components): BalanceOfResult => {
  const { ERC721BalanceModel } = components
  const entityId = useMemo(() => keysToEntity([token_address, account]), [token_address, account])
  const result: any = useComponentValue(ERC721BalanceModel, entityId)
  return {
    amount: result ? Number(result.amount) : null,
    isPending: (result == null),
  }
}

type TokenByIndexResult = {
  tokenId: bigint
  isPending: boolean
}
export const useOrigamiERC721TokenByIndex = (token_address: BigNumberish, index: BigNumberish, components: Components): TokenByIndexResult => {
  const { ERC721EnumerableIndexModel } = components
  const entityId = useMemo(() => keysToEntity([token_address, index]), [token_address, index])
  const result: any = useComponentValue(ERC721EnumerableIndexModel, entityId)
  return {
    tokenId: result ? BigInt(result.token_id) : null,
    isPending: (result == null),
  }
}

type TokenOfOwnerByIndexResult = {
  tokenId: bigint
  isPending: boolean
}
export const useOrigamiERC721TokenOfOwnerByIndex = (token_address: BigNumberish, owner: BigNumberish, index: BigNumberish, components: Components): TokenOfOwnerByIndexResult => {
  const { ERC721EnumerableOwnerIndexModel } = components
  const entityId = useMemo(() => keysToEntity([token_address, owner, index]), [token_address, owner, index])
  const result: any = useComponentValue(ERC721EnumerableOwnerIndexModel, entityId)
  return {
    tokenId: result ? BigInt(result.token_id) : null,
    isPending: (result == null),
  }
}

type IndexByTokenResult = {
  index: number
  isPending: boolean
}
export const useOrigamiERC721IndexByToken = (token_address: BigNumberish, token_id: BigNumberish, components: Components): IndexByTokenResult => {
  const { ERC721EnumerableTokenModel } = components
  const entityId = useMemo(() => keysToEntity([token_address, token_id]), [token_address, token_id])
  const result: any = useComponentValue(ERC721EnumerableTokenModel, entityId)
  return {
    index: result ? Number(result.index) : null,
    isPending: (result == null),
  }
}

type IndexOfOwnerByTokenRsult = {
  index: number
  isPending: boolean
}
export const useOrigamiERC721IndexOfOwnerByToken = (token_address: BigNumberish, owner: BigNumberish, token_id: BigNumberish, components: Components): IndexOfOwnerByTokenRsult => {
  const { ERC721EnumerableOwnerTokenModel } = components
  const entityId = useMemo(() => keysToEntity([token_address, owner, token_id]), [token_address, owner, token_id])
  const result: any = useComponentValue(ERC721EnumerableOwnerTokenModel, entityId)
  return {
    index: result ? Number(result.index) : null,
    isPending: (result == null),
  }
}

type useOrigamiERC721AllTokensOfOwnerResult = {
  tokenIds: bigint[]
  isPending: boolean
}
export const useOrigamiERC721AllTokensOfOwner = (token_address: BigNumberish, owner: BigNumberish, components: Components): useOrigamiERC721AllTokensOfOwnerResult => {
  const { ERC721EnumerableOwnerIndexModel } = components
  const { amount, isPending: isBalancePending } = useOrigamiERC721BalanceOf(token_address, owner, components)
  const tokenIds = useMemo(() => {
    return Array.from({ length: amount }, (_, i) => i).map((index) => {
      const result = getComponentValue(ERC721EnumerableOwnerIndexModel, keysToEntity([token_address, owner, index]))
      // console.log(`>>>> ALL:`, isBalancePending, index, result)
      return result ? BigInt(result.token_id) : 0n
    })
  }, [token_address, owner, amount, isBalancePending])
  return {
    tokenIds,
    isPending: isBalancePending,
  }
}
