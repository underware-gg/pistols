import { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { entityContainsModels, filterEntitiesByModels, formatQueryValue, getEntityModel, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useEventsStore } from '/src/stores/eventsModelStore'
import { usePlayerDataStore } from '/src/stores/playerStore'
import { useProgressStore } from '/src/stores/progressStore'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { debug } from '@underware/pistols-sdk/pistols'


// Sync entities: Add only once to a top level component
export function EventsModelStoreSync() {
  const eventsState = useEventsStore((state) => state)
  const playerDataState = usePlayerDataStore((state) => state)
  const updateProgress = useProgressStore((state) => state.updateProgress)

  const { address } = useAccount()
  const mounted = useMounted()

  const query = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(address)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            [
              'pistols-CallToActionEvent',
              'pistols-PlayerBookmarkEvent',
              'pistols-PlayerSocialLinkEvent',
            ],
            // VariableLen means: must have at least the address key...
            [formatQueryValue(address)],
            "VariableLen"
          ).build()
        )
        .withEntityModels([
          'pistols-CallToActionEvent',
          'pistols-PlayerBookmarkEvent',
          'pistols-PlayerSocialLinkEvent',
        ])
        .includeHashedKeys()
      : undefined
  ), [address])

  useSdkEventsSub({
    query,
    enabled: (mounted && Boolean(query)),
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('get_events', currentPage, finished)
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`GET EventsModelStoreSync() ======>`, entities)
      eventsState.setEntities(filterEntitiesByModels(entities, ['CallToActionEvent', 'PlayerSocialLinkEvent']))
      playerDataState.updateMessages(filterEntitiesByModels(entities, ['PlayerBookmarkEvent']))
    },
    updateEntity: (entity: PistolsEntity) => {
      debug.log(`SUB EventsModelStoreSync() ======>`, entity)
      const model =
        getEntityModel(entity, 'CallToActionEvent') ??
        getEntityModel(entity, 'PlayerBookmarkEvent') ??
        getEntityModel(entity, 'PlayerSocialLinkEvent');
      if (model && bigintEquals(model.player_address, address)) {
        debug.log(`SUB EventsModelStoreSync() ======> model:`, entity)
        if (entityContainsModels(entity, ['CallToActionEvent', 'PlayerSocialLinkEvent'])) {
          eventsState.updateEntity(entity)
        }
        if (entityContainsModels(entity, ['PlayerBookmarkEvent'])) {
          playerDataState.updateMessages([entity])
        }
      }
    },
  })

  // useEffect(() => debug.log("EventsModelStoreSync() =>", eventsState.entities), [eventsState.entities])

  return (<></>)
}
