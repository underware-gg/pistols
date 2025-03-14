import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSdkTokenBalancesGet } from '@underware/pistols-sdk/dojo'
import { bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import * as torii from '@dojoengine/torii-client'


interface TokenState {
  tokenId: bigint
}
interface TokenIdsByOwner {
  [accountAddress: string]: TokenState[]
}
interface Contracts {
  [contractAddress: string]: TokenIdsByOwner
}
interface State {
  contracts: Contracts,
  initialized: boolean,
  initialize: (contractAddress: string[]) => void
  setBalances: (balances: torii.TokenBalance[]) => void;
  updateBalance: (balance: torii.TokenBalance) => void;
  getTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish) => TokenState[] | undefined | null;
}

const createStore = () => {
  const _parseBalance = (balance: torii.TokenBalance): TokenState => {
    return balance ? {
      tokenId: BigInt(balance.token_id),
    } : undefined
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
      console.log("tokenStore() SET:", balances)
      set((state: State) => {
        // insert if not exists
        balances.forEach((balance) => {
          const _contract = bigintToHex(balance.contract_address)
          const _owner = bigintToHex(balance.account_address)
          if (!state.contracts[_contract][_owner]) {
            state.contracts[_contract][_owner] = []
          }
          state.contracts[_contract][_owner].push(_parseBalance(balance))
        })
      });
    },
    updateBalance: (balance: torii.TokenBalance) => {
      set((state: State) => {
        // insert ONLY if exists
        const _contract = bigintToHex(balance.contract_address)
        const _owner = bigintToHex(balance.account_address)
        if (state.contracts[_contract][_owner]) {
          state.contracts[_contract][_owner].push(_parseBalance(balance))
        }
      });
    },
    getTokens: (contractAddress: BigNumberish, accountAddress: BigNumberish): TokenState[] | undefined | null => {
      if (!get().initialized) return undefined
      const _contractAddress = bigintToHex(contractAddress)
      const owners = get().contracts[_contractAddress]
      if (!owners) throw new Error(`tokenStore() contract not initialized: ${_contractAddress}`)
      return owners[bigintToHex(accountAddress)] ?? null
    },
  })))
}

export const useTokenStore = createStore();


//----------------------------------------
// consumer hooks
//

// get current players tokens from the store
export function useTokenIdsOfPlayer(contractAddress: BigNumberish, disabled: boolean = true) {
  const { address } = useAccount()
  return useTokenIdsByOwner(contractAddress, address, disabled)
}

export function useTokenIdsByOwner(contractAddress: BigNumberish, owner: BigNumberish, disabled: boolean = false) {
  const { tokens, isLoading } = useTokensByOwner(contractAddress, owner, disabled)
  const tokenIds = useMemo(() => (
    tokens.map((token) => token.tokenId).sort((a, b) => Number(b - a))
  ), [tokens])
  return {
    tokenIds,
    isLoading,
  }
}

// get initial tokens of owner
export function useTokensByOwner(contractAddress: BigNumberish, owner: BigNumberish, disabled: boolean = false) {
  const state = useTokenStore((state) => state)
  const tokens = useMemo(() => state.getTokens(contractAddress, owner), [state.contracts, contractAddress, owner])

  // get tokens only if owner not already in store
  const contracts = useMemo(() => (isPositiveBigint(contractAddress) ? [bigintToHex(contractAddress)] : []), [contractAddress])
  const accounts = useMemo(() => (isPositiveBigint(owner) ? [bigintToHex(owner)] : []), [owner])
  const { isLoading } = useSdkTokenBalancesGet({
    contracts,
    accounts,
    setBalances: state.setBalances,
    enabled: (tokens === null && contracts.length > 0 && accounts.length > 0 && !disabled),
  })

  return {
    tokens: tokens ?? [],
    isLoading: (tokens === null || contracts.length == 0 || accounts.length == 0 || isLoading),
  }
}
