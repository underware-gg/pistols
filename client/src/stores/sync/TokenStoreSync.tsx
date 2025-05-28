import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useSdkTokenBalancesGet, useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { useFameCoinStore, useLordsCoinStore, useFoolsCoinStore, useFetchAccountsBalances } from '/src/stores/coinStore'
import { debug } from '@underware/pistols-sdk/pistols'
import * as torii from '@dojoengine/torii-client'


export function TokenStoreSync() {
  // token stores
  const duelist_state = useDuelistTokenStore((state) => state)
  const duel_state = useDuelTokenStore((state) => state)
  const pack_state = usePackTokenStore((state) => state)
  const tournament_state = useTournamentTokenStore((state) => state)
  // coin stores
  const lords_state = useLordsCoinStore((state) => state)
  const fame_state = useFameCoinStore((state) => state)
  const fools_state = useFoolsCoinStore((state) => state)

  const {
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
    duelistContractAddress,
    duelContractAddress,
    packContractAddress,
    tournamentContractAddress,
  } = useTokenContracts()

  const contracts = useMemo(() => [
    bigintToHex(lordsContractAddress),
    bigintToHex(fameContractAddress),
    bigintToHex(foolsContractAddress),
    bigintToHex(duelistContractAddress),
    bigintToHex(packContractAddress),
    // bigintToHex(packContractAddress),        // not needed
    // bigintToHex(tournamentContractAddress),  // not implemented yet
  ], [lordsContractAddress, fameContractAddress, foolsContractAddress, duelistContractAddress, packContractAddress, packContractAddress, tournamentContractAddress])


  //----------------------------------------
  // reset store (network change)
  //
  // const { chainId } = useAccount()
  // useEffect(() => lords_state.resetStore(), [lordsContractAddress, chainId])
  // useEffect(() => fame_state.resetStore(), [fameContractAddress, chainId])
  // useEffect(() => fools_state.resetStore(), [foolsContractAddress, chainId])
  // useEffect(() => duelist_state.resetStore(), [duelistContractAddress, chainId])
  // useEffect(() => pack_state.resetStore(), [packContractAddress, chainId])
  // useEffect(() => duel_state.resetStore(), [duelContractAddress, chainId])
  // useEffect(() => tournament_state.resetStore(), [tournamentContractAddress, chainId])


  //----------------------------------------
  // get initial state
  //
  const mounted = useMounted()
  const { address } = useAccount()
  const accounts = useMemo(() => [address], [address])

  // cache player tokens
  useFetchAccountsBalances(foolsContractAddress, accounts, true)
  useFetchAccountsBalances(lordsContractAddress, accounts, true)

  useSdkTokenBalancesGet({
    contract: packContractAddress,
    accounts,
    setBalances: pack_state.setBalances,
    enabled: (mounted && isPositiveBigint(packContractAddress)),
  })

  // cache all duelists
  useSdkTokenBalancesGet({
    contract: duelistContractAddress,
    setBalances: duelist_state.setBalances,
    enabled: (mounted && isPositiveBigint(duelistContractAddress)),
  })

  // cache all FAME
  useSdkTokenBalancesGet({
    contract: fameContractAddress,
    setBalances: fame_state.setBalances,
    enabled: (mounted && isPositiveBigint(fameContractAddress)),
  })



  //----------------------------------------
  // subscribe for updates
  //
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      const _contract = bigintToHex(balance.contract_address)
      // debug.log("TOKENS SUB >>>", balance, token_contracts.includes(_contract), coin_contracts.includes(_contract))
      if (_contract == lordsContractAddress) {
        lords_state.updateBalance(balance)
      } else if (_contract == fameContractAddress) {
        fame_state.updateBalance(balance)
      } else if (_contract == foolsContractAddress) {
        fools_state.updateBalance(balance)
      } else if (_contract == duelistContractAddress) {
        duelist_state.updateBalance(balance)
      } else if (_contract == packContractAddress) {
        pack_state.updateBalance(balance)
      } else if (_contract == duelContractAddress) {
        duel_state.updateBalance(balance)
      } else if (_contract == tournamentContractAddress) {
        tournament_state.updateBalance(balance)
      }
    },
    enabled: (mounted),
  })

  // useEffect(() => debug.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => debug.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
