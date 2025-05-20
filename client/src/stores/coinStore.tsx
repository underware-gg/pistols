import { useEffect, useMemo, useState } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useERC20Balance } from '@underware/pistols-sdk/utils/hooks'
import { useDojoSetup, useStarknetContext } from '@underware/pistols-sdk/dojo'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDuelistTokenBoundAddress } from '/src/hooks/useTokenBound'
import { makeTokenBoundAddress } from '@underware/pistols-sdk/pistols'
import { bigintEquals, bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { weiToEth } from '@underware/pistols-sdk/starknet'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { Page } from '@dojoengine/torii-client'
import * as torii from '@dojoengine/torii-client'

// interface totii.TokenBalance {
//   balance: string;
//   account_address: string;
//   contract_address: string;
//   token_id: string;
// }

interface CoinState {
  balance: bigint,
}
interface State {
  coinName: string,
  accounts: Record<string, CoinState>,
  resetStore: () => void;
  initBalances: (accounts: BigNumberish[]) => void;
  setBalances: (balances: torii.TokenBalance[]) => void;
  updateBalance: (balance: torii.TokenBalance) => void;
  getBalance: (accountAddress: BigNumberish | undefined) => bigint | undefined;
  hasBalance: (accountAddress: BigNumberish | undefined) => boolean;
}

const createStore = (coinName: string) => {
  const _accountKey = (account: BigNumberish | undefined): string | null => (
    isPositiveBigint(account) ? bigintToHex(account) : null
  )
  const _processBalance = (state: State, balance: torii.TokenBalance, insert: boolean) => {
    const _key = _accountKey(balance.account_address);
    if (_key) {
      if (insert || state.accounts[_key]) {
        state.accounts[_key] = {
          balance: BigInt(balance.balance),
        }
      }
    }
  }
  return create<State>()(immer((set, get) => ({
    coinName,
    accounts: {},
    resetStore: () => {
      set((state: State) => {
        state.accounts = {}
      })
    },
    initBalances: (accounts: BigNumberish[]) => {
      set((state: State) => {
        accounts.forEach((account) => {
          const _key = _accountKey(account);
          if (state.accounts[_key] == undefined) {
            state.accounts[_key] = {
              balance: undefined,
            }
          }
        })
      });
    },
    setBalances: (balances: torii.TokenBalance[]) => {
      // console.log(`coinStore(${get().coinName}) SET:`, balances)
      set((state: State) => {
        balances.forEach((balance) => {
          _processBalance(state, balance, true)
        })
      });
    },
    updateBalance: (balance: torii.TokenBalance) => {
      // console.log(`coinStore(${get().coinName}) UPDATE:`, balance)
      set((state: State) => {
        _processBalance(state, balance, false)
      });
    },
    getBalance: (accountAddress: BigNumberish | undefined): bigint | undefined => {
      const _key = _accountKey(accountAddress ?? 0n);
      return _key ? get().accounts[_key]?.balance : undefined
    },
    hasBalance: (accountAddress: BigNumberish | undefined): boolean => {
      const _key = _accountKey(accountAddress ?? 0n);
      return _key ? Boolean(get().accounts[_key]) : undefined
    },
  })))
}

export const useFameCoinStore = createStore('fame');
export const useFoolsCoinStore = createStore('fools');
export const useLordsCoinStore = createStore('lords');

export function useCoinStore(contractAddress: BigNumberish) {
  const {
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
  } = useTokenContracts()
  const store = useMemo(() => {
    if (bigintEquals(contractAddress, lordsContractAddress)) {
      return useLordsCoinStore
    } else if (bigintEquals(contractAddress, fameContractAddress)) {
      return useFameCoinStore
    } else if (bigintEquals(contractAddress, foolsContractAddress)) {
      return useFoolsCoinStore
    }
    return undefined
  }, [lordsContractAddress, fameContractAddress, foolsContractAddress, contractAddress])
  return store
}


//----------------------------------------
// consumer hooks
//

export const useDuelistFameBalance = (duelistId: BigNumberish) => {
  const { address } = useDuelistTokenBoundAddress(duelistId)
  return useFameBalance(address)
}

export const useFameBalance = (address: BigNumberish) => {
  const state = useFameCoinStore((state) => state)
  const balance = useMemo(() => state.getBalance(address), [state.accounts, address])
  const lives = useMemo(() => (
    balance != undefined ? Math.floor(Number(balance / constants.FAME.ONE_LIFE)) : undefined
  ), [balance])
  return {
    balance: (balance ?? 0n),
    balance_eth: weiToEth(balance),
    lives,
    isAlive: (lives > 0),
  }
}

export const useFoolsBalance = (address: BigNumberish) => {
  const { foolsContractAddress } = useTokenContracts()
  const state = useFoolsCoinStore((state) => state)
  const balance = useMemo(() => state.getBalance(address), [state.accounts, address])
  // fetch if not cached
  useFetchAccountsBalances(foolsContractAddress, [address], balance == null)
  return {
    balance: (balance ?? 0n),
    balance_eth: weiToEth(balance),
    isLoading: (balance == null),
  }
}

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { lordsContractAddress } = useTokenContracts()
  const state = useFoolsCoinStore((state) => state)
  const balance = useMemo(() => state.getBalance(address), [state.accounts, address])
  // fetch if not cached
  useFetchAccountsBalances(lordsContractAddress, [address], balance == null)
  const { canAffordFee } = _useCalcFee(balance, fee)
  return {
    balance: (balance ?? 0n),
    balance_eth: weiToEth(balance),
    canAffordFee,
    isLoading: (balance == null),
  }
}


