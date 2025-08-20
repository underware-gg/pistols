import { useEffect, useMemo } from 'react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useRingTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { useFameCoinStore, useLordsCoinStore, useFoolsCoinStore } from '/src/stores/coinStore'
import { useFetchInitialTokenBalancesQuery } from '/src/queries/useTokenBalancesQuery'
import { useProgressStore } from '/src/stores/progressStore'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { debug } from '@underware/pistols-sdk/pistols'
import * as torii from '@dojoengine/torii-client'


export function TokenStoreSync() {
  const updateProgress = useProgressStore((state) => state.updateProgress)

  // token stores
  const duelist_state = useDuelistTokenStore((state) => state)
  const duel_state = useDuelTokenStore((state) => state)
  const pack_state = usePackTokenStore((state) => state)
  const ring_state = useRingTokenStore((state) => state)
  const tournament_state = useTournamentTokenStore((state) => state)
  // coin stores
  const lords_state = useLordsCoinStore((state) => state)
  const fame_state = useFameCoinStore((state) => state)
  const fools_state = useFoolsCoinStore((state) => state)

  const { allTokens } = useTokenContracts()

  //----------------------------------------
  // reset store (network change)
  //
  // const { chainId } = useAccount()
  // useEffect(() => lords_state.resetStore(), [lordsContractAddress, chainId])
  // useEffect(() => fame_state.resetStore(), [fameContractAddress, chainId])
  // useEffect(() => fools_state.resetStore(), [foolsContractAddress, chainId])
  // useEffect(() => duelist_state.resetStore(), [duelistContractAddress, chainId])
  // useEffect(() => pack_state.resetStore(), [packContractAddress, chainId])
  // useEffect(() => ring_state.resetStore(), [ringContractAddress, chainId])
  // useEffect(() => duel_state.resetStore(), [duelContractAddress, chainId])
  // useEffect(() => tournament_state.resetStore(), [tournamentContractAddress, chainId])


  //----------------------------------------
  // get initial state
  //
  const { initialTokenBalances, isLoading, address } = useFetchInitialTokenBalancesQuery();

  useEffect(() => {
    if (address) {
      const pageNumber = (isLoading ? 0 : 1);
      const finished = !isLoading;
      updateProgress('token_balances', pageNumber, finished);
    }
  }, [address, isLoading])

  //----------------------------------------
  // subscribe for updates
  //
  const mounted = useMounted()
  const contracts = useMemo(() => Object.values(allTokens).map(bigintToHex), [allTokens])
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      const _contract = bigintToHex(balance.contract_address)
      // debug.log("TOKENS SUB >>>", balance, contracts.includes(_contract), contracts.includes(_contract))
      if (_contract == allTokens.lordsContractAddress) {
        lords_state.updateBalance(balance)
      } else if (_contract == allTokens.fameContractAddress) {
        fame_state.updateBalance(balance)
      } else if (_contract == allTokens.foolsContractAddress) {
        fools_state.updateBalance(balance)
      } else if (_contract == allTokens.duelistContractAddress) {
        duelist_state.updateBalance(balance)
      } else if (_contract == allTokens.packContractAddress) {
        pack_state.updateBalance(balance)
      } else if (_contract == allTokens.ringContractAddress) {
        ring_state.updateBalance(balance)
      } else if (_contract == allTokens.duelContractAddress) {
        duel_state.updateBalance(balance)
      } else if (_contract == allTokens.tournamentContractAddress) {
        tournament_state.updateBalance(balance)
      }
    },
    enabled: (mounted && initialTokenBalances?.length > 0),
  })

  // useEffect(() => debug.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => debug.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
