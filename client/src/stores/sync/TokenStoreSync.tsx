import { useEffect, useMemo, useState } from 'react'
import { useDojoSetup, useLordsContract, useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenContract, useDuelTokenContract, usePackTokenContract } from '/src/hooks/useTokenContract'
import { useFameContract } from '/src/hooks/useFame'
import { useFoolsContract } from '/src/hooks/useFools'
import { useTokenIdsOfPlayer, useTokenStore } from '/src/stores/tokenStore'
import { useCoinStore } from '/src/stores/coinStore'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import * as torii from '@dojoengine/torii-client'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'


export function TokenStoreSync() {
  const { sdk } = useDojoSetup()
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

  // initialize player's duelists
  useTokenIdsOfPlayer(duelistContractAddress, !initialized)
  useTokenIdsOfPlayer(duelContractAddress, !initialized)
  useTokenIdsOfPlayer(packContractAddress, !initialized)

  // subscribe for any updates
  const mounted = useMounted()
  const contracts = useMemo(() => [
    ...token_contracts,
    ...coin_contracts,
  ], [token_contracts, coin_contracts])
  const accounts = useMemo(() => [], [])
  useSdkTokenBalancesSub({
    contracts,
    accounts,
    updateBalance: (balance: torii.TokenBalance) => {
      console.log("TOKENS SUB >>>", balance)
      const _contract = bigintToHex(balance.contract_address)
      if (token_contracts.includes(_contract)) {
        token_state.updateBalance(balance)
      } else {
        coin_state.updateBalance(balance)
      }
    },
    enabled: mounted,
  })

  useEffect(() => console.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  useEffect(() => console.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
