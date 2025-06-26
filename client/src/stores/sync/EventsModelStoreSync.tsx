import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder, entityContainsModels, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { filterEntitiesByModels, formatQueryValue, useSdkEventsGet, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useEventsStore } from '/src/stores/eventsModelStore'
import { usePlayerDataStore } from '/src/stores/playerStore'
import { useChallengeRewardsStore } from '/src/stores/challengeRewardsStore'
import { useProgressStore } from '/src/stores/progressStore'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { debug } from '@underware/pistols-sdk/pistols'


// Sync entities: Add only once to a top level component
export function EventsModelStoreSync() {
  const eventsState = useEventsStore((state) => state)
  const playerDataState = usePlayerDataStore((state) => state)
  const challengeRewardsState = useChallengeRewardsStore((state) => state)
  const updateProgress = useProgressStore((state) => state.updateProgress)

  const { address } = useAccount()
  const mounted = useMounted()

  // get for all players
  const query_get = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withEntityModels([
        'pistols-PlayerSocialLinkEvent',
      ])
      .includeHashedKeys()
  ), [])

  // get for current player only
  const query_sub = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(address)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().compose().or([
            new PistolsClauseBuilder().keys(
              [
                'pistols-CallToChallengeEvent',
                'pistols-PlayerBookmarkEvent',
                'pistols-PlayerSocialLinkEvent',
                'pistols-PlayerSettingEvent',
              ],
              // VariableLen means: must have at least the address key...
              [formatQueryValue(address)],
              "VariableLen"
            ),
            new PistolsClauseBuilder().keys(
              [
                'pistols-ChallengeRewardsEvent',
              ],
              [undefined],
              "VariableLen"
            ),
          ]).build()
        )
        .withEntityModels([
          'pistols-CallToChallengeEvent',
          'pistols-PlayerBookmarkEvent',
          'pistols-PlayerSocialLinkEvent',
          'pistols-PlayerSettingEvent',
          'pistols-ChallengeRewardsEvent',
        ])
        .includeHashedKeys()
      : undefined
  ), [address])


  //
  // Initial fetch
  //
  useSdkEventsGet({
    query: query_get,
    enabled: (mounted && Boolean(query_get)),
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('events_get', currentPage, finished)
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`GET EventsModelStoreSync() ======> [PlayerSocialLinkEvent]`, entities)
      eventsState.setEntities(filterEntitiesByModels(entities, ['PlayerSocialLinkEvent']))
    },
  })

  //
  // Subscription
  //
  useSdkEventsSub({
    query: query_sub,
    enabled: (mounted && Boolean(query_sub)),
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('events_sub', currentPage, finished)
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`GET EventsModelStoreSync() ======> [player]`, entities)
      eventsState.setEntities(filterEntitiesByModels(entities, ['CallToChallengeEvent', 'PlayerSocialLinkEvent', 'PlayerSettingEvent']))
      playerDataState.updateMessages(filterEntitiesByModels(entities, ['PlayerBookmarkEvent']))
    },
    updateEntity: (entity: PistolsEntity) => {
      debug.log(`SUB EventsModelStoreSync() ======> [player]`, entity)
      // player-based events
      const playerEvent =
        getEntityModel(entity, 'CallToChallengeEvent') ??
        getEntityModel(entity, 'PlayerBookmarkEvent') ??
        getEntityModel(entity, 'PlayerSocialLinkEvent') ??
        getEntityModel(entity, 'PlayerSettingEvent');
      if (playerEvent && bigintEquals(playerEvent.player_address, address)) {
        debug.log(`SUB EventsModelStoreSync() ======> model:`, entity)
        if (entityContainsModels(entity, ['CallToChallengeEvent', 'PlayerSocialLinkEvent', 'PlayerSettingEvent'])) {
          eventsState.updateEntity(entity)
        }
        if (entityContainsModels(entity, ['PlayerBookmarkEvent'])) {
          playerDataState.updateMessages([entity])
        }
      }
      // other events
      if (entityContainsModels(entity, ['ChallengeRewardsEvent'])) {
        challengeRewardsState.updateEntity(entity)
      }
    },
  })

  // useEffect(() => debug.log("EventsModelStoreSync() =>", eventsState.entities), [eventsState.entities])

  return (<></>)
}
