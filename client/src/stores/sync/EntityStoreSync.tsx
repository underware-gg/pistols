import { useEffect } from 'react'
import { useSdkEntitiesSub, filterEntitiesByModels, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsEntity, entityContainsModels } from '@underware/pistols-sdk/pistols/sdk'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useConfigStore } from '/src/stores/configStore'
import { useSeasonStore } from '/src/stores/seasonStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { usePlayerEntityStore, usePlayerDataStore } from '/src/stores/playerStore'
import { useDuelistStore, useDuelistStackStore, useDuelistIdsStore } from '/src/stores/duelistStore'
import { useChallengeIdsStore, useChallengeStore } from '/src/stores/challengeStore'
import { useBankStore } from '/src/stores/bankStore'
import { usePackStore } from '/src/stores/packStore'
import { useQuizStore } from '/src/stores/quizStore'
import { useScoreboardStore } from '/src/stores/scoreboardStore'
import { useProgressStore } from '/src/stores/progressStore'
import { useMatchStore } from '/src/stores/matchStore'
import { debug } from '@underware/pistols-sdk/pistols'


//---------------------------
// Models to fetch at startup
//
const _modelsGet = [
  // admin
  "pistols-Config",
  "pistols-QuizConfig",
  "pistols-TokenConfig",
  "pistols-Pool",
  // quiz
  "pistols-QuizParty",
  "pistols-QuizQuestion",
  "pistols-QuizAnswer",
  // season
  "pistols-SeasonConfig",
  "pistols-Leaderboard",
  // matchmaking
  "pistols-MatchQueue",
  "pistols-MatchPlayer",
  // players
  "pistols-Player",
  "pistols-PlayerFlags",
  "pistols-PlayerTeamFlags",
  "pistols-Ring",
  "pistols-RingBalance",
  // off-chain signed messages
  "pistols-PlayerOnline",
  // TEMP: load all quizzes
  "pistols-QuizParty",
  "pistols-QuizQuestion",
  "pistols-QuizAnswer",
];

//-------------------------
// Models to subscribe only
//
const _modelsSubscribed = [
  // Duelists
  "pistols-Duelist",
  "pistols-DuelistAssignment",
  "pistols-DuelistMemorial",
  // Players
  "pistols-PlayerDuelistStack",
  // Challenges
  "pistols-Challenge",
  "pistols-ChallengeMessage",
  'pistols-Round',
  // Misc
  "pistols-Pack",
  "pistols-SeasonScoreboard",
  // TEMP: load all quizzes
  // "pistols-QuizParty",
  // "pistols-QuizQuestion",
  // "pistols-QuizAnswer",
];


const query_get: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(_modelsGet)
  .withLimit(2000)
  .includeHashedKeys()
const query_sub: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
    ..._modelsGet,
    ..._modelsSubscribed,
  ])
  .withLimit(1) // discard
  .includeHashedKeys()

  
