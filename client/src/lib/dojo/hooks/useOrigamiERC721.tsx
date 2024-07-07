import { Components } from '@dojoengine/recs'
import { BigNumberish } from 'starknet'
import { useComponentValue } from '@dojoengine/react'
import { bigintToHex, keysToEntity } from '@/lib/utils/types'
import { getEntityIdFromKeys } from '@dojoengine/utils'


type MetadataResult = {
  name: string
  symbol: string
  baseUri: string
}
export const useOrigamiERC721Metadata = (token: BigNumberish, components: Components): MetadataResult => {
  const { ERC721MetaModel } = components
  const model: any = useComponentValue(ERC721MetaModel, keysToEntity([token]))
  return {
    name: (model?.name ?? null),
    symbol: (model?.symbol ?? null),
    baseUri: (model?.base_uri ?? null),
  }
}

type TotalSupplyResult = {
  totalSupply: number
}
export const useOrigamiERC721TotalSupply = (token: BigNumberish, components: Components): TotalSupplyResult => {
  const { ERC721EnumerableTotalModel } = components
  const model: any = useComponentValue(ERC721EnumerableTotalModel, keysToEntity([token]))
  return {
    totalSupply: model ? Number(model.total_supply) : null,
  }
}

type OwnerOfResult = {
  owner: bigint
}
export const useOrigamiERC721OwnerOf = (token: BigNumberish, token_id: BigNumberish, components: Components): OwnerOfResult => {
  const { ERC721OwnerModel } = components
  const model: any = useComponentValue(ERC721OwnerModel, keysToEntity([token, token_id]))
  return {
    owner: model ? BigInt(model.owner) : null,
  }
}

type BalanceOfResult = {
  amount: number
}
export const useOrigamiERC721BalanceOf = (token: BigNumberish, account: BigNumberish, components: Components): BalanceOfResult => {
  const { ERC721BalanceModel } = components
  const model: any = useComponentValue(ERC721BalanceModel, keysToEntity([token, account]))
  return {
    amount: model ? Number(model.amount) : null,
  }
}

type TokenByIndexResult = {
  tokenId: bigint
}
export const useOrigamiERC721TokenByIndex = (token: BigNumberish, index: BigNumberish, components: Components): TokenByIndexResult => {
  const { ERC721EnumerableIndexModel } = components
  const model: any = useComponentValue(ERC721EnumerableIndexModel, keysToEntity([token, index]))
  return {
    tokenId: model ? BigInt(model.token_id) : null,
  }
}

type TokenOfOwnerByIndexResult = {
  tokenId: bigint
}
export const useOrigamiERC721TokenOfOwnerByIndex = (token: BigNumberish, owner: BigNumberish, index: BigNumberish, components: Components): TokenOfOwnerByIndexResult => {
  const { ERC721EnumerableOwnerIndexModel } = components
  const model: any = useComponentValue(ERC721EnumerableOwnerIndexModel, keysToEntity([token, owner, index]))
  return {
    tokenId: model ? BigInt(model.token_id) : null,
  }
}

type IndexByTokenResult = {
  index: number
}
export const useOrigamiERC721IndexByToken = (token: BigNumberish, token_id: BigNumberish, components: Components): IndexByTokenResult => {
  const { ERC721EnumerableTokenModel } = components
  const model: any = useComponentValue(ERC721EnumerableTokenModel, keysToEntity([token, token_id]))
  return {
    index: model ? Number(model.index) : null,
  }
}

type IndexOfOwnerByTokenRsult = {
  index: number
}
export const useOrigamiERC721IndexOfOwnerByToken = (token: BigNumberish, owner: BigNumberish, token_id: BigNumberish, components: Components): IndexOfOwnerByTokenRsult => {
  const { ERC721EnumerableOwnerTokenModel } = components
  const model: any = useComponentValue(ERC721EnumerableOwnerTokenModel, keysToEntity([token, owner, token_id]))
  return {
    index: model ? Number(model.index) : null,
  }
}
