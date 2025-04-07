import { useEffect, useMemo, useState } from 'react'
import { useDojoSetup, useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenStore } from '/src/stores/tokenStore'
import { fetchNewTokenBoundCoins, useCoinStore } from '/src/stores/coinStore'
import {
  useDuelistTokenContract,
  useDuelTokenContract,
  usePackTokenContract,
  useFameContract,
  useFoolsContract,
  useLordsContract,
} from '/src/hooks/useTokenContract'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import * as torii from '@dojoengine/torii-client'


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

  // subscribe for any updates
  const mounted = useMounted()
  const contracts = useMemo(() => [
    ...token_contracts,
    ...coin_contracts,
  ], [token_contracts, coin_contracts])
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      const _contract = bigintToHex(balance.contract_address)
      // console.log("TOKENS SUB >>>", balance, token_contracts.includes(_contract), coin_contracts.includes(_contract))
      if (token_contracts.includes(_contract)) {
        token_state.updateBalance(balance)
      } else if (coin_contracts.includes(_contract)) {
        coin_state.updateBalance(balance)
      }
    },
    enabled: (mounted),
  })

  // for every new account DUELISTS, fetch its tokenbound FAME balances
  const { sdk } = useDojoSetup()
  const [trackedAccounts, setTrackedAccounts] = useState<string[]>([])
  useEffect(() => {
    const _balances = token_state.contracts?.[duelistContractAddress as string]
    if (_balances) {
      const allAccounts = Object.keys(_balances)
      const newAccounts = allAccounts.filter((address) => !trackedAccounts.includes(address))
      if (newAccounts.length > 0) {
        // console.log("TokenStoreSync() TRACK newAccounts =>", newAccounts)
        newAccounts.forEach((address) => {
          fetchNewTokenBoundCoins(sdk, fameContractAddress, duelistContractAddress, _balances[address])
        })
        setTrackedAccounts(allAccounts)
      }
    }
  }, [token_state.contracts])


  // useEffect(() => console.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => console.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
