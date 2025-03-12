import { useMemo, useEffect } from 'react'
import { create } from 'zustand'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { Token, TokenBalance } from '@dojoengine/torii-client'
import { useDojoSetup } from '@underware/pistols-sdk/dojo'
import { useToriiTokensByOwnerQL, ERC721_Token } from '@underware/pistols-sdk/dojo/graphql'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useTokenConfig } from './tokenConfigStore'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
type TokenState = ERC721_Token['tokens'];
interface TokenIdsByOwner {
  [accountAddress: string]: TokenState
}
interface TokenIdsByContract {
  [contractAddress: string]: TokenIdsByOwner
}
interface State {
  tokens: TokenIdsByContract,
  isLoading: boolean,
  setTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish, ids: TokenState) => void;
  getTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish) => TokenState;
}

const createStore = () => {
  return create<State>()((set, get) => ({
    tokens: {},
    isLoading: true,
    setTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish, tokens: TokenState) => {
      set((state: State) => ({
        tokens: {
          ...state.tokens,
          [bigintToHex(contractAddress)]: {
            ...state.tokens[bigintToHex(contractAddress)],
            [bigintToHex(accountAddress)]: tokens,
          },
        },
        isLoading: false,
      }))
    },
    getTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish): TokenState => {
      return get().tokens[bigintToHex(contractAddress)]?.[bigintToHex(accountAddress)] ?? []
    },
  }))
}

export const useTokenStore = createStore();


//----------------------------------------
// consumer hooks
//

// get current players tokens from the store
export function useTokenIdsOfPlayer(contractAddress: BigNumberish) {
  const state = useTokenStore((state) => state)
  const { address } = useAccount()
  const tokens = useMemo(() => state.getTokens(contractAddress, address).sort((a, b) => Number(b.tokenId - a.tokenId)), [contractAddress, address, state.tokens])
  const tokenIds = useMemo(() => tokens.map((token) => token.tokenId), [tokens])
  return {
    tokenIds,
    isLoading: (!isPositiveBigint(address) || state.isLoading),
  }
}

// ephemeral hook
// get and retrive on the fly
// do not use the store
export function useTokensByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const { tokens, isLoading, refetch } = useToriiTokensByOwnerQL(contractAddress, owner, false)
  // console.log("useTokensByOwner() =>", isLoading, bigintToHex(owner), tokens)

  const { mintedCount } = useTokenConfig(contractAddress)
  useEffect(() => {
    setTimeout(() => { refetch() }, 500);
  }, [mintedCount, refetch])

  return {
    tokens,
    isLoading,
  }
}
export function useTokenIdsByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const { tokens, isLoading, refetch } = useToriiTokensByOwnerQL(contractAddress, owner, false)
  const tokenIds = useMemo(() => tokens.map((token) => token.tokenId), [tokens])

  const { mintedCount } = useTokenConfig(contractAddress)
  useEffect(() => {
    setTimeout(() => { refetch() }, 500);
  }, [mintedCount, refetch])

  return {
    tokenIds,
    isLoading,
    refetch,
  }
}
