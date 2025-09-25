import { useEffect, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { bigintToAddress, bigintToHex, isPositiveBigint } from 'src/utils/misc/types'
import { SubscriptionCallbackArgs } from '@dojoengine/sdk'
import { Page } from '@dojoengine/torii-client'
import * as torii from '@dojoengine/torii-client'
import { debug } from 'src/games/pistols/misc/debug'

//---------------------------------------
// Get entities from torii
//
// stores at remote store compatible with createDojoStore()
// initial state calls: setEntities()
// updates calls: updateEntity() (optional)
//

export type UseSdkTokenGetResult = {
  isLoading: boolean | undefined
}

export type UseSdkTokenBalancesGetProps = {
  contract: BigNumberish
  accounts?: BigNumberish[]
  tokenIds?: BigNumberish[]
  enabled?: boolean
  // initBalances?: (accounts: BigNumberish[]) => void
  setBalances: (balances: torii.TokenBalance[]) => void
  updateProgress?: (currentPage: number, finished?: boolean) => void  // called page by page to report progress
}
export type UseSdkTokenBalancesSubProps = {
  contracts: BigNumberish[]
  enabled?: boolean
  updateBalance: (balance: torii.TokenBalance) => void
}

//---------------------------------------
// TokenBalances get/subscribe
//
export const useSdkTokenBalancesGet = ({
  contract,
  accounts,
  tokenIds,
  // initBalances,
  setBalances,
  updateProgress,
  enabled = true,
}: UseSdkTokenBalancesGetProps): UseSdkTokenGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const _contract = bigintToAddress(contract)
      const _accounts = accounts?.map(a => bigintToHex(a)) ?? []
      // debug.log("useSdkTokenBalancesGet() GET........", enabled, _contract, _accounts, tokenIds)
      setIsLoading(true)
      updateProgress?.(0);
      // initBalances?.(_accounts);
      await sdk.getTokenBalances({
        contractAddresses: [_contract],
        accountAddresses: _accounts,
        tokenIds: tokenIds?.map(a => toToriiTokenId(a)) ?? []
      }).then((balances: Page<torii.TokenBalance>) => {
        if (!_mounted) return
        // debug.log("useSdkTokenBalancesGet() GOT:", balances)
        if (balances.items.length > 0) {
          setBalances(balances.items)
        } else if (!tokenIds) {
          // initialize zero balance
          // debug.log("useSdkTokenBalancesGet() initialize balance:", contract, account)
          const _balances: torii.TokenBalance[] = _accounts.map(a => ({
            contract_address: _contract,
            account_address: a,
            token_id: '0x0',
            balance: '0x0',
          }))
          setBalances(_balances)
        }
        if (balances.next_cursor) {
          console.warn("useSdkTokenBalancesGet() LOST PAGE!!!! ", contract, _accounts, tokenIds)
        }
      }).catch((error: Error) => {
        if (!_mounted) return
        console.error("useSdkTokenBalancesGet().sdk.get() error:", error, contract, _accounts, tokenIds)
      }).finally(() => {
        setIsLoading(false)
        updateProgress?.(1, true);
      })
      // debug.log("useSdkTokenBalancesGet() done!", account)
    }
    // get...
    if (sdk && enabled && isPositiveBigint(contract)) _get()
    return () => {
      _mounted = false
    }
  }, [sdk, enabled, contract, accounts, tokenIds])

  return {
    isLoading,
  }
}

export const useSdkTokenBalancesSub = ({
  contracts,
  updateBalance,
  enabled = true,
}: UseSdkTokenBalancesSubProps): UseSdkTokenGetResult => {
  const { sdk } = useDojoSetup()

  useEffect(() => {
    let _subscription: torii.Subscription = undefined;
    const _subscribe = async (contractAddresses: string[]) => {
      debug.log(`useSdkTokenBalancesSub() SUBSCRIBE......`, contractAddresses)
      _subscription = await sdk.onTokenBalanceUpdated({
        contractAddresses,
        accountAddresses: [],
        tokenIds: [],
        callback: (response: SubscriptionCallbackArgs<torii.TokenBalance>) => {
          debug.log("useSdkTokenBalancesSub() RESPONSE:", response);
          let balance: torii.TokenBalance = response.data ??
            // it's actually returning a torii.TokenBalance!!!
            ((response as any).contract_address ? response as unknown as torii.TokenBalance : undefined);
          if (balance) {
            debug.log("useSdkTokenBalancesSub() SUB:", isPositiveBigint(balance.contract_address), balance);
            if (isPositiveBigint(balance.contract_address)) {
              updateBalance(balance);
            }
          } else if (response.error) {
            console.error("useSdkTokenBalancesSub() SUBSCRIPTION ERROR:", response.error)
          }
        }
      })
    };
    // subscribe
    const _contractAddresses = contracts.map(c => bigintToAddress(c)).filter(isPositiveBigint);
    if (sdk && enabled && _contractAddresses.length > 0) {
      _subscribe(_contractAddresses);
    }
    // unsubscribe
    return () => {
      _subscription?.cancel()
      _subscription = undefined
    }
  }, [sdk, enabled, contracts])

  return {
    isLoading: false,
  }
}


//---------------------------------------
// utils
//

//
// Format token ids for torii token queries
function toToriiTokenId(value: BigNumberish) {
  // return BigInt(value).toString(16).padStart(64, "0");
  return BigInt(value).toString().padStart(64, "0");
}
