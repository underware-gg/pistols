import { useEffect, useMemo, useState } from 'react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDojoSetup, useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useRingTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { useFameCoinStore, useLordsCoinStore, useFoolsCoinStore } from '/src/stores/coinStore'
import { useFetchInitialTokenBalancesQuery } from '/src/queries/useTokenBalancesQuery'
import { useProgressStore } from '/src/stores/progressStore'
import { bigintToAddress } from '@underware/pistols-sdk/utils'
import { cachedPlayerData } from '@underware/pistols-sdk/pistols/cached'
import { NetworkId } from '@underware/pistols-sdk/pistols/config'
import { debug } from '@underware/pistols-sdk/pistols'
import * as torii from '@dojoengine/torii-client'


export function TokenStoreSync() {
  const updateProgress = useProgressStore((state) => state.updateProgress)

  // token stores
  const addCachedDuelistTokens = useDuelistTokenStore((state) => state.addCachedPlayerTokens)
  const addCachedRingTokens = useRingTokenStore((state) => state.addCachedPlayerTokens)
  const updateDuelistBalance = useDuelistTokenStore((state) => state.updateBalance)
  const updateDuelBalance = useDuelTokenStore((state) => state.updateBalance)
  const updatePackBalance = usePackTokenStore((state) => state.updateBalance)
  const updateRingBalance = useRingTokenStore((state) => state.updateBalance)
  const updateTournamentBalance = useTournamentTokenStore((state) => state.updateBalance)
  // coin stores
  const updateLordsBalance = useLordsCoinStore((state) => state.updateBalance)
  const updateFameBalance = useFameCoinStore((state) => state.updateBalance)
  const updateFoolsBalance = useFoolsCoinStore((state) => state.updateBalance)

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
  // get cacehd state
  //
  const mounted = useMounted()
  const { selectedNetworkId } = useDojoSetup()
  const [last_iso_timestamp, setLastIsoTimestamp] = useState<string>();
  useEffect(() => {
    if (mounted && selectedNetworkId) {
      if (selectedNetworkId == NetworkId.MAINNET) {
        // load cached players on mainnet only
        let iso_timestamp = '';
        Object.keys(cachedPlayerData).forEach(player_address => {
          const playerData = cachedPlayerData[player_address];
          addCachedDuelistTokens(player_address, playerData.duelist_ids);
          addCachedRingTokens(player_address, playerData.ring_ids);
          if (playerData.iso_timestamp > iso_timestamp) {
            iso_timestamp = playerData.iso_timestamp;
          }
        })
        setLastIsoTimestamp(iso_timestamp)
      } else {
        // not mainnet...
        setLastIsoTimestamp('0000-00-00')
      }
    }
  }, [addCachedDuelistTokens, addCachedRingTokens, mounted, selectedNetworkId])


  //----------------------------------------
  // get initial state
  //
  const { initialTokenBalances, isLoading, address } = useFetchInitialTokenBalancesQuery(last_iso_timestamp);

  useEffect(() => {
    if (address && isLoading !== undefined) {
      const pageNumber = (isLoading ? 0 : 1);
      const finished = (isLoading === false);
      updateProgress('token_balances', pageNumber, finished);
    }
  }, [address, isLoading, updateProgress])

  //----------------------------------------
  // subscribe for updates
  //
  const contracts = useMemo(() => Object.values(allTokens).map(bigintToAddress), [allTokens])
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      const _contract = bigintToAddress(balance.contract_address)
      // debug.log("TOKENS SUB >>>", balance, contracts.includes(_contract), contracts.includes(_contract))
      if (_contract == allTokens.lordsContractAddress) {
        updateLordsBalance(balance)
      } else if (_contract == allTokens.fameContractAddress) {
        updateFameBalance(balance)
      } else if (_contract == allTokens.foolsContractAddress) {
        updateFoolsBalance(balance)
      } else if (_contract == allTokens.duelistContractAddress) {
        updateDuelistBalance(balance)
      } else if (_contract == allTokens.packContractAddress) {
        updatePackBalance(balance)
      } else if (_contract == allTokens.ringContractAddress) {
        updateRingBalance(balance)
      } else if (_contract == allTokens.duelContractAddress) {
        updateDuelBalance(balance)
      } else if (_contract == allTokens.tournamentContractAddress) {
        updateTournamentBalance(balance)
      }
    },
    enabled: (mounted && initialTokenBalances?.length > 0),
  })

  // useEffect(() => debug.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => debug.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
