import { useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { formatQueryValue, useDojoSetup } from '@underware/pistols-sdk/dojo'
import { useToriiTokensByOwnerQL } from '@underware/pistols-sdk/dojo/graphql'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useTokenStore } from '/src/stores/tokenStore'
import * as torii from '@dojoengine/torii-client'


//----------------------------------------
// keep connected player's tokens in sync
//
export function TokensOfPlayerStoreSyncQL({
  watch = false,
}: {
  watch?: boolean
}) {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { address } = useAccount()
  const state = useTokenStore((state) => state)
  const { tokens, isLoading, refetch } = useToriiTokensByOwnerQL(duelistContractAddress, address, watch)

  const { mintedCount } = useTokenConfig(duelistContractAddress)
  useEffect(() => {
    setTimeout(() => { refetch() }, 500);
  }, [mintedCount, refetch])

  useEffect(() => {
    if (duelistContractAddress && address && !isLoading) {
      state.setTokens(duelistContractAddress, address, tokens)
    }
  }, [duelistContractAddress, address, tokens, isLoading])
  useEffect(() => console.log("TokensOfPlayerStoreSyncQL() =>", state.tokens), [state.tokens])
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
  //     console.log(`GRPC-1: TokensOfPlayerStoreSync_SDK() fetch...`)
  //     const response: torii.TokenBalance[] = await sdk.getTokenBalances(
  //       // [formatQueryValue(address)], // accounts
  //       // ["0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7"],
  //       [],
  //       // [formatQueryValue(duelistContractAddress)], // contracts
  //       // ['0xd103c7c53ce13a217d8a05a92e277ca6edca7c4362621c538dc7ec74be3b02'], // duelists
  //       [], // contracts
  //       [], // tokens
  //     )
  //     // const response: torii.Token[] = await sdk.getTokens(
  //     //   // [formatQueryValue(duelistContractAddress)], // contracts
  //     //   // ['0xd103c7c53ce13a217d8a05a92e277ca6edca7c4362621c538dc7ec74be3b02'], // duelists
  //     //   [], // contracts
  //     //   [], // tokens
  //     // )
  //     console.log("GRPC-2: TokensOfPlayerStoreSync_SDK() response =>>>>>>>>>", response)
  //   }
  //   if (sdk && address) {
  //     console.log(`GRPC-0: TokensOfPlayerStoreSync_SDK() fetch...`, address, duelistContractAddress)
  //     _fetch()
  //   }
  // }, [sdk, address])
  // useEffect(() => console.log("GRPC-2: TokensOfPlayerStoreSync_SDK() state =>", state.tokens), [state.tokens])
  return (<></>)
}
