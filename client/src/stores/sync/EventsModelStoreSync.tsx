import { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { formatQueryValue, getEntityModel, useSdkEventsSub } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useEventsStore } from '../eventsModelStore'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
// import * as torii from '@dojoengine/torii-client'


// Sync entities: Add only once to a top level component
export function EventsModelStoreSync() {
  const eventsState = useEventsStore((state) => state)
  const mounted = useMounted()

  const { address } = useAccount()

  const query = useMemo<PistolsQueryBuilder>(() => (
    isPositiveBigint(address)
      ? new PistolsQueryBuilder()
        .withClause(
          new PistolsClauseBuilder().keys(
            ['pistols-CallToActionEvent'],
            [formatQueryValue(address), undefined],
          ).build()
        )
        .withEntityModels([
          'pistols-CallToActionEvent',
        ])
        .includeHashedKeys()
      : undefined
  ), [address])

  useSdkEventsSub({
    query,
    enabled: (mounted && Boolean(query)),
    setEntities: (entities: PistolsEntity[]) => {
      // console.log(`GET CallToActionEvent() ======>`, entities)
      eventsState.setEntities(entities)
    },
    updateEntity: (entity: PistolsEntity) => {
      // console.log(`SUB CallToActionEvent() ======>`, entity)
      const model = getEntityModel(entity, 'CallToActionEvent')
      if (bigintEquals(model?.player_address, address)) {
        // console.log(`SUB CallToActionEvent() ======> model:`, getEntityModel(entity, 'CallToActionEvent'))
        eventsState.updateEntity(entity)
      }
    },
  })

  // // TESTING raw events from client
  // const { sdk } = useDojoSetup()
  // const clause_non_historical: torii.Clause = {
  //   Keys: {
  //     // keys: ['0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7'],
  //     keys: [undefined],
  //     models: ["pistols-CallToActionEvent"],
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
  //         entity_models: ["pistols-CallToActionEvent"],
  //         entity_updated_after: 0,
  //       },
  //       false, // historical
  //     );
  //     console.log("sdk.client.GET_EVENTS(false) =>", events)
  //   }
  //   if (sdk) _fetch()
  // }, [sdk])

  useEffect(() => console.log("EventsModelStoreSync() =>", eventsState.entities), [eventsState.entities])

  return (<></>)
}
