import { useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { TokenBalance } from '@dojoengine/torii-client'
import { useDojoSetup, useToriiTokensByOwnerQL } from '@underware_gg/pistols-sdk/dojo'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useTokenStore } from '/src/stores/tokenStore'


//----------------------------------------
// keep connected player's tokens in sync
//
export function TokensOfPlayerStoreSyncQL({
  watch = true,
}: {
  watch?: boolean
}) {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { address } = useAccount()
  const state = useTokenStore((state) => state)
  const { tokens, isLoading } = useToriiTokensByOwnerQL(duelistContractAddress, address, watch)
  useEffect(() => {
    if (duelistContractAddress && address && !isLoading) {
      state.setTokens(duelistContractAddress, address, tokens)
    }
  }, [duelistContractAddress, address, tokens, isLoading])
  // useEffect(() => console.log("TokensOfPlayerStoreSyncQL() =>", state.tokens), [state.tokens])
  return (<></>)
}


//----------------------------------------
// TODO: replace QL for this...
//
export function TokensOfPlayerStoreSync() {
  // const { duelistContractAddress } = useDuelistTokenContract()
  // const { address } = useAccount()
  // const { sdk } = useDojoSetup()
  // const state = useTokenStore((state) => state)
  // useEffect(() => {
  //   const _fetch = async () => {
  //     // const response: Token[] = await sdk.getTokens([])
  //     const response: TokenBalance[] = await sdk.getTokenBalances(
  //       // [],
  //       ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //       // [formatQueryValue(address)],
  //       // ['0x24ec36b5c19d158e9749d4f2b48afb7b51ce0f5e4a871f53028a601a253fb6e'],
  //       // [formatQueryValue(duelistContractAddress)],
  //       [],
  //     )
  //     console.log("TokensOfPlayerStoreSync_SDK() =>>>>>>>>>", response)
  //   }
  //   console.log(`____SDK account:`, address, duelistContractAddress, sdk)
  //   if (sdk && address) {
  //     _fetch()
  //   }
  // }, [sdk, address])
  // useEffect(() => console.log("TokensOfPlayerStoreSync() =>", state.tokenIds), [state.tokenIds])
  return (<></>)
}
