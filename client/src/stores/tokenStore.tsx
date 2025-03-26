import { useMemo, useState } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useSdkTokenBalancesGet } from '@underware/pistols-sdk/dojo'
import { arrayRemoveValue, bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
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
  getOwnerOfTokenId: (contractAddress: BigNumberish, tokenId: BigNumberish) => bigint | undefined | null;
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
          if (!state.contracts[_contract]) {
            // initialize contract
            state.contracts[_contract] = {}
          }
          if (!state.contracts[_contract][_account] || !processed_accounts.includes(_account)) {
            // initialize account
            state.contracts[_contract][_account] = []
            processed_accounts.push(_account)
          }
          // insert only if owned
          const _owned = isPositiveBigint(balance.balance)
          if (_owned) {
            const _tokenId = _parseTokenId(balance)
            state.contracts[_contract][_account].push(_tokenId)
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
    getOwnerOfTokenId: (contractAddress: BigNumberish, tokenId: BigNumberish): bigint | undefined | null => {
      const _contractAddress = bigintToHex(contractAddress)
      const accounts = get().contracts[_contractAddress]
      if (!accounts) return undefined
      const _tokenId = BigInt(tokenId)
      const owner = Object.keys(accounts).find((accountAddress) => {
        return accounts[accountAddress].includes(_tokenId)
      })
      // console.log("------------------ getOwnerOfTokenId()", tokenId, accounts[owner], owner)
      return owner ? BigInt(owner) : null
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

// get initial tokens of an account
export function useTokenIdsByAccount(contractAddress: BigNumberish, accountAddress: BigNumberish) {
  const state = useTokenStore((state) => state)
  const tokenIds = useMemo(() => state.getTokenIds(contractAddress, accountAddress), [state.contracts, contractAddress, accountAddress])

  const mounted = useMounted()
  const { isLoading } = useSdkTokenBalancesGet({
    contract: bigintToHex(contractAddress || 0n),
    account: bigintToHex(accountAddress || 0n),
    setBalances: state.setBalances,
    enabled: (tokenIds == null && mounted),
  })

  const tokenIdsAscending = useMemo(() => ([...(tokenIds ?? [])].sort((a, b) => Number(a - b))), [tokenIds])
  const tokenIdsDescending = useMemo(() => ([...(tokenIds ?? [])].sort((a, b) => Number(b - a))), [tokenIds])

  return {
    tokenIds: tokenIdsAscending,
    tokenIdsDescending,
    isLoading: (tokenIds === null || isLoading),
  }
}

export function useOwnerOfTokenId(contractAddress: BigNumberish, tokenId: BigNumberish) {
  const state = useTokenStore((state) => state)
  const owner = useMemo(() => state.getOwnerOfTokenId(contractAddress, tokenId), [state.contracts, contractAddress, tokenId])

  // find balance of tokenId
  const [balances, setBalances] = useState<torii.TokenBalance[]>([])
  const tokenIds = useMemo(() => (isPositiveBigint(tokenId) ? [tokenId] : []), [tokenId])
  const mounted = useMounted()
  const { isLoading: isLoadingOwner } = useSdkTokenBalancesGet({
    contract: bigintToHex(contractAddress || 0n),
    tokenIds,
    setBalances,
    enabled: (owner == null && tokenIds.length > 0 && mounted),
  })

  // load owners account into the store
  const foundOwner = useMemo(() => (
    balances.reduce((acc, balance) => {
      return acc ?? bigintToHex(balance.account_address)
    }, null as string | null)
  ), [balances])
  const { isLoading: isLoadingAccount } = useTokenIdsByAccount(contractAddress, foundOwner)

  return {
    owner,
    isLoading: (owner === null || isLoadingOwner || isLoadingAccount),
  }
}
