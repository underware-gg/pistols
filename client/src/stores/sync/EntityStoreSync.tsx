import { useEffect } from 'react'
import { useSdkEntitiesSub, filterEntitiesByModels, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsEntity, entityContainsModels } from '@underware/pistols-sdk/pistols/sdk'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useConfigStore } from '/src/stores/configStore'
import { useSeasonStore } from '/src/stores/seasonStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { usePlayerStore, usePlayerDataStore } from '/src/stores/playerStore'
import { useDuelistStore, useDuelistStackStore, useDuelistIdsStore } from '/src/stores/duelistStore'
import { useChallengeIdsStore, useChallengeStore } from '/src/stores/challengeStore'
import { useBankStore } from '/src/stores/bankStore'
import { usePackStore } from '/src/stores/packStore'
import { useScoreboardStore } from '/src/stores/scoreboardStore'
import { useProgressStore } from '/src/stores/progressStore'
import { debug } from '@underware/pistols-sdk/pistols'


//---------------------------
// Models to fetch at startup
//
const _modelsMisc = [
  // admin
  "pistols-Config",
  "pistols-TokenConfig",
  "pistols-Pool",
  // season
  "pistols-SeasonConfig",
  "pistols-Leaderboard",
];
const _modelsPlayers = [
  // players
  "pistols-Player",
  "pistols-PlayerFlags",
  "pistols-PlayerTeamFlags",
  // off-chain signed messages
  "pistols-PlayerOnline",
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
  // Scoreboards
  "pistols-SeasonScoreboard",
  // Other
  "pistols-Pack",
];


const _limit = 1500
const query_get_misc: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(_modelsMisc)
  .withLimit(_limit)
  .includeHashedKeys()
const query_get_players: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(_modelsPlayers)
  .withLimit(_limit)
  .includeHashedKeys()
const query_sub: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
    ..._modelsMisc,
    ..._modelsPlayers,
    ..._modelsSubscribed,
  ])
  .withLimit(10)
  .includeHashedKeys()

  
//------------------------------------------------------
// Sync entities: Add only once to a top level component
//
export function EntityStoreSync() {
  // misc
  const configState = useConfigStore((state) => state)
  const tokenState = useTokenConfigStore((state) => state)
  const seasonState = useSeasonStore((state) => state)
  const bankState = useBankStore((state) => state)
  const packState = usePackStore((state) => state)
  // players
  const playerState = usePlayerStore((state) => state)
  const playerDataState = usePlayerDataStore((state) => state)
  // duelists
  const duelistState = useDuelistStore((state) => state)
  const duelistStackState = useDuelistStackStore((state) => state)
  // per season (update only)
  const challengeState = useChallengeStore((state) => state)
  const scoreboardState = useScoreboardStore((state) => state)

  const mounted = useMounted()
  const updateProgress = useProgressStore((state) => state.updateProgress)

  const { isFinished: isFinishedMisc } = useSdkEntitiesGet({
    query: query_get_misc,
    enabled: mounted,
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('query_get_misc', currentPage, finished)
    },
    resetStore: () => {
      debug.log("EntityStoreSync() RESET MISC =======>")
      configState.resetStore()
      tokenState.resetStore()
      seasonState.resetStore()
      bankState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log("EntityStoreSync() SET MISC =======> [entities]:", entities)
      // debug.log("EntityStoreSync() SET =======> [Config]:", filterEntitiesByModels(entities, ['Config']))
      // debug.log("EntityStoreSync() SET =======> [TokenConfig]:", filterEntitiesByModels(entities, ['TokenConfig']))
      // debug.log("EntityStoreSync() SET =======> [Pool]:", filterEntitiesByModels(entities, ['Pool']))
      // debug.log("EntityStoreSync() SET =======> [SeasonConfig]:", filterEntitiesByModels(entities, ['SeasonConfig', 'Leaderboard']))
      // debug.log("EntityStoreSync() SET =======> [Leaderboard]:", filterEntitiesByModels(entities, ['Leaderboard']))
      configState.setEntities(filterEntitiesByModels(entities, ['Config']))
      tokenState.setEntities(filterEntitiesByModels(entities, ['TokenConfig']))
      bankState.setEntities(filterEntitiesByModels(entities, ['Pool']))
      seasonState.setEntities(filterEntitiesByModels(entities, ['SeasonConfig', 'Leaderboard']))
    },
  })

  const { isFinished: isFinishedPlayers } = useSdkEntitiesGet({
    query: query_get_players,
    enabled: (mounted),
    updateProgress: (currentPage: number, finished?: boolean) => {
      updateProgress('query_get_players', currentPage, finished)
    },
    setEntities: (entities: PistolsEntity[]) => {
      debug.log("EntityStoreSync() SET PLAYERS =======> [entities]:", entities)
      // debug.log("EntityStoreSync() SET PLAYERS =======> [Player]:", filterEntitiesByModels(entities, ['Player']))
      // debug.log("EntityStoreSync() SET PLAYERS =======> [PlayerOnline]:", filterEntitiesByModels(entities, ['PlayerOnline']))
      playerState.setEntities(filterEntitiesByModels(entities, ['Player', 'PlayerFlags', 'PlayerTeamFlags']))
      playerDataState.updateMessages(filterEntitiesByModels(entities, ['PlayerOnline']))
    },
  })

  useSdkEntitiesSub({
    query: query_sub,
    enabled: (mounted && isFinishedMisc && isFinishedPlayers),
    setEntities: (entities: PistolsEntity[]) => {
      debug.log("EntityStoreSync() SET =======> [entities]: DISCARD!", entities.length)
    },
    updateEntity: (entity: PistolsEntity) => {
      // debug.log("EntityStoreSync() SUB UPDATE =======> [entity]:", entity)
      if (entityContainsModels(entity, ['Config'])) {
        configState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['TokenConfig'])) {
        tokenState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['SeasonConfig', 'Leaderboard'])) {
        seasonState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['Player', 'PlayerFlags', 'PlayerTeamFlags'])) {
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
  // useEffect(() => debug.log("EntityStoreSync() [tokenStore.entities] =>", Object.values(tokenState.entities).length), [tokenState.entities])
  useEffect(() => debug.log("EntityStoreSync() [challengeState.entities] =>", Object.values(challengeState.entities).length), [challengeState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [duelistStore.entities] =>", Object.values(duelistState.entities).length), [duelistState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [duelistStackStore.entities] =>", Object.values(duelistStackState.entities).length), [duelistStackState.entities])
  // useEffect(() => debug.log("EntityStoreSync() [playerDataState.players] =>", Object.values(playerDataState.players_names).length), [playerDataState.players_names])
  // useEffect(() => debug.log("EntityStoreSync() [playerDataState.players_online] =>", Object.values(playerDataState.players_online).length), [playerDataState.players_online])

  return (<></>)
}
