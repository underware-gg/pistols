import { useMemo, useEffect } from 'react'
import { create } from 'zustand'
import { BigNumberish, addAddressPadding } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { Token, TokenBalance } from '@dojoengine/torii-client'
import { useDojoSetup, useToriiTokensByOwnerQL, ERC721_Token } from '@underware_gg/pistols-sdk/dojo'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'


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
  setTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish, ids: TokenState) => void;
  getTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish) => TokenState;
}

const createStore = () => {
  return create<State>()((set, get) => ({
    tokens: {},
    setTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish, tokens: TokenState) => {
      set((state: State) => ({
        tokens: {
          ...state.tokens,
          [bigintToHex(contractAddress)]: {
            ...state.tokens[bigintToHex(contractAddress)],
            [bigintToHex(accountAddress)]: tokens,
          },
        },
      }))
    },
    getTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish): TokenState => {
      return get().tokens[bigintToHex(contractAddress)]?.[bigintToHex(accountAddress)] ?? []
    },
  }))
}

const useStore = createStore();


//----------------------------------------
// keep connected player's tokens in sync
//
export function PlayerDuelistTokensStoreSyncQL() {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { address } = useAccount()
  const state = useStore((state) => state)
  const { tokens } = useToriiTokensByOwnerQL(duelistContractAddress, address, true)
  useEffect(() => {
    if (duelistContractAddress && address) {
      state.setTokens(duelistContractAddress, address, tokens)
    }
  }, [duelistContractAddress, address, tokens])
  // useEffect(() => console.log("PlayerDuelistTokensStoreSyncQL() =>", state.tokens), [state.tokens])
  return (<></>)
}


//----------------------------------------
// TODO: replace QL for this...
//
export function PlayerDuelistTokensStoreSync() {
  // const { duelistContractAddress } = useDuelistTokenContract()
  // const { address } = useAccount()
  // const { sdk } = useDojoSetup()
  // const state = useStore((state) => state)
  // useEffect(() => {
  //   const _fetch = async () => {
  //     // const response: Token[] = await sdk.getTokens([])
  //     const response: TokenBalance[] = await sdk.getTokenBalances(
  //       // [],
  //       ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //       // [addAddressPadding(bigintToHex(address))],
  //       // ['0x24ec36b5c19d158e9749d4f2b48afb7b51ce0f5e4a871f53028a601a253fb6e'],
  //       // [addAddressPadding(bigintToHex(duelistContractAddress))],
  //       [],
  //     )
  //     console.log("PlayerDuelistTokensStoreSync_SDK() =>>>>>>>>>", response)
  //   }
  //   console.log(`____SDK account:`, address, duelistContractAddress, sdk)
  //   if (sdk && address) {
  //     _fetch()
  //   }
  // }, [sdk, address])
  // // useEffect(() => console.log("PlayerDuelistTokensStoreSync() =>", state.tokenIds), [state.tokenIds])
  return (<></>)
}


//----------------------------------------
// consumer hooks
//

// get current players tokens from the store
export function useTokenIdsOfPlayer(contractAddress: BigNumberish) {
  const state = useStore((state) => state)
  const { address } = useAccount()
  const tokens = useMemo(() => state.getTokens(contractAddress, address).sort((a, b) => Number(b.tokenId - a.tokenId)), [contractAddress, address, state.tokens])
  const tokenIds = useMemo(() => tokens.map((token) => token.tokenId), [tokens])
  return {
    tokenIds,
  }
}

// ephemeral hook
// get and retrive on the fly
// do not use the store
export function useTokensByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const { tokens, isLoading } = useToriiTokensByOwnerQL(contractAddress, owner, false)
  // console.log("useTokensByOwner() =>", isLoading, bigintToHex(owner), tokens)
  return {
    tokens,
    isLoading,
  }
}
export function useTokenIdsByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const { tokens, isLoading } = useToriiTokensByOwnerQL(contractAddress, owner, false)
  const tokenIds = useMemo(() => tokens.map((token) => token.tokenId), [tokens])
  // console.log("useTokenIdsByOwner() =>", isLoading, bigintToHex(owner), tokenIds)
  return {
    tokenIds,
    isLoading,
  }
}