const _useCalcFee = (
  balance: BigNumberish | undefined,
  fee: BigNumberish,  // optionally calculate if there is enough balance to pay this fee
) => {
  const canAffordFee = useMemo(() => (
    balance != undefined ? (BigInt(balance ?? 0n) >= BigInt(fee ?? 0n)) : undefined
  ), [balance, fee])
  return {
    canAffordFee,
  }
}



//----------------------------------------
// fetch new balances
//

export const useFetchTokenboundAccountsBalances = (coinAddress: BigNumberish, tokenAddress: BigNumberish, tokenIds: bigint[], enabled: boolean) => {
  const tokenBoundAddresses = useMemo(() => (
    tokenIds.map((tokenId) => makeTokenBoundAddress(tokenAddress, tokenId))
  ), [tokenAddress, tokenIds]);
  return useFetchAccountsBalances(coinAddress, tokenBoundAddresses, enabled)
}

export const useFetchAccountsBalances = (coinAddress: BigNumberish, accounts: BigNumberish[], enabled: boolean) => {
  const state = useCoinStore(coinAddress)((state) => state)
  const [isLoading, setIsLoading] = useState<boolean>(undefined)
  const { sdk } = useDojoSetup()
  useEffect(() => {
    let _mounted = true
    const _fetch = async () => {
      const newAccounts = accounts.filter((a) => !state.hasBalance(a))
      // fetch...
      if (newAccounts.length > 0) {
        setIsLoading(true)
        // initialize balances
        state.initBalances(newAccounts)
        // fetch...
        await sdk.getTokenBalances({
          contractAddresses: [coinAddress as string],
          accountAddresses: newAccounts.map((a) => bigintToHex(a)),
          tokenIds: [],
        }).then((balances: Page<torii.TokenBalance>) => {
          // console.log("fetchAccountsBalances() GOT:", balances)
          state.setBalances(balances.items)
          if (balances.next_cursor) {
            console.warn("fetchAccountsBalances() LIMIT REACHED!!!! Possible loss of data", coinAddress, newAccounts)
          }
        }).catch((error: Error) => {
          console.error("fetchAccountsBalances().sdk.get() error:", error, newAccounts)
        })
      }
      // done
      if (_mounted) {
        setIsLoading(false)
      }
    }
    if (enabled && isPositiveBigint(coinAddress)) _fetch()
    return () => {
      _mounted = false
    }
  }, [sdk, coinAddress, accounts, enabled])
  return {
    isLoading,
    isFinished: (isLoading === false),
  }
}


//----------------------------------------
// RPC balances
//
export const useEtherBalance = (address: BigNumberish, fee: BigNumberish = 0n, watch: boolean = false) => {
  const { selectedNetworkConfig } = useStarknetContext()
  return useERC20Balance(selectedNetworkConfig.etherAddress, address, fee, watch)
}
