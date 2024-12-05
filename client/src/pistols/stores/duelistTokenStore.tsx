import { useMemo, useEffect } from 'react'
import { create } from 'zustand'
import { addAddressPadding, BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup } from '@/lib/dojo/DojoContext'
import { useDuelistTokenContract } from '@/pistols/hooks/useTokenContract'
import { useToriiTokenIdsByOwnerQL } from '@/lib/dojo/hooks/useToriiTokensQL'
import { TokenBalance } from '@dojoengine/torii-client'
import { bigintToHex } from '@/lib/utils/types'


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
  //       // [], []
  //       [bigintToHex(address)],
  //       [bigintToHex(duelistContractAddress)]
  //       // [],  
  //     )
  //     console.log("PlayerDuelistTokensStoreSync() =>>>>>>>>>", response)
  //   }
  //   if (sdk) {
  //     _fetch()
  //   }
  // }, [sdk])
  // useEffect(() => console.log("PlayerDuelistTokensStoreSync() =>", state.tokenIds), [state.tokenIds])
  return (<></>)
}


//----------------------------------------
// consumer hooks
//
export function useTokenIdsByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const state = useStore((state) => state)
  const tokenIds = useMemo(() => state.getTokenIds(contractAddress, owner), [contractAddress, owner, state.tokenIds])
  return {
    tokenIds,
  }
}
