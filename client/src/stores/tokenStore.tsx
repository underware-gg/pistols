import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSdkTokenBalancesGet } from '@underware/pistols-sdk/dojo'
import { arrayRemoveValue, bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import * as torii from '@dojoengine/torii-client'

interface TokenIdsByAccount {
  [accountAddress: string]: bigint[]
}
interface Contracts {
  [contractAddress: string]: TokenIdsByAccount
}
interface State {
  contracts: Contracts,
  setBalances: (balances: torii.TokenBalance[]) => void;
  updateBalance: (balance: torii.TokenBalance) => void;
  getTokenIds: (contractAddress: BigNumberish, accountAddress: BigNumberish) => bigint[] | undefined | null;
}

const createStore = () => {
  const _parseTokenId = (balance: torii.TokenBalance): bigint => {
    return balance ? BigInt(balance.token_id) : undefined
  }
  return create<State>()(immer((set, get) => ({
    contracts: {},
    setBalances: (balances: torii.TokenBalance[]) => {
      console.log("tokenStore() SET:", balances)
      set((state: State) => {
        let processed_accounts = []
        balances.forEach((balance) => {
          const _contract = bigintToHex(balance.contract_address)
          const _account = bigintToHex(balance.account_address)
          const _owned = isPositiveBigint(balance.balance)
          if (!state.contracts[_contract]) {
            // initialize contract
            state.contracts[_contract] = {}
          }
          if (!state.contracts[_contract][_account] || !processed_accounts.includes(_account)) {
            // initialize account
            state.contracts[_contract][_account] = []
            processed_accounts.push(_account)
          }
          if (_owned) {
            // insert only if owned
            state.contracts[_contract][_account].push(_parseTokenId(balance))
          }
        })
      });
    },
    updateBalance: (balance: torii.TokenBalance) => {
      set((state: State) => {
        console.log("tokenStore() UPDATE:", balance)
        const _contract = bigintToHex(balance.contract_address)
        const _account = bigintToHex(balance.account_address)
        // insert only if account is being tracked
        if (state.contracts[_contract][_account]) {
          const _tokenId = _parseTokenId(balance)
          const _owned = isPositiveBigint(balance.balance)
          const _added = state.contracts[_contract][_account].includes(_tokenId)
          if (_owned && !_added) {
            state.contracts[_contract][_account].push(_tokenId)
          } else if (!_owned && _added) {
            state.contracts[_contract][_account] = arrayRemoveValue(state.contracts[_contract][_account], _tokenId)
          }
        }
      });
    },
    getTokenIds: (contractAddress: BigNumberish, accountAddress: BigNumberish): bigint[] | undefined | null => {
      const _contractAddress = bigintToHex(contractAddress)
      const accounts = get().contracts[_contractAddress]
      if (!accounts) return undefined
      return accounts[bigintToHex(accountAddress)] ?? null
    },
  })))
}

export const useTokenStore = createStore();


//----------------------------------------
// consumer hooks
//

// get current players tokens from the store
export function useTokenIdsOfPlayer(contractAddress: BigNumberish) {
  const { address } = useAccount()
  return useTokenIdsByAccount(contractAddress, address)
}

// get initial tokens of account
export function useTokenIdsByAccount(contractAddress: BigNumberish, accountAddress: BigNumberish) {
  const state = useTokenStore((state) => state)
  const tokenIds = useMemo(() => state.getTokenIds(contractAddress, accountAddress), [state.contracts, contractAddress, accountAddress])

  // console.log(">>>>>> useTokenIdsOfPlayer() contracts:", contracts, accounts, tokenIds)
  const { isLoading } = useSdkTokenBalancesGet({
    contract: bigintToHex(contractAddress || 0n),
    account: bigintToHex(accountAddress || 0n),
    setBalances: state.setBalances,
    enabled: (tokenIds == null),
  })

  const tokenIdsAscending = useMemo(() => ([...(tokenIds ?? [])].sort((a, b) => Number(a - b))), [tokenIds])
  const tokenIdsDescending = useMemo(() => ([...(tokenIds ?? [])].sort((a, b) => Number(b - a))), [tokenIds])

  return {
    tokenIds: tokenIdsAscending,
    tokenIdsDescending,
    isLoading: (tokenIds === null || isLoading),
  }
}


// TODO: REMOVE THIS ABERRATION
export const _useDuelistIdsOfPlayerRetry = () => {
  const { address } = useAccount()
  const { duelistContractAddress } = useDuelistTokenContract()

  const state = useTokenStore((state) => state)
  const tokens = useMemo(() => state.getTokenIds(duelistContractAddress, address), [state.contracts, duelistContractAddress, address])

  // console.log(">>>>>> useDuelistIdsOfPlayerRetry() contracts:", enabled, contracts, accounts)
  const { isLoading } = useSdkTokenBalancesGet({
    contract: bigintToHex(duelistContractAddress || 0n),
    account: bigintToHex(address || 0n),
    setBalances: state.setBalances,
    // retryInterval: 1000,
  })

  const tokenIds = useMemo(() => (
    tokens?.sort((a, b) => Number(b - a)) ?? []
  ), [tokens])

  return {
    duelistIds: tokenIds,
    isLoading,
  }
}
