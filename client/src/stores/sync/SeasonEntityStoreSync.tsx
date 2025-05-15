import { formatQueryValue, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { useMemoGate, useMounted } from '@underware/pistols-sdk/utils/hooks'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useConfig } from '/src/stores/configStore'
import { useScoreboardStore } from '../scoreboardStore'

const _limit = 1000

//------------------------------------------------------
// Sync everything that depends on current season
// !!! Add only once to a top level component !!!
//
export function SeasonChallengeStoreSync() {
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
      console.log("SeasonEntityStoreSync() RESET =======>")
      challengeState.resetStore()
      queryState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      console.log("SeasonEntityStoreSync() SET =======> [entity]:", entities)
      challengeState.setEntities(entities)
      queryState.setEntities(entities)
    },
  })

  // useEffect(() => console.log(`SeasonEntityStoreSync() [${Object.keys(challengeState.entities).length}] =>`, challengeState.entities), [challengeState.entities])

  return (<></>)
}


export function SeasonScoreboardStoreSync() {
  const { currentSeasonId } = useConfig()
  const query = useMemoGate<PistolsQueryBuilder>(() => (
    new PistolsQueryBuilder()
      .withClause(
        new PistolsClauseBuilder().keys(
          ["pistols-SeasonScoreboard"],
          [formatQueryValue(currentSeasonId), undefined]
        ).build()
      )
      .withEntityModels([
        'pistols-SeasonScoreboard',
      ])
      .withLimit(_limit)
      .includeHashedKeys()
  ), [currentSeasonId])

  const scoreboardState = useScoreboardStore((state) => state)

  const mounted = useMounted()

  useSdkEntitiesGet({
    query,
    enabled: mounted,
    resetStore: () => {
      console.log("SeasonScoreboardStoreSync() RESET =======>")
      scoreboardState.resetStore()
      scoreboardState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      console.log("SeasonScoreboardStoreSync() SET =======> [entity]:", entities)
      scoreboardState.setEntities(entities)
      scoreboardState.setEntities(entities)
    },
  })

  // useEffect(() => console.log(`SeasonScoreboardStoreSync() [${Object.keys(challengeState.entities).length}] =>`, challengeState.entities), [challengeState.entities])

  return (<></>)
}
