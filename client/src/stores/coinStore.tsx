import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useERC20Balance } from '@underware/pistols-sdk/utils/hooks'
import { useSdkTokenBalancesGet, useStarknetContext } from '@underware/pistols-sdk/dojo'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDuelistTokenBoundAddress } from '/src/hooks/useTokenBound'
import { makeTokenBoundAddress } from '@underware/pistols-sdk/pistols'
import { SetupResult } from '@underware/pistols-sdk/dojo'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { weiToEth } from '@underware/pistols-sdk/starknet'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import * as torii from '@dojoengine/torii-client'
import { Page } from '@dojoengine/torii-client'


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
  getAccounts: (contractAddress: BigNumberish) => string[];
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
      set((state: State) => {
        const _contract = bigintToHex(balance.contract_address)
        const _account = bigintToHex(balance.account_address)
        // update only if account is being tracked
        if (state.contracts[_contract]?.[_account] != undefined) {
          state.contracts[_contract][_account] = _parseBalance(balance)
        }
      });
    },
    getBalance: (contractAddress: BigNumberish, accountAddress: BigNumberish): bigint | undefined | null => {
      const _contractAddress = bigintToHex(contractAddress)
      const balances = get().contracts[_contractAddress]
      if (!balances) return undefined
      return balances[bigintToHex(accountAddress)] ?? null
    },
    getAccounts: (contractAddress: BigNumberish): string[] => {
      const _contractAddress = bigintToHex(contractAddress)
      const balances = get().contracts[_contractAddress]
      if (!balances) return []
      return Object.keys(balances)
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
  fee: BigNumberish = 0n, // optionally calculate if there is enough balance to pay this fee
) => {
  const state = useCoinStore((state) => state)
  const balance = useMemo(() => state.getBalance(contractAddress, accountAddress), [state.contracts, contractAddress, accountAddress])
  const balance_eth = useMemo(() => (balance != null ? weiToEth(balance) : balance), [balance])
  // console.log(`COIN BALANCE`, (bigintToHex(contractAddress)), (bigintToHex(accountAddress)), balance)

  const { isLoading } = useSdkTokenBalancesGet({
    contract: bigintToHex(contractAddress || 0n),
    account: bigintToHex(accountAddress || 0n),
    setBalances: state.setBalances,
    enabled: (balance == null),
  })

  const canAffordFee = useMemo(() => {
    if (balance == null || !fee) return undefined
    return (balance >= BigInt(fee))
  }, [balance, fee])

  return {
    balance: balance ?? 0n,           // wei value
    balance_eth: balance_eth ?? 0n,   // eth value
    canAffordFee,
    isLoading: (balance == null || isLoading),
  }
}

export const fetchNewTokenBoundCoins = async (sdk: SetupResult['sdk'], coinAddress: BigNumberish, tokenAddress: BigNumberish, tokenIds: bigint[]) => {
  if (tokenIds.length == 0) return
  const setBalances = useCoinStore.getState().setBalances
  const accounts = useCoinStore.getState().getAccounts(coinAddress)
  const tokenBoundAddresses = tokenIds
    .map((tokenId) => bigintToHex(makeTokenBoundAddress(tokenAddress, tokenId)))
    .filter((address) => !accounts.includes(address))
  // console.log("fetchNewTokenBoundCoins()...", tokenAddress, tokenIds, tokenBoundAddresses, accounts)
  if (tokenBoundAddresses.length > 0) {
    await sdk.getTokenBalances({
      contractAddresses: [coinAddress as string],
      accountAddresses: tokenBoundAddresses,
      tokenIds: [],
    }).then((balances: Page<torii.TokenBalance>) => {
      // console.log("fetchNewTokenBoundCoins() GOT:", balances)
      setBalances(balances.items)
      if (balances.next_cursor) {
        console.warn("fetchNewTokenBoundCoins() LOST PAGE!!!! ", coinAddress, tokenBoundAddresses)
      }
    }).catch((error: Error) => {
      console.error("fetchNewTokenBoundCoins().sdk.get() error:", error, tokenIds)
    })
  }
}


//----------------------------------------
// token balances
//

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { lordsContractAddress } = useTokenContracts()
  return useCoinBalance(lordsContractAddress, address, fee)
}

export const useFoolsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { foolsContractAddress } = useTokenContracts()
  return useCoinBalance(foolsContractAddress, address, fee)
}

export const useFameBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { fameContractAddress } = useTokenContracts()
  const result = useCoinBalance(fameContractAddress, address, fee)
  // console.log('useFameBalance COIN FAME:', address, result)
  const lives = useMemo(() => Math.floor(Number(result.balance / constants.FAME.ONE_LIFE)), [result.balance])
  return {
    ...result,
    lives,
    isAlive: (lives > 0),
  }
}

export const useDuelistFameBalance = (duelistId: BigNumberish, fee: BigNumberish = 0n) => {
  const { address } = useDuelistTokenBoundAddress(duelistId)
  return useFameBalance(address, fee)
}



//----------------------------------------
// RPC balances
//
export const useEtherBalance = (address: BigNumberish, fee: BigNumberish = 0n, watch: boolean = false) => {
  const { selectedNetworkConfig } = useStarknetContext()
  return useERC20Balance(selectedNetworkConfig.etherAddress, address, fee, watch)
}