//------------------------------------------------------
// Sync entities: Add only once to a top level component
//
export function EntityStoreSync() {
  // misc
  const configState = useConfigStore((state) => state)
  const tokenState = useTokenConfigStore((state) => state)
  const seasonState = useSeasonStore((state) => state)
  const matchState = useMatchStore((state) => state)
  const bankState = useBankStore((state) => state)
  const packState = usePackStore((state) => state)
  const quizState = useQuizStore((state) => state)
  // players
  const playerState = usePlayerEntityStore((state) => state)
  const playerDataState = usePlayerDataStore((state) => state)
  // duelists
  const duelistState = useDuelistStore((state) => state)
  const duelistStackState = useDuelistStackStore((state) => state)
  // per season (update only)
  const challengeState = useChallengeStore((state) => state)
  const scoreboardState = useScoreboardStore((state) => state)

  const mounted = useMounted()
  const updateProgress = useProgressStore((state) => state.updateProgress)

  const { isFinished: isFinishedGet } = useSdkEntitiesGet({
    query: query_get,
    enabled: mounted,
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('entities_get', currentPage, finished)
    },
    resetStore: () => {
      debug.log("EntityStoreSync() RESET MISC =======>")
      configState.resetStore()
      tokenState.resetStore()
      seasonState.resetStore()
      matchState.resetStore()
      bankState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log("EntityStoreSync() SET MISC =======> [entities]:", entities)
      // debug.log("EntityStoreSync() SET =======> [Config]:", filterEntitiesByModels(entities, ['Config']))
      // debug.log("EntityStoreSync() SET =======> [TokenConfig]:", filterEntitiesByModels(entities, ['TokenConfig']))
      // debug.log("EntityStoreSync() SET =======> [Pool]:", filterEntitiesByModels(entities, ['Pool']))
      // debug.log("EntityStoreSync() SET =======> [SeasonConfig]:", filterEntitiesByModels(entities, ['SeasonConfig', 'Leaderboard']))
      debug.log("EntityStoreSync() SET =======> [MatchQueue,MatchPlayer]:", filterEntitiesByModels(entities, ['MatchQueue', 'MatchPlayer']))
      // debug.log("EntityStoreSync() SET =======> [Leaderboard]:", filterEntitiesByModels(entities, ['Leaderboard']))
      // debug.log("EntityStoreSync() SET PLAYERS =======> [Player]:", filterEntitiesByModels(entities, ['Player']))
      // debug.log("EntityStoreSync() SET PLAYERS =======> [PlayerOnline]:", filterEntitiesByModels(entities, ['PlayerOnline']))
      // debug.log("EntityStoreSync() SET PLAYERS =======> [Ring]:", filterEntitiesByModels(entities, ['Ring']))
      // debug.log("EntityStoreSync() SET PLAYERS =======> [RingBalance]:", filterEntitiesByModels(entities, ['RingBalance']))
      debug.log("EntityStoreSync() SET =======> [QuizParty,QuizQuestion,QuizAnswer]:", filterEntitiesByModels(entities, ['QuizParty', 'QuizQuestion', 'QuizAnswer']))
      configState.setEntities(filterEntitiesByModels(entities, ['Config', 'QuizConfig']))
      tokenState.setEntities(filterEntitiesByModels(entities, ['TokenConfig']))
      bankState.setEntities(filterEntitiesByModels(entities, ['Pool']))
      seasonState.setEntities(filterEntitiesByModels(entities, ['SeasonConfig', 'Leaderboard']))
      matchState.setEntities(filterEntitiesByModels(entities, ['MatchQueue', 'MatchPlayer']))
      playerState.setEntities(filterEntitiesByModels(entities, ['Player', 'PlayerFlags', 'PlayerTeamFlags', 'Ring', 'RingBalance']))
      playerDataState.updateMessages(filterEntitiesByModels(entities, ['PlayerOnline']))
      quizState.setEntities(filterEntitiesByModels(entities, ['QuizParty', 'QuizQuestion', 'QuizAnswer']))
    },
  })

  useSdkEntitiesSub({
    query: query_sub,
    enabled: (mounted && isFinishedGet),
    setEntities: (entities: PistolsEntity[]) => {
      debug.log("EntityStoreSync() SET =======> [entities]: DISCARD!", entities.length)
    },
    updateEntity: (entity: PistolsEntity) => {
      // debug.log("EntityStoreSync() SUB UPDATE =======> [entity]:", entity)
      if (entityContainsModels(entity, ['Config', 'QuizConfig'])) {
        configState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['TokenConfig'])) {
        tokenState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['SeasonConfig', 'Leaderboard'])) {
        seasonState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['MatchQueue', 'MatchPlayer'])) {
        matchState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['Player', 'PlayerFlags', 'PlayerTeamFlags', 'Ring', 'RingBalance'])) {
        playerState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['PlayerOnline'])) {
        playerDataState.updateMessages([entity])
      }
      if (entityContainsModels(entity, ['Duelist', 'DuelistAssignment', 'DuelistMemorial'])) {
        duelistState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['PlayerDuelistStack'])) {
        duelistStackState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['Pack'])) {
        packState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['QuizParty', 'QuizQuestion', 'QuizAnswer'])) {
        quizState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['Pool'])) {
        bankState.updateEntity(entity)
      }
      // per season models (update only)
      if (entityContainsModels(entity, ['Challenge', 'ChallengeMessage', 'Round'])) {
        challengeState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['SeasonScoreboard'])) {
        scoreboardState.updateEntity(entity)
      }
    },
  })

  // Keep ID stores updated
  const updateChallengeIdsEntities = useChallengeIdsStore((state) => state.updateEntities)
  const updateDuelistIdsEntities = useDuelistIdsStore((state) => state.updateEntities)
  useEffect(() => updateChallengeIdsEntities(Object.values(challengeState.entities)), [challengeState.entities])
  useEffect(() => updateDuelistIdsEntities(Object.values(duelistState.entities)), [duelistState.entities])

  // useEffect(() => debug.log("EntityStoreSync() [configStore.entities] =>", Object.values(configState.entities).length), [configState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [seasonState.entities] =>", Object.values(seasonState.entities).length), [seasonState.entities])
  useEffect(() => debug.log("EntityStoreSync() [matchState.entities] =>", Object.values(matchState.entities).length), [matchState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [tokenStore.entities] =>", Object.values(tokenState.entities).length), [tokenState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [challengeState.entities] =>", Object.values(challengeState.entities).length), [challengeState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [duelistStore.entities] =>", Object.values(duelistState.entities).length), [duelistState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [duelistStackStore.entities] =>", Object.values(duelistStackState.entities).length), [duelistStackState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [playerDataState.players] =>", Object.values(playerDataState.players_names).length), [playerDataState.players_names])
  // useEffect(() => debug.log("EntityStoreSync() [playerDataState.players_online] =>", Object.values(playerDataState.players_online).length), [playerDataState.players_online])
  useEffect(() => debug.log("EntityStoreSync() [quizState.entities] =>", Object.values(quizState.entities).length), [quizState.entities])

  return (<></>)
}
