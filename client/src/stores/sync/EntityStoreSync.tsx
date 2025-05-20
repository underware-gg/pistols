import { useSdkEntitiesSub, filterEntitiesByModels, entityContainsModels, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols/sdk'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useConfigStore } from '/src/stores/configStore'
import { useSeasonStore } from '/src/stores/seasonStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { usePlayerStore } from '/src/stores/playerStore'
import { useDuelistStore, useDuelistStackStore } from '/src/stores/duelistStore'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { useBankStore } from '/src/stores/bankStore'
import { usePackStore } from '/src/stores/packStore'
import { useScoreboardStore } from '/src/stores/scoreboardStore'

const _modelsMisc = [
  // admin
  "pistols-Config",
  "pistols-TokenConfig",
  "pistols-Pool",
  // season
  "pistols-SeasonConfig",
  "pistols-Leaderboard",
  // Other
  "pistols-Pack",
];
const _modelsPlayers = [
  // players
  "pistols-Player",
  "pistols-PlayerFlags",
  "pistols-PlayerTeamFlags",
  // off-chain signed messages
  "pistols-PlayerOnline",
  "pistols-PlayerBookmark",
];
const _modelsDuelists = [
  // Duelists
  "pistols-Duelist",
  "pistols-DuelistAssignment",
  "pistols-DuelistMemorial",
];
const _modelsStacks = [
  // Stacks
  "pistols-PlayerDuelistStack",
];
const _modelsPerSeason = [
  // Challenges
  "pistols-Challenge",
  "pistols-ChallengeMessage",
  'pistols-Round',
  // Scoreboards
  "pistols-SeasonScoreboard",
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
const query_get_duelists: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(_modelsDuelists)
  .withLimit(_limit)
  .includeHashedKeys()
const query_get_duelist_stacks: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(_modelsStacks)
  .withLimit(_limit)
  .includeHashedKeys()
// const query_get_challenges: PistolsQueryBuilder = new PistolsQueryBuilder()
//   .withEntityModels(_modelsPerSeason)
//   .withLimit(_limit)
//   .includeHashedKeys()
const query_sub: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
    ..._modelsMisc,
    ..._modelsPlayers,
    ..._modelsDuelists,
    ..._modelsStacks,
    ..._modelsPerSeason,
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
  // duelists
  const duelistState = useDuelistStore((state) => state)
  const duelistStackState = useDuelistStackStore((state) => state)
  // per season (update only)
  const challengeState = useChallengeStore((state) => state)
  const challengeQueryState = useChallengeQueryStore((state) => state)
  const scoreboardState = useScoreboardStore((state) => state)

  const mounted = useMounted()

  const { isFinished: isFinishedMisc } = useSdkEntitiesGet({
    query: query_get_misc,
    enabled: mounted,
    resetStore: () => {
      console.log("EntityStoreSync() RESET MISC =======>")
      configState.resetStore()
      tokenState.resetStore()
      seasonState.resetStore()
      bankState.resetStore()
      packState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET MISC =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET =======> [Config]:", filterEntitiesByModels(entities, ['Config']))
      // console.log("EntityStoreSync() SET =======> [TokenConfig]:", filterEntitiesByModels(entities, ['TokenConfig']))
      // console.log("EntityStoreSync() SET =======> [Pool]:", filterEntitiesByModels(entities, ['Pool']))
      // console.log("EntityStoreSync() SET =======> [SeasonConfig]:", filterEntitiesByModels(entities, ['SeasonConfig', 'Leaderboard']))
      // console.log("EntityStoreSync() SET =======> [Leaderboard]:", filterEntitiesByModels(entities, ['Leaderboard']))
      configState.setEntities(filterEntitiesByModels(entities, ['Config']))
      tokenState.setEntities(filterEntitiesByModels(entities, ['TokenConfig']))
      bankState.setEntities(filterEntitiesByModels(entities, ['Pool']))
      seasonState.setEntities(filterEntitiesByModels(entities, ['SeasonConfig', 'Leaderboard']))
      packState.setEntities(filterEntitiesByModels(entities, ['Pack']))
    },
  })

  const { isFinished: isFinishedPlayers } = useSdkEntitiesGet({
    query: query_get_players,
    enabled: (mounted),
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET PLAYERS =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET PLAYERS =======> [Player]:", filterEntitiesByModels(entities, ['Player']))
      playerState.setEntities(filterEntitiesByModels(entities, ['Player', 'PlayerFlags', 'PlayerTeamFlags']))
      playerState.updateMessages(filterEntitiesByModels(entities, ['PlayerOnline', 'PlayerBookmark']))
    },
  })

  const { isFinished: isFinishedDuelists } = useSdkEntitiesGet({
    query: query_get_duelists,
    enabled: (mounted),
    resetStore: () => {
      console.log("EntityStoreSync() RESET DUELISTS =======>")
      duelistState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET DUELISTS =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET DUELISTS =======> [Duelist]:", filterEntitiesByModels(entities, ['Duelist']))
      duelistState.setEntities(entities)
    },
  })

  const { isFinished: isFinishedStacks } = useSdkEntitiesGet({
    query: query_get_duelist_stacks,
    enabled: (mounted),
    resetStore: () => {
      console.log("EntityStoreSync() RESET STACKS =======>")
      duelistStackState.resetStore()
    },
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET STACKS =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET STACKS =======> [PlayerDuelistStack]:", filterEntitiesByModels(entities, ['PlayerDuelistStack']))
      duelistStackState.setEntities(entities)
    },
  })

  useSdkEntitiesSub({
    query: query_sub,
    enabled: (mounted && isFinishedMisc && isFinishedPlayers && isFinishedDuelists && isFinishedStacks),
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET =======> [entities]: DISCARD!", entities.length)
    },
    updateEntity: (entity: PistolsEntity) => {
      // console.log("EntityStoreSync() SUB UPDATE =======> [entity]:", entity)
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
      if (entityContainsModels(entity, ['PlayerOnline', 'PlayerBookmark'])) {
        playerState.updateMessages([entity])
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
        challengeQueryState.updateEntity(entity)
      }
      if (entityContainsModels(entity, ['SeasonScoreboard'])) {
        scoreboardState.updateEntity(entity)
      }
    },
  })

  // useEffect(() => console.log("EntityStoreSync() [configStore.entities] =>", configState.entities), [configState.entities])
  // useEffect(() => console.log("EntityStoreSync() [seasonState.entities] =>", seasonState.entities), [seasonState.entities])
  // useEffect(() => console.log("EntityStoreSync() [tokenStore.entities] =>", tokenState.entities), [tokenState.entities])
  // useEffect(() => console.log("EntityStoreSync() [duelistStore.entities] =>", duelistState.entities), [duelistState.entities])
  // useEffect(() => console.log("EntityStoreSync() [duelistStackStore.entities] =>", duelistStackState.entities), [duelistStackState.entities])
  // useEffect(() => console.log("EntityStoreSync() [playerState.players] =>", playerState.players), [playerState.players])
  // useEffect(() => console.log("EntityStoreSync() [playerState.players_online] =>", playerState.players_online), [playerState.players_online])

  return (<></>)
}
