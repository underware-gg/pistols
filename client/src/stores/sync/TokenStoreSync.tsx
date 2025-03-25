import { useEffect, useMemo, useState } from 'react'
import { useLordsContract, useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { useFameContract } from '/src/hooks/useFame'
import { useFoolsContract } from '/src/hooks/useFools'
import { useTokenIdsOfPlayer, useTokenStore } from '/src/stores/tokenStore'
import { useCoinStore } from '/src/stores/coinStore'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import * as torii from '@dojoengine/torii-client'



export function TokenStoreSyncQL() {
  // const { duelistContractAddress } = useDuelistTokenContract()
  // const { address } = useAccount()
  // const state = useTokenStore((state) => state)
  // const { tokens, isLoading, refetch } = useToriiTokensByOwnerQL(duelistContractAddress, address, watch)

  // const { mintedCount } = useTokenConfig(duelistContractAddress)
  // useEffect(() => {
  //   setTimeout(() => { refetch() }, 500);
  // }, [mintedCount, refetch])

  // useEffect(() => {
  //   if (duelistContractAddress && address && !isLoading) {
  //     state.setTokens(duelistContractAddress, address, tokens)
  //   }
  // }, [duelistContractAddress, address, tokens, isLoading])
  // useEffect(() => console.log("TokensOfPlayerStoreSyncQL() =>", state.tokens), [state.tokens])
  return (<></>)
}



export function TokenStoreSync() {
  const token_state = useTokenStore((state) => state)
  const coin_state = useCoinStore((state) => state)

  // get token contracts
  const { duelistContractAddress } = useDuelistTokenContract()
  const { duelContractAddress } = useDuelTokenContract()
  const { packContractAddress } = usePackTokenContract()
  const token_contracts = useMemo(() => [
    bigintToHex(duelistContractAddress),
    bigintToHex(duelContractAddress),
    bigintToHex(packContractAddress),
  ], [duelistContractAddress, duelContractAddress, packContractAddress])

  // get coin contracts
  const { lordsContractAddress } = useLordsContract()
  const { fameContractAddress } = useFameContract()
  const { foolsContractAddress } = useFoolsContract()
  const coin_contracts = useMemo(() => [
    bigintToHex(lordsContractAddress),
    bigintToHex(fameContractAddress),
    bigintToHex(foolsContractAddress),
  ], [lordsContractAddress, fameContractAddress, foolsContractAddress])

  // initialize stores
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (!initialized && token_contracts.length > 0 && coin_contracts.length > 0) {
      token_state.initialize(token_contracts);
      coin_state.initialize(coin_contracts);
      setInitialized(true)
    }
  }, [initialized, token_contracts, coin_contracts])

  // subscribe for any updates
  const mounted = useMounted()
  const contracts = useMemo(() => [
    ...token_contracts,
    ...coin_contracts,
  ], [token_contracts, coin_contracts])
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      console.log("TOKENS SUB >>>", balance)
      const _contract = bigintToHex(balance.contract_address)
      if (token_contracts.includes(_contract)) {
        token_state.updateBalance(balance)
      } else if (coin_contracts.includes(_contract)) {
        coin_state.updateBalance(balance)
      }
    },
    enabled: (mounted && initialized),
  })

  // useEffect(() => console.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => console.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
