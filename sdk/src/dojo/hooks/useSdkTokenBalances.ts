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
  contract: string
  account?: string
  tokenIds?: BigNumberish[]
  enabled?: boolean
  setBalances: (balances: torii.TokenBalance[]) => void
}
export type UseSdkTokenBalancesSubProps = {
  contracts: string[]
  enabled?: boolean
  updateBalance: (balance: torii.TokenBalance) => void
}

//---------------------------------------
// TokenBalances get/subscribe
//
export const useSdkTokenBalancesGet = ({
  contract,
  account,
  tokenIds,
  setBalances,
  enabled = true,
}: UseSdkTokenBalancesGetProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()
  const [isLoading, setIsLoading] = useState<boolean>()

  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      // console.log("useSdkTokenBalancesGet() GET........", enabled, contract, account, tokenIds)
      setIsLoading(true)
      await sdk.getTokenBalances(
        [contract],
        account ? [account] : [],
        tokenIds?.map(a => toToriiTokenId(a)) ?? []
      ).then((balances: torii.TokenBalance[]) => {
        if (!_mounted) return
        // console.log("useSdkTokenBalancesGet() GOT:", balances)
        if (balances.length > 0) {
          setBalances(balances)
        } else if (!tokenIds) {
          // initialize zero balance
          // console.log("useSdkTokenBalancesGet() initialize balance:", contract, account)
          const _balances = [{
            contract_address: contract,
            account_address: account,
            token_id: '0x0',
            balance: '0x0',
          }]
          setBalances(_balances)
        }
      }).catch((error: Error) => {
        if (!_mounted) return
        console.error("useSdkTokenBalancesGet().sdk.get() error:", error, contract, account)
      }).finally(() => {
        setIsLoading(false)
      })
      // console.log("useSdkTokenBalancesGet() done!", account)
    }
    // get...
    if (sdk && enabled && isPositiveBigint(contract) && (isPositiveBigint(account) || tokenIds)) _get()
    return () => {
      _mounted = false
    }
  }, [sdk, enabled, contract, account, tokenIds])

  return {
    isLoading,
  }
}

export const useSdkTokenBalancesSub = ({
  contracts,
  updateBalance,
  enabled = true,
}: UseSdkTokenBalancesSubProps): UseSdkGetResult => {
  const { sdk } = useDojoSetup()

  useEffect(() => {
    let _subscription: torii.Subscription = undefined;
    const _subscribe = () => {
      console.log(`useSdkTokenBalancesSub() SUBSCRIBE......`, contracts)
      _subscription = sdk.onTokenBalanceUpdated(
        contracts,
        [],
        [],
        (balance: torii.TokenBalance) => {
          console.log("useSdkTokenBalancesSub() SUB:", balance);
          if (isPositiveBigint(balance.contract_address)) {
            updateBalance(balance);
          }
        },
      )
    };
    // subscribe
    if (sdk && enabled && contracts.length > 0) _subscribe()
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
