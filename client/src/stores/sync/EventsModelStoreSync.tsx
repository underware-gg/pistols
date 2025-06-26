import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder, entityContainsModels, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { filterEntitiesByModels, formatQueryValue, useSdkEventsGet, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useEventsStore } from '/src/stores/eventsModelStore'
import { usePlayerDataStore } from '/src/stores/playerStore'
import { useChallengeRewardsStore } from '/src/stores/challengeRewardsStore'
import { useProgressStore } from '/src/stores/progressStore'
import { bigintEquals, bigintToAddress, bigintToHex, isPositiveBigint } from '@underware/pistols-sdk/utils'
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
  const query_get_player = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(address)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            [
              'pistols-CallToChallengeEvent',
              'pistols-PlayerSettingEvent',
              'pistols-PlayerBookmarkEvent',
            ],
            // VariableLen means: must have at least the address key...
            [formatQueryValue(address)],
            "VariableLen"
          ).build()
        )
        .withEntityModels([
          'pistols-CallToChallengeEvent',
          'pistols-PlayerSettingEvent',
          'pistols-PlayerBookmarkEvent',
        ])
        .withLimit(1000)
        .includeHashedKeys()
      : undefined
  ), [address])

  // get for all players
  const query_get_all = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().keys(
          // get everyone's social links
          ['pistols-PlayerSocialLinkEvent'],
          [undefined],
          "VariableLen"
        ).build()
      )
      .withEntityModels([
        'pistols-PlayerSocialLinkEvent',
      ])
      .withLimit(1000)
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
                'pistols-PlayerSettingEvent',
                'pistols-PlayerBookmarkEvent',
              ],
              // get only current player's events
              [formatQueryValue(address)],
              // VariableLen means: must have at least one key
              "VariableLen"
            ),
            new PistolsClauseBuilder().keys(
              [
                'pistols-ChallengeRewardsEvent',
                'pistols-PlayerSocialLinkEvent',
              ],
              // get it all
              [undefined],
              "VariableLen"
            ),
          ]).build()
        )
        .withEntityModels([
          'pistols-CallToChallengeEvent',
          'pistols-PlayerSettingEvent',
          'pistols-PlayerBookmarkEvent',
          'pistols-PlayerSocialLinkEvent',
          'pistols-ChallengeRewardsEvent',
        ])
        .withLimit(1) // discard...
        .includeHashedKeys()
      : undefined
  ), [address])


  //
  // Initial fetch
  //
  useSdkEventsGet({
    query: query_get_player,
    enabled: (mounted && Boolean(query_get_player)),
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('events_get_player', currentPage, finished)
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`GET EventsModelStoreSync() ======> [Player]`, entities)
      eventsState.setEntities(filterEntitiesByModels(entities, ['CallToChallengeEvent', 'PlayerSettingEvent']))
      playerDataState.updateMessages(filterEntitiesByModels(entities, ['PlayerBookmarkEvent']))
    },
  })
  useSdkEventsGet({
    query: query_get_all,
    enabled: (mounted && Boolean(query_get_all)),
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('events_get_all', currentPage, finished)
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`GET EventsModelStoreSync() ======> [PlayerSocialLinkEvent]`, entities)
      eventsState.setEntities(entities)
    },
  })

  const _filterPlayerEvents = (entities: PistolsEntity[]): PistolsEntity[] => {
    return entities.filter((entity) => {
      const playerEvent =
        getEntityModel(entity, 'CallToChallengeEvent') ??
        getEntityModel(entity, 'PlayerBookmarkEvent') ??
        getEntityModel(entity, 'PlayerSettingEvent');
      if (playerEvent && bigintEquals(playerEvent.player_address, address)) {
        return true;
      }
      return false;
    })
  }

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
      // debug.log(`SUB EventsModelStoreSync() ======> [player] DICARD`, entities)
    },
    updateEntity: (entity: PistolsEntity) => {
      debug.log(`SUB EventsModelStoreSync() ======> []`, entity)
      // player-based events
      const playerEvents = _filterPlayerEvents([entity])
      if (playerEvents.length > 0) {
        debug.log(`SUB EventsModelStoreSync() ======> [player]`, playerEvents)
        if (entityContainsModels(playerEvents[0], ['CallToChallengeEvent', 'PlayerSettingEvent'])) {
          eventsState.updateEntity(playerEvents[0])
        }
        if (entityContainsModels(playerEvents[0], ['PlayerBookmarkEvent'])) {
          playerDataState.updateMessages(playerEvents)
        }
      }
      // other events
      if (entityContainsModels(entity, ['PlayerSocialLinkEvent'])) {
        eventsState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['ChallengeRewardsEvent'])) {
        challengeRewardsState.updateEntity(entity)
      }
    },
  })

  // useEffect(() => debug.log("EventsModelStoreSync() =>", eventsState.entities), [eventsState.entities])

  return (<></>)
}
