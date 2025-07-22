import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { bigintEquals, bigintToDecimal, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import * as torii from '@dojoengine/torii-client'

// interface totii.TokenBalance {
//   balance: string;
//   account_address: string;
//   contract_address: string;
//   token_id: string;
// }

interface TokenState {
  owner: bigint,
}
interface State {
  tokenName: string,
  tokens: Record<string, TokenState>,
  resetStore: () => void;
  setBalances: (balances: torii.TokenBalance[]) => void;
  updateBalance: (balance: torii.TokenBalance) => void;
  getTokenIdsOfOwner: (accountAddress: BigNumberish) => bigint[] | undefined | null;
  getTokenIdsOfOwners: (accountAddresses: BigNumberish[]) => bigint[] | undefined | null;
  getOwnerOfTokenId: (tokenId: BigNumberish) => bigint | undefined | null;
}

const createStore = (tokenName: string) => {
  const _tokenKey = (token_id: BigNumberish): string => (
    bigintToDecimal(token_id)
  )
  const _processBalance = (state: State, balance: torii.TokenBalance) => {
    const _tokenId = BigInt(balance?.token_id ?? 0)
    if (_tokenId > 0n) {
      const _key = _tokenKey(_tokenId);
      const _balance = BigInt(balance.balance ?? 0);
      const _account = BigInt(balance.account_address ?? 0);
      if (_balance > 0n && _account > 0n) {
        state.tokens[_key] = {
          owner: _account,
        }
      } else if (state.tokens[_key]?.owner == _account) {
        state.tokens[_key] = undefined;
      }
    }
  }
  return create<State>()(immer((set, get) => ({
    tokenName,
    tokens: {},
    resetStore: () => {
      set((state: State) => {
        state.tokens = {}
      })
    },
    setBalances: (balances: torii.TokenBalance[]) => {
      // console.log(`tokenStore(${get().tokenName}) SET:`, balances)
      set((state: State) => {
        balances.forEach((balance) => {
          _processBalance(state, balance);
        })
      });
    },
    updateBalance: (balance: torii.TokenBalance) => {
      set((state: State) => {
        // console.log(`tokenStore(${get().tokenName}) UPDATE:`, balance)
        _processBalance(state, balance);
      });
    },
    getTokenIdsOfOwner: (accountAddress: BigNumberish | undefined): bigint[] => {
      const _owner = BigInt(accountAddress ?? 0n);
      return !_owner ? []
        : Object.entries(get().tokens)
          .filter(([key, value]) => value?.owner === _owner)
          .map(([key, value]) => BigInt(key))
    },
    getTokenIdsOfOwners: (accountAddresses: BigNumberish[]): bigint[] => {
      return accountAddresses.reduce((acc, address) => (
        acc.concat(get().getTokenIdsOfOwner(address))
      ), [] as bigint[])
    },
    getOwnerOfTokenId: (tokenId: BigNumberish | undefined): bigint | undefined => {
      return get().tokens[_tokenKey(tokenId ?? 0n)]?.owner ?? undefined
    },
  })))
}

export const useDuelistTokenStore = createStore('duelist');
export const useDuelTokenStore = createStore('duel');
export const usePackTokenStore = createStore('pack');
export const useRingTokenStore = createStore('ring');
export const useTournamentTokenStore = createStore('tournament');

export function useTokenStore(contractAddress: BigNumberish) {
  const {
    duelistContractAddress,
    duelContractAddress,
    packContractAddress,
    ringContractAddress,
    tournamentContractAddress,
  } = useTokenContracts()
  const store = useMemo(() => {
    if (bigintEquals(contractAddress, duelistContractAddress)) {
      return useDuelistTokenStore
    } else if (bigintEquals(contractAddress, duelContractAddress)) {
      return useDuelTokenStore
    } else if (bigintEquals(contractAddress, packContractAddress)) {
      return usePackTokenStore
    } else if (bigintEquals(contractAddress, ringContractAddress)) {
      return useRingTokenStore
    } else if (bigintEquals(contractAddress, tournamentContractAddress)) {
      return useTournamentTokenStore
    }
  }, [duelistContractAddress, duelContractAddress, packContractAddress, ringContractAddress, tournamentContractAddress, contractAddress])
  return store
}


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
  const state = useTokenStore(contractAddress)((state) => state)
  const tokenIds = useMemo(() => state.getTokenIdsOfOwner(accountAddress), [state.tokens, accountAddress])
  const tokenIdsAscending = useMemo(() => ([...tokenIds].sort((a, b) => Number(a - b))), [tokenIds])
  const tokenIdsDescending = useMemo(() => ([...tokenIds].sort((a, b) => Number(b - a))), [tokenIds])
  return {
    tokenIds: tokenIdsAscending,
    tokenIdsDescending,
    isLoading: (tokenIds === null),
  }
}

export function useOwnerOfTokenId(contractAddress: BigNumberish, tokenId: BigNumberish) {
  const state = useTokenStore(contractAddress)((state) => state)
  const owner = useMemo(() => state.getOwnerOfTokenId(tokenId), [state.tokens, tokenId])
  return {
    owner,
    isLoading: (state.tokens === null),
  }
}
