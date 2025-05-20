import { useEffect, useMemo, useState } from 'react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDojoSetup, useSdkTokenBalancesGet, useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { bigintEquals, bigintToAddress, bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { fetchTokenBoundBalances, useCoinStore } from '/src/stores/coinStore'
import * as torii from '@dojoengine/torii-client'
import { useAccount } from '@starknet-react/core'


export function TokenStoreSync() {
  const duelist_state = useDuelistTokenStore((state) => state)
  const duel_state = useDuelTokenStore((state) => state)
  const pack_state = usePackTokenStore((state) => state)
  const tournament_state = useTournamentTokenStore((state) => state)
  const coin_state = useCoinStore((state) => state)

  const {
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
    duelistContractAddress,
    duelContractAddress,
    packContractAddress,
    tournamentContractAddress,
  } = useTokenContracts()

  // get coin contracts
  const coin_contracts = useMemo(() => [
    bigintToHex(lordsContractAddress),
    bigintToHex(fameContractAddress),
    bigintToHex(foolsContractAddress),
  ], [lordsContractAddress, fameContractAddress, foolsContractAddress])

  // get token contracts
  const token_contracts = useMemo(() => [
    bigintToHex(duelistContractAddress),
    // bigintToHex(duelContractAddress),        // not needed
    bigintToHex(packContractAddress),
    // bigintToHex(tournamentContractAddress),  // not implemented yet
  ], [duelistContractAddress, packContractAddress])


  //----------------------------------------
  // get initial state
  //
  const mounted = useMounted()
  const { address } = useAccount()

  // cache all duelists
  useSdkTokenBalancesGet({
    contract: bigintToAddress(duelistContractAddress),
    setBalances: duelist_state.setBalances,
    enabled: (isPositiveBigint(duelistContractAddress) && mounted),
  })

  // cache packs of player only
  useSdkTokenBalancesGet({
    contract: bigintToAddress(packContractAddress),
    account: address,
    setBalances: pack_state.setBalances,
    enabled: (isPositiveBigint(packContractAddress) && mounted),
  })


  //----------------------------------------
  // subscribe for updates
  //
  const contracts = useMemo(() => [
    ...coin_contracts,
    ...token_contracts,
  ], [token_contracts, coin_contracts])
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      const _contract = bigintToHex(balance.contract_address)
      // console.log("TOKENS SUB >>>", balance, token_contracts.includes(_contract), coin_contracts.includes(_contract))
      if (bigintEquals(balance.contract_address, duelistContractAddress)) {
        duelist_state.updateBalance(balance)
      } else if (bigintEquals(balance.contract_address, duelContractAddress)) {
        duel_state.updateBalance(balance)
      } else if (bigintEquals(balance.contract_address, packContractAddress)) {
        pack_state.updateBalance(balance)
      } else if (bigintEquals(balance.contract_address, tournamentContractAddress)) {
        tournament_state.updateBalance(balance)
      } else if (coin_contracts.includes(_contract)) {
        coin_state.updateBalance(balance)
      }
    },
    enabled: (mounted),
  })

  // for every imported DUELIST, fetch their tokenbound FAME balance
  const { sdk } = useDojoSetup()
  const [trackedAccounts, setTrackedAccounts] = useState<string[]>([])
  useEffect(() => {
    const _balances = duelist_state?.[duelistContractAddress as string]
    if (_balances) {
      const allAccounts = Object.keys(_balances)
      const newAccounts = allAccounts.filter((address) => !trackedAccounts.includes(address))
      if (newAccounts.length > 0) {
        // console.log("TokenStoreSync() TRACK newAccounts =>", newAccounts)
        newAccounts.forEach((address) => {
          fetchTokenBoundBalances(sdk, fameContractAddress, duelistContractAddress, _balances[address])
        })
        setTrackedAccounts(allAccounts)
      }
    }
  }, [duelist_state])


  // useEffect(() => console.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => console.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
