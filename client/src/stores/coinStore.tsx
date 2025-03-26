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
    setBalances: (balances: torii.TokenBalance[]) => {
      console.log("coinStore() SET:", balances)
      set((state: State) => {
        // insert if not exists
        balances.forEach((balance) => {
          const _contract = bigintToHex(balance.contract_address)
          const _owner = bigintToHex(balance.account_address)
          if (!state.contracts[_contract]) {
            state.contracts[_contract] = {}
          }
          state.contracts[_contract][_owner] = _parseBalance(balance)
        })
      });
    },
    updateBalance: (balance: torii.TokenBalance) => {
      console.log('coinStore() UPDATE:', balance)
      // set((state: State) => {
      //   // insert ONLY if exists
      //   const _contract = bigintToHex(balance.contract_address)
      //   const _owner = bigintToHex(balance.account_address)
      //   if (state.contracts[_contract][_owner] != undefined) {
      //     state.contracts[_contract][_owner] = _parseBalance(balance)
      //   }
      // });
    },
    getBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish): bigint | undefined | null => {
      const _contractAddress = bigintToHex(contractAddress)
      const balances = get().contracts[_contractAddress]
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

  const { isLoading } = useSdkTokenBalancesGet({
    contract: bigintToHex(contractAddress || 0n),
    account: bigintToHex(accountAddress || 0n),
    setBalances: state.setBalances,
    enabled: (balance == null),
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
