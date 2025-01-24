import { useEffect, useMemo } from 'react'
import { useTableId } from '/src/stores/configStore'
import { formatQueryValue, useSdkEntities } from '@underware_gg/pistols-sdk/dojo'
import { useMounted, stringToFelt } from '@underware_gg/pistols-sdk/utils'
import { PistolsGetQuery, PistolsSubQuery, PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { useChallengeStore } from '/src/stores/challengeStore'


//------------------------------------------------------
// Sync everything that depends on current season
// !!! Add only once to a top level component !!!
//
export function ChallengeStoreSync() {
  const { tableId } = useTableId()
  const query_get = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: { $eq: formatQueryValue(stringToFelt(tableId)) },
          },
        },
      },
    },
  }), [tableId])
  // const query_sub = useMemo<PistolsSubQuery>(() => ({
  //   pistols: {
  //     Challenge: {
  //       $: {
  //         where: {
  //           table_id: { $is: formatQueryValue(stringToFelt(tableId)) },
  //         },
  //       },
  //     },
  //   },
  // }), [tableId])

  const challengeState = useChallengeStore((state) => state)
  const queryState = useChallengeQueryStore((state) => state)

  const mounted = useMounted()

  useSdkEntities({
    query_get,
    // query_sub,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      // console.log("ChallengeStoreSync() SET =======> [entities]:", entities)
      challengeState.setEntities(entities)
      queryState.setEntities(entities)
    },
    // updateEntity: (entity: PistolsEntity) => {
    //   console.log("ChallengeStoreSync() UPDATE =======> [entity]:", entity)
    //   challengeState.updateEntity(entity)
    //   queryState.updateEntity(entity)
    // },
  })

  // useEffect(() => console.log(`ChallengeStoreSync() [${Object.keys(challengeState.entities).length}] =>`, challengeState.entities), [challengeState.entities])

  return (<></>)
}
