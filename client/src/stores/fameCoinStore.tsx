import { useMemo, useEffect } from 'react'
import { create } from 'zustand'
import { addAddressPadding, BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSetup, useToriiBalancesByContractQL } from '@underware_gg/pistols-sdk/dojo'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { useFameContract } from '/src/hooks/useFame'


//-----------------------------------------
// Stores only the entity ids and sorting data from a duelists query
// to get duelist data, use duelistStore
//
interface BalancesByOwner {
  [accountAddress: string]: bigint
}
interface BalancesByContract {
  [contractAddress: string]: BalancesByOwner
}
interface State {
  balances: BalancesByContract,
  setBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish, balance: bigint) => void;
  getBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish) => bigint;
}

const createStore = () => {
  return create<State>()((set, get) => ({
    balances: {},
    setBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish, balance: bigint) => {
      set((state: State) => ({
        balances: {
          ...state.balances,
          [bigintToHex(contractAddress)]: {
            ...state.balances[bigintToHex(contractAddress)],
            [bigintToHex(accountAddress)]: balance,
          },
        },
      }))
    },
    getBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish): bigint => {
      return get().balances[bigintToHex(contractAddress)]?.[bigintToHex(accountAddress)] ?? 0n
    },
  }))
}

const useStore = createStore();


//----------------------------------------
// keep connected player's tokens in sync
//
export function FameCoinStoreSyncQL() {
  // const { fameContractAddress } = useFameContract()
  // const state = useStore((state) => state)
  // const { balances } = useToriiBalancesByContractQL(fameContractAddress, true)
  // useEffect(() => {
  //   if (duelistContractAddress && address) {
  //     state.setTokenIds(duelistContractAddress, address, tokenIds)
  //   }
  // }, [duelistContractAddress, address, tokenIds])
  // useEffect(() => console.log("FameCoinStoreSyncQL() =>", state.tokenIds), [state.tokenIds])
  return (<></>)
}


//----------------------------------------
// consumer hooks
//
export function useBalancesByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const state = useStore((state) => state)
  const balance = useMemo(() => state.getBalance(contractAddress, owner), [contractAddress, owner, state.balances])
  return {
    balance,
  }
}
