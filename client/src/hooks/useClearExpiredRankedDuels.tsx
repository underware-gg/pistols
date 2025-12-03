import { useEffect, useMemo, useRef } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useCallToChallenges } from '/src/stores/eventsModelStore'
import { useCurrentSeason } from '/src/stores/seasonStore'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { bigintEquals } from '@underware/pistols-sdk/utils'
import { keysToEntityId } from '@underware/pistols-sdk/dojo'
import { getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const useClearExpiredRankedDuels = (duelIds: BigNumberish[]) => {
  const { account, address } = useAccount()
  const { game } = useDojoSystemCalls()
  
  const { requiredDuelIds } = useCallToChallenges()
  const { seasonId: currentSeasonId } = useCurrentSeason()
  
  const entities = useChallengeStore((state) => state.entities)
  
  const clearedDuelIdsRef = useRef<Set<string>>(new Set())

  const duelsToClear = useMemo(() => {
    if (!account || !game || !address || duelIds.length === 0) {
      return []
    }

    const toClear: bigint[] = []

    duelIds.forEach((duelId) => {
      const duelIdStr = duelId.toString()
      const duelIdBigInt = BigInt(duelId)
      
      if (clearedDuelIdsRef.current.has(duelIdStr)) {
        return
      }

      const entityId = keysToEntityId([duelId])
      const entity = entities[entityId]
      const challenge = entity ? getEntityModel<models.Challenge>(entity, 'Challenge') : undefined
      
      if (!challenge) {
        return
      }

      const duelistAddressA = BigInt(challenge.address_a ?? 0)
      const duelistAddressB = BigInt(challenge.address_b ?? 0)
      const isYouA = bigintEquals(address, duelistAddressA)
      const isYouB = bigintEquals(address, duelistAddressB)
      
      if (!isYouA && !isYouB) {
        return
      }

      const isCallToAction = requiredDuelIds.includes(duelIdBigInt)
      if (!isCallToAction) {
        return
      }

      const duelType = parseEnumVariant<constants.DuelType>(challenge.duel_type)
      if (duelType !== constants.DuelType.Ranked) {
        return
      }

      const state = parseEnumVariant<constants.ChallengeState>(challenge.state)
      const isFinished = state == constants.ChallengeState.Resolved || state == constants.ChallengeState.Draw || state == constants.ChallengeState.Expired
      if (!isFinished) {
        return
      }

      const seasonId = Number(challenge.season_id ?? 0)
      const isSeasonExpired = seasonId > 0 && currentSeasonId > 0 && seasonId !== currentSeasonId

      if (isSeasonExpired) {
        toClear.push(duelIdBigInt)
      }
    })

    return toClear
  }, [duelIds, account, game, address, entities, requiredDuelIds, currentSeasonId])

  useEffect(() => {
    if (duelsToClear.length === 0 || !account || !game) {
      return
    }

    const processDuelsSequentially = async () => {
      for (const duelId of duelsToClear) {
        const duelIdStr = duelId.toString()
        
        if (clearedDuelIdsRef.current.has(duelIdStr)) {
          continue
        }

        clearedDuelIdsRef.current.add(duelIdStr)

        try {
          await game.clear_call_to_challenge(account, duelId)
        } catch (error) {
          console.error(`Failed to clear call to action for duel ${duelId}:`, error)
          clearedDuelIdsRef.current.delete(duelIdStr)
        }
      }
    }

    processDuelsSequentially()
  }, [duelsToClear, account, game])
}

