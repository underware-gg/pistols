import { useMemo } from 'react'
import { useTableId } from '/src/stores/configStore'
import { formatQueryValue, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { stringToFelt } from '@underware/pistols-sdk/utils'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { useChallengeStore } from '/src/stores/challengeStore'


//------------------------------------------------------
// Sync everything that depends on current season
// !!! Add only once to a top level component !!!
//
export function ChallengeStoreSync() {
  const { tableId } = useTableId()
  // const query_get = useMemo<PistolsQueryBuilder>(() => ({
  //   pistols: {
  //     Challenge: {
  //       $: {
  //         where: {
  //           table_id: { $eq: formatQueryValue(stringToFelt(tableId)) },
  //         },
  //       },
  //     },
  //   },
  // }), [tableId])
  const query = useMemo<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().where(
          "pistols-Challenge",
          "table_id",
          "Eq", formatQueryValue(stringToFelt(tableId)),
        ).build()
      )
      .withEntityModels([
        'pistols-Challenge',
        "pistols-Round",
      ])
      .includeHashedKeys()
  ), [tableId])

  const challengeState = useChallengeStore((state) => state)
  const queryState = useChallengeQueryStore((state) => state)

  const mounted = useMounted()

  useSdkEntitiesGet({
    query,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      console.log("ChallengeStoreSync() SET =======> [entity]:", entities)
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
