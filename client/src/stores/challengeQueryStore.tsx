import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useCallToActions } from './eventsModelStore'
import { usePlayer, getPlayerName } from '/src/stores/playerStore'
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore'
import { PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { keysToEntityId, getEntityModel, useAllStoreModels } from '@underware/pistols-sdk/dojo'
import { useChallengeStore } from '/src/stores/challengeStore'


//--------------------------------
// SQL query hooks
// use SQL to find Duel IDs and add to challengeStore
//





/**
 * Returns all active duels for the current user's address, including both required duels
 * and duels that have notifications
 * @param notificationDuelIds Array of duel IDs from notifications to track
 * @returns Array of duel IDs with their states
 */
export function useMyActiveDuels(notificationDuelIds: bigint[] = []) {
  // const { address } = useAccount()
  // const { requiredDuelIds } = useCallToActions()
  // const { duelPerDuelist } = useCallToActions()

  // const entities = useChallengeFetchStore((state) => state.entities)

  // const result = useMemo(() => {
  //   if (!address) return []

  //   // Get all duel IDs we need to track (both required and from notifications)
  //   const allRelevantDuelIds = new Set([...requiredDuelIds, ...notificationDuelIds])

  //   return Object.values(entities)
  //     .filter((e) => (
  //       bigintEquals(e.address_a, address) || 
  //       bigintEquals(e.address_b, address)
  //     ))
  //     .filter(e => allRelevantDuelIds.has(e.duel_id))
  //     .map(e => {
  //       const callToAction = Object.values(duelPerDuelist).find(duel2 => duel2.duelId === e.duel_id)?.callToAction ?? false

  //       return { 
  //         duel_id: e.duel_id,
  //         timestamp: e.timestamp,
  //         state: e.state,
  //         callToAction
  //       }
  //     })

  // }, [entities, address, duelPerDuelist, requiredDuelIds, notificationDuelIds])

  // return result
  return []
}


