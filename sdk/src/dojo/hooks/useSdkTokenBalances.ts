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
  setBalances: (balances: torii.TokenBalance[]) => void
  enabled?: boolean
  forceCounter?: number
}
export type UseSdkTokenBalancesSubProps = {
  contracts: string[]
  accounts?: string[]
  tokenIds?: string[]
  updateBalance: (balance: torii.TokenBalance) => void
  enabled?: boolean
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
}: UseSdkTokenBalancesGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    const _get = async () => {
      // console.warn("useSdkTokenBalancesGet() GET........", enabled, forceCounter, contracts, accounts)
      setIsLoading(true)
      await sdk.getTokenBalances(
        contracts,
        accounts ?? [],
        tokenIds?.map(a => toToriiTokenId(a)) ?? []
      ).then((balances: torii.TokenBalance[]) => {
          // console.log("useSdkTokenBalancesGet() GOT:", balances)
          setBalances(balances)
        }).catch((error: Error) => {
          console.error("useSdkTokenBalancesGet().sdk.get() error:", error, contracts, accounts)
        }).finally(() => {
          setIsLoading(false)
        })
    }
    // get...
    if (sdk && enabled) _get()
  }, [sdk, enabled, contracts, accounts, tokenIds, forceCounter])

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
