import { useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { useMemoGate, useMounted } from '@underware/pistols-sdk/utils/hooks'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useConfig } from '/src/stores/configStore'

const _limit = 1000

//------------------------------------------------------
// Sync everything that depends on current season
// !!! Add only once to a top level component !!!
//
export function ChallengeStoreSync() {
  const { currentSeasonId } = useConfig()
  const query = useMemoGate<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().compose().or([
          // Current season
          new PistolsClauseBuilder().where(
            "pistols-Challenge",
            "season_id",
            "Eq", currentSeasonId
          ),
          // Unfinished challenges
          new PistolsClauseBuilder().where(
            "pistols-Challenge",
            "season_id",
            "Eq", 0
          ),
        ]).build()
      )
      .withEntityModels([
        'pistols-Challenge',
        'pistols-ChallengeMessage',
        'pistols-Round',
      ])
      .withLimit(_limit)
      .includeHashedKeys()
  ), [currentSeasonId])

  const challengeState = useChallengeStore((state) => state)
  const queryState = useChallengeQueryStore((state) => state)

  const mounted = useMounted()

  useSdkEntitiesGet({
    query,
    enabled: mounted,
    resetStore: () => {
      console.log("ChallengeStoreSync() RESET =======>")
      challengeState.resetStore()
      queryState.resetStore()
    },
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
