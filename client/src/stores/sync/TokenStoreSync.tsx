import { useMemo } from 'react'
import { useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenStore } from '/src/stores/tokenStore'
import { useCoinStore } from '/src/stores/coinStore'
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
      // console.log("TOKENS SUB >>>", balance)
      const _contract = bigintToHex(balance.contract_address)
      if (token_contracts.includes(_contract)) {
        token_state.updateBalance(balance)
      } else if (coin_contracts.includes(_contract)) {
        coin_state.updateBalance(balance)
      }
    },
    enabled: (mounted),
  })

  // useEffect(() => console.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => console.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
