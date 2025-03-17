import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import * as torii from '@dojoengine/torii-client'
import { useMemo } from 'react'
import { weiToEth } from '@underware/pistols-sdk/utils/starknet'
import { useSdkTokenBalancesGet } from '@underware/pistols-sdk/dojo'


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
      // if (!balances) throw new Error(`coinStore() contract not initialized: ${_contractAddress}`)
      if (!balances) return undefined
      return balances[bigintToHex(accountAddress)] ?? null
    },
  })))
}

export const useCoinStore = createStore();


//----------------------------------------
// consumer hooks
//

export const useCoinBalance = (
  contractAddress: BigNumberish,
  accountAddress: BigNumberish,
  // watch: boolean = false,
) => {
  const state = useCoinStore((state) => state)
  const balance = useMemo(() => state.getBalance(contractAddress, accountAddress), [state.contracts, contractAddress, accountAddress])
  const balance_eth = useMemo(() => (balance != null ? weiToEth(balance) : balance), [balance])
  // console.log(`BALANCE`, (bigintToHex(contractAddress)), (bigintToHex(ownerAddress)), balance)

  const supply = 1;
  const contracts = useMemo(() => (isPositiveBigint(contractAddress) ? [bigintToHex(contractAddress)] : []), [contractAddress])
  const accounts = useMemo(() => (isPositiveBigint(accountAddress) ? [bigintToHex(accountAddress)] : []), [accountAddress])
  const { isLoading } = useSdkTokenBalancesGet({
    contracts,
    accounts,
    setBalances: state.setBalances,
    enabled: (contracts.length > 0 && accounts.length > 0 && supply > 0
      // && balance === null
    ),
    forceCounter: supply,
  })

  return {
    balance: balance ?? 0n,        // wei
    balance_eth,                          // eth
    // formatted: balance?.formatted ?? 0,   // eth
    // decimals: balance?.decimals ?? 0,     // 18
    // symbol: balance?.symbol ?? '?',       // eth
    // noFundsForFee,
    isLoading,
  }
}
