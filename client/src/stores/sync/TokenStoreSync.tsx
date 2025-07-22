import { useEffect, useMemo } from 'react'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useSdkTokenBalancesSub } from '@underware/pistols-sdk/dojo'
import { useDuelistTokenStore, useDuelTokenStore, usePackTokenStore, useRingTokenStore, useTournamentTokenStore } from '/src/stores/tokenStore'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { useFameCoinStore, useLordsCoinStore, useFoolsCoinStore } from '/src/stores/coinStore'
import { useTokenBalancesQuery } from '/src/queries/useTokenBalancesQuery'
import { useProgressStore } from '/src/stores/progressStore'
import * as torii from '@dojoengine/torii-client'
import { debug } from '@underware/pistols-sdk/pistols'


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
  const { initialTokenBalances } = useTokenBalancesQuery();

  useEffect(() => {
    const pageNumber = (initialTokenBalances.length == 0 ? 0 : 1)
    updateProgress('token_balances', pageNumber, pageNumber > 0)
    initialTokenBalances.forEach(balance => {
      const toriiBalance: torii.TokenBalance = {
        contract_address: bigintToHex(balance.contractAddress),
        account_address: bigintToHex(balance.accountAddress),
        balance: bigintToHex(balance.balance),
        token_id: bigintToHex(balance.tokenId),
      }
      if (toriiBalance.contract_address === allTokens.lordsContractAddress) {
        lords_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address === allTokens.fameContractAddress) {
        fame_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address == allTokens.foolsContractAddress) {
        fools_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address == allTokens.duelistContractAddress) {
        duelist_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address == allTokens.packContractAddress) {
        pack_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address == allTokens.ringContractAddress) {
        ring_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address == allTokens.duelContractAddress) {
        duel_state.updateBalance(toriiBalance)
      } else if (toriiBalance.contract_address == allTokens.tournamentContractAddress) {
        tournament_state.updateBalance(toriiBalance)
      }
    })
  }, [initialTokenBalances])

  //----------------------------------------
  // subscribe for updates
  //
  const mounted = useMounted()
  const contracts = useMemo(() => Object.values(allTokens).map(bigintToHex), [allTokens])
  useSdkTokenBalancesSub({
    contracts,
    updateBalance: (balance: torii.TokenBalance) => {
      const _contract = bigintToHex(balance.contract_address)
      // debug.log("TOKENS SUB >>>", balance, token_contracts.includes(_contract), coin_contracts.includes(_contract))
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
    enabled: (mounted && initialTokenBalances.length > 0),
  })

  // useEffect(() => debug.log("TokenStoreSync() token_state =>", token_state.contracts), [token_state.contracts])
  // useEffect(() => debug.log("TokenStoreSync() coin_state =>", coin_state.contracts), [coin_state.contracts])
  return (<></>)
}
