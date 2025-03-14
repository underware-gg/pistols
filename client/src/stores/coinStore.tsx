import { useMemo, useEffect } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useToriiBalancesByContractQL } from '@underware/pistols-sdk/dojo/graphql'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { useFameContract } from '/src/hooks/useFame'
import * as torii from '@dojoengine/torii-client'


interface BalancesByAccount {
  [accountAddress: string]: bigint
}
interface Contracts {
  [contractAddress: string]: BalancesByAccount
}
interface State {
  contracts: Contracts,
  initialized: boolean,
  initialize: (contractAddress: string[]) => void
  setBalances: (balances: torii.TokenBalance[]) => void;
  updateBalance: (balance: torii.TokenBalance) => void;
  getBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish) => bigint | undefined | null;
}

const createStore = () => {
  const _parseBalance = (balance: torii.TokenBalance): bigint => {
    return balance ? BigInt(balance.balance) : 0n
  }
  return create<State>()(immer((set, get) => ({
    contracts: {},
    initialized: false,
    initialize: (contractAddress: string[]) => {
      set((state: State) => ({
        contracts: {
          ...contractAddress.reduce((acc, contract) => {
            acc[contract] = {}
            return acc
          }, {} as Contracts),
        },
        initialized: true,
      }))
    },
    setBalances: (balances: torii.TokenBalance[]) => {
      console.log("coinStore() SET:", balances)
      set((state: State) => {
        // insert if not exists
        balances.forEach((balance) => {
          const _contract = bigintToHex(balance.contract_address)
          const _owner = bigintToHex(balance.account_address)
          state.contracts[_contract][_owner] = _parseBalance(balance)
        })
      });
    },
    updateBalance: (balance: torii.TokenBalance) => {
      set((state: State) => {
        // insert ONLY if exists
        const _contract = bigintToHex(balance.contract_address)
        const _owner = bigintToHex(balance.account_address)
        if (state.contracts[_contract][_owner] != undefined) {
          state.contracts[_contract][_owner] = _parseBalance(balance)
        }
      });
    },
    getBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish): bigint | undefined | null => {
      if (!get().initialized) return undefined
      const _contractAddress = bigintToHex(contractAddress)
      const balances = get().contracts[_contractAddress]
      if (!balances) throw new Error(`coinStore() contract not initialized: ${_contractAddress}`)
      return balances[bigintToHex(accountAddress)] ?? null
    },
  })))
}

export const useCoinStore = createStore();


//----------------------------------------
// consumer hooks
//
export function useBalancesByOwner(contractAddress: BigNumberish, owner: BigNumberish) {
  const state = useCoinStore((state) => state)
  // const balance = useMemo(() => state.getBalance(contractAddress, owner), [contractAddress, owner, state.balances])
  const balance = 0n;
  return {
    balance,
  }
}
