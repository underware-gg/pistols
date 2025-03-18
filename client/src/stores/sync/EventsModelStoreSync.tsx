import { useEffect, useMemo } from 'react'
import { formatQueryValue, getEntityModel, useDojoSetup, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useEventsStore } from '/src/stores/eventsStore'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import * as torii from '@dojoengine/torii-client'


// Sync entities: Add only once to a top level component
export function EventsModelStoreSync() {
  const eventsState = useEventsStore((state) => state)
  const mounted = useMounted()

  const { duelistIds } = useDuelistsOfPlayer()

  // const query = useMemo<PistolsQueryBuilder>(() => ({
  //   pistols: {
  //     PlayerRequiredAction: {
  //       $: {
  //         where: {
  //           duelist_id: { $in: duelistIds.map(id => formatQueryValue(id)) }
  //         },
  //       },
  //     },
  //   },
  // }), [duelistIds])
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().where(
          "pistols-PlayerRequiredAction",
          "duelist_id",
          "In", duelistIds.map(id => formatQueryValue(id))
        ).build()
      )
      .withLimit(50)
      .withEntityModels([
        "pistols-PlayerRequiredAction",
      ])
      .includeHashedKeys()
  ), [duelistIds])

  useSdkEventsSub({
    query,
    enabled: (mounted && duelistIds.length > 0),
    setEntities: (entities: PistolsEntity[]) => {
      // console.log(`GET PlayerRequiredAction() ======>`, entities)
      eventsState.setEntities(entities)
    },
    updateEntity: (entity: PistolsEntity) => {
      // console.log(`SUB PlayerRequiredAction() ======>`, entity)
      const requiresAction = getEntityModel(entity, 'PlayerRequiredAction')
      // console.log(`SUB PlayerRequiredAction() ======> model:`, requiresAction, duelistIds.includes(BigInt(requiresAction.duelist_id)))
      if (requiresAction) {
        if (duelistIds.includes(BigInt(requiresAction.duelist_id))) {
          eventsState.updateEntity(entity)
        }
      }
    },
    historical: false, // historical events
  })

  // // TESTING raw events from client
  // const { sdk } = useDojoSetup()
  // const clause_non_historical: torii.Clause = {
  //   Keys: {
  //     // keys: ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //     keys: [undefined],
  //     models: ["pistols-PlayerRequiredAction"],
  //     pattern_matching: "FixedLen",
  //   },
  // }
  // useEffect(() => {
  //   // based on:
  //   // https://github.com/cartridge-gg/dopewars/blob/4e52b86c4788beb06d259533aebe5fe5c3b871e3/web/src/dojo/hooks/useGamesByPlayer.tsx#L74
  //   const _fetch = async () => {
  //     const events = await sdk.client.getEventMessages(
  //       {
  //         clause: clause_non_historical,
  //         limit: 100,
  //         offset: 0,
  //         dont_include_hashed_keys: true,
  //         order_by: [],
  //         entity_models: ["pistols-PlayerRequiredAction"],
  //         entity_updated_after: 0,
  //       },
  //       false, // historical
  //     );
  //     console.log("sdk.client.GET_EVENTS(false) =>", events)
  //   }
  //   if (sdk) _fetch()
  // }, [sdk])

  // useEffect(() => console.log("EventsModelStoreSync() =>", eventsState.entities), [eventsState.entities])

  return (<></>)
}
