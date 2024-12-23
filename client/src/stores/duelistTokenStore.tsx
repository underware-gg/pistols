import { useMemo, useEffect } from 'react'
import { create } from 'zustand'
import { BigNumberish, addAddressPadding } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { Token, TokenBalance } from '@dojoengine/torii-client'
import { useDojoSetup, useToriiTokenIdsByOwnerQL } from '@underware_gg/pistols-sdk/dojo'
import { useDuelistTokenContract } from '@/hooks/useTokenContract'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface TokenIdsByOwner {
  [accountAddress: string]: bigint[]
}
interface TokenIdsByContract {
  [contractAddress: string]: TokenIdsByOwner
}
interface State {
  tokenIds: TokenIdsByContract,
  setTokenIds: (contractAddress: BigNumberish, accountAddress: BigNumberish, ids: bigint[]) => void;
  getTokenIds: (contractAddress: BigNumberish, accountAddress: BigNumberish) => bigint[];
}

const createStore = () => {
  return create<State>()((set, get) => ({
    tokenIds: {},
    setTokenIds: (contractAddress: BigNumberish, accountAddress: BigNumberish, ids: bigint[]) => {
      set((state: State) => ({
        tokenIds: {
          ...state.tokenIds,
          [bigintToHex(contractAddress)]: {
            ...state.tokenIds[bigintToHex(contractAddress)],
            [bigintToHex(accountAddress)]: ids,
          },
        },
      }))
    },
    getTokenIds: (contractAddress: BigNumberish, accountAddress: BigNumberish): bigint[] => {
      return get().tokenIds[bigintToHex(contractAddress)]?.[bigintToHex(accountAddress)] ?? []
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
  const { tokenIds } = useToriiTokenIdsByOwnerQL(duelistContractAddress, address, true)
  useEffect(() => {
    if (duelistContractAddress && address) {
      state.setTokenIds(duelistContractAddress, address, tokenIds)
    }
  }, [duelistContractAddress, address, tokenIds])
  useEffect(() => console.log("PlayerDuelistTokensStoreSyncQL() =>", state.tokenIds), [state.tokenIds])
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
  const tokenIds = useMemo(() => state.getTokenIds(contractAddress, address).sort((a, b) => Number(b) - Number(a)), [contractAddress, address, state.tokenIds])
  return {
    tokenIds,
  }
}

// ephemeral hook
// get and retrive on the fly
// do not use the store
export function useTokenIdsByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const { tokenIds, isLoading } = useToriiTokenIdsByOwnerQL(contractAddress, owner, false)
  // console.log("useTokenIdsByOwner() =>", isLoading, bigintToHex(owner), tokenIds)
  return {
    tokenIds,
    isLoading,
  }
}
