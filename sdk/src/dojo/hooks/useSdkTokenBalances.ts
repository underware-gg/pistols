import { useEffect, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
import { isPositiveBigint } from 'src/utils/misc/types'
import * as torii from '@dojoengine/torii-client'


//---------------------------------------
// Get entities from torii
//
// stores at remote store compatible with createDojoStore()
// initial state calls: setEntities()
// updates calls: updateEntity() (optional)
//

type UseSdkGetResult = {
  isLoading: boolean | undefined
}

export type UseSdkTokenBalancesGetProps = {
  contracts: string[]
  accounts?: string[]
  tokenIds?: string[]
  enabled?: boolean
  setBalances: (balances: torii.TokenBalance[]) => void
  forceCounter?: number
  retryInterval?: number
}
export type UseSdkTokenBalancesSubProps = {
  contracts: string[]
  accounts?: string[]
  tokenIds?: string[]
  enabled?: boolean
  updateBalance: (balance: torii.TokenBalance) => void
}

//---------------------------------------
// TokenBalances get/subscribe
//
export const useSdkTokenBalancesGet = ({
  contracts,
  accounts,
  tokenIds,
  setBalances,
  enabled = true,
  forceCounter = 0,
  retryInterval = 0,
}: UseSdkTokenBalancesGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      // console.log("useSdkTokenBalancesGet() GET........", enabled, forceCounter, retryInterval, contracts, accounts)
      setIsLoading(true)
      await sdk.getTokenBalances(
        contracts,
        accounts ?? [],
        tokenIds?.map(a => toToriiTokenId(a)) ?? []
      ).then((balances: torii.TokenBalance[]) => {
        if (!_mounted) return
        // console.log("useSdkTokenBalancesGet() GOT:", balances)
        if (balances.length > 0) {
          setBalances(balances)
          setIsLoading(false)
        } else if (retryInterval > 0) {
          console.log("useSdkTokenBalancesGet() retry...", retryInterval)
          setTimeout(() => _get(), retryInterval)
        }
      }).catch((error: Error) => {
        if (!_mounted) return
        console.error("useSdkTokenBalancesGet().sdk.get() error:", error, contracts, accounts)
        setIsLoading(false)
      })
      // console.log("useSdkTokenBalancesGet() done!")
    }
    // get...
    if (sdk && enabled) _get()
    return () => {
      _mounted = false
    }
  }, [sdk, enabled, contracts, accounts, tokenIds, forceCounter, retryInterval])

  return {
    isLoading,
  }
}

export const useSdkTokenBalancesSub = ({
  contracts,
  accounts,
  tokenIds,
  updateBalance,
  enabled = true,
}: UseSdkTokenBalancesSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()

  useEffect(() => {
    let _subscription: torii.Subscription = undefined;
    const _subscribe = () => {
      console.log(`useSdkTokenBalancesSub() SUBSCRIBE......`, contracts, accounts)
      _subscription = sdk.onTokenBalanceUpdated(
        contracts,
        accounts ?? [],
        tokenIds?.map(a => toToriiTokenId(a)) ?? [],
        (balance: torii.TokenBalance) => {
          console.log("useSdkTokenBalancesSub() SUB:", balance);
          if (isPositiveBigint(balance.contract_address)) {
            updateBalance(balance);
          }
        },
      )
    };
    // subscribe
    if (sdk && enabled) _subscribe()
    // unsubscribe
    return () => {
      _subscription?.cancel()
      _subscription = undefined
    }
  }, [sdk, enabled, contracts, accounts, tokenIds])

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
  return BigInt(value).toString(16).padStart(64, "0");
}
