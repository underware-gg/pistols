import { useEffect, useState } from 'react'
import { useDojoSetup } from 'src/dojo/contexts/DojoContext'
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
  accounts: string[]
  setBalances: (balances: torii.TokenBalance[]) => void
  enabled?: boolean
}
export type UseSdkTokenBalancesSubProps = {
  contracts: string[]
  accounts: string[]
  updateBalance: (balance: torii.TokenBalance) => void
  enabled?: boolean
}

//---------------------------------------
// TokenBalances get/subscribe
//
export const useSdkTokenBalancesGet = ({
  contracts = [],
  accounts = [],
  setBalances,
  enabled = true,
}: UseSdkTokenBalancesGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    const _get = async () => {
      // console.warn("useSdkTokenBalancesGet() GET.........", contracts, accounts)
      setIsLoading(true)
      await sdk.getTokenBalances(contracts, accounts, [])
        .then((balances: torii.TokenBalance[]) => {
          console.log("useSdkTokenBalancesGet() GOT:", balances)
          setBalances(balances)
        }).catch((error: Error) => {
          console.error("useSdkTokenBalancesGet().sdk.get() error:", error, contracts, accounts)
        }).finally(() => {
          setIsLoading(false)
        })
    }
    // get...
    if (sdk && enabled && (contracts.length > 0 || accounts.length > 0)) _get()
  }, [sdk, enabled, contracts, accounts])

  return {
    isLoading,
  }
}

export const useSdkTokenBalancesSub = ({
  contracts = [],
  accounts = [],
  updateBalance,
  enabled = true,
}: UseSdkTokenBalancesSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()

  useEffect(() => {
    let _subscription: torii.Subscription = undefined;
    const _subscribe = () => {
      console.log(`useSdkTokenBalancesSub() SUBSCRIBE......`, contracts, accounts)
      _subscription = sdk.onTokenBalanceUpdated(contracts, accounts, [],
        (balance: torii.TokenBalance) => {
          console.log("TOKEN BALANCES SUB():", balance);
          updateBalance(balance);
        },
      )
    };
    // subscribe
    if (sdk && enabled && (contracts.length > 0 || accounts.length > 0)) _subscribe()
    // unsubscribe
    return () => {
      _subscription?.cancel()
      _subscription = undefined
    }
  }, [sdk, enabled, contracts, accounts])

  return {
    isLoading: false,
  }
}

