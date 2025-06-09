import { formatQueryValue, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { useMemoGate, useMounted } from '@underware/pistols-sdk/utils/hooks'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols/sdk'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useChallengeFetchStore } from '/src/stores/fetchStore'
import { useConfig } from '/src/stores/configStore'
import { useGetSeasonScoreboard, useScoreboardStore } from '/src/stores/scoreboardStore'
import { useProgressStore } from '/src/stores/progressStore'
import { debug } from '@underware/pistols-sdk/pistols'

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
  const fetchState = useChallengeFetchStore((state) => state)
  const updateProgress = useProgressStore((state) => state.updateProgress)

  const mounted = useMounted()

  useSdkEntitiesGet({
    query,
    enabled: mounted,
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('season_challenges', currentPage, finished)
    },
    resetStore: () => {
      debug.log("SeasonEntityStoreSync() RESET =======>")
      challengeState.resetStore()
      fetchState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log("SeasonEntityStoreSync() SET =======> [entity]:", entities)
      challengeState.setEntities(entities)
    },
  })

  // useEffect(() => debug.log(`SeasonEntityStoreSync() [${Object.keys(challengeState.entities).length}] =>`, challengeState.entities), [challengeState.entities])

  return (<></>)
}


export function SeasonScoreboardStoreSync() {
  const { currentSeasonId } = useConfig()
  useGetSeasonScoreboard(currentSeasonId)
  // useEffect(() => debug.log(`SeasonScoreboardStoreSync() [${Object.keys(challengeState.entities).length}] =>`, challengeState.entities), [challengeState.entities])
  return (<></>)
}
