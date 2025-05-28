import { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { entityContainsModels, filterEntitiesByModels, formatQueryValue, getEntityModel, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useEventsStore } from '/src/stores/eventsModelStore'
import { usePlayerDataStore } from '/src/stores/playerStore'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { debug } from '@underware/pistols-sdk/pistols'


// Sync entities: Add only once to a top level component
export function EventsModelStoreSync() {
  const eventsState = useEventsStore((state) => state)
  const playerDataState = usePlayerDataStore((state) => state)
  const mounted = useMounted()

  const { address } = useAccount()

  const query = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(address)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().compose().or([
            new PistolsClauseBuilder().where(
              "pistols-CallToActionEvent", "player_address", "Eq", address,
            ),
            new PistolsClauseBuilder().where(
              "pistols-PlayerSocialLinkEvent", "player_address", "Eq", address,
            ),
            new PistolsClauseBuilder().where(
              "pistols-PlayerBookmarkEvent", "player_address", "Eq", address,
            ),
          ]).build()
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
    setEntities: (entities: PistolsEntity[]) => {
      debug.log(`GET EventsModelStoreSync() ======>`, entities)
      eventsState.setEntities(entities)
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
        eventsState.updateEntity(entity)
        if (entityContainsModels(entity, ['PlayerBookmarkEvent'])) {
          playerDataState.updateMessages([entity])
        }
      }
    },
  })

  useEffect(() => debug.log("EventsModelStoreSync() =>", eventsState.entities), [eventsState.entities])

  return (<></>)
}
