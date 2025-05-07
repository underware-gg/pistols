import { useSdkEntitiesSub, filterEntitiesByModel, entityHasModels, useSdkEntitiesGet } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsEntity } from '@underware/pistols-sdk/pistols'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useConfigStore } from '/src/stores/configStore'
import { useSeasonConfigStore } from '/src/stores/seasonStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { usePlayerStore } from '/src/stores/playerStore'
import { useDuelistStore } from '/src/stores/duelistStore'
import { useDuelistQueryStore } from '/src/stores/duelistQueryStore'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { usePackStore } from '/src/stores/packStore'
import { useBankStore } from '/src/stores/bankStore'
import { useEffect } from 'react'

const _modelsAdmin = [
  // admin
  "pistols-Config",
  "pistols-TokenConfig",
  "pistols-SeasonConfig",
  "pistols-Leaderboard",
  "pistols-Pool",
  // Other
  "pistols-Pack",
];
const _modelsPlayers = [
  // players
  "pistols-Player",
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
const _modelsChallenges = [
  // Challenges
  "pistols-Challenge",
  "pistols-ChallengeMessage",
  'pistols-Round',
];


const _limit = 1200
const query_get_admin: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels(_modelsAdmin)
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
//   .withEntityModels(_modelsChallenges)
//   .withLimit(_limit)
//   .includeHashedKeys()
const query_sub: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
    ..._modelsAdmin,
    ..._modelsPlayers,
    ..._modelsDuelists,
    ..._modelsStacks,
    ..._modelsChallenges,
  ])
  .withLimit(10)
  .includeHashedKeys()


  
//------------------------------------------------------
// Sync entities: Add only once to a top level component
//
export function EntityStoreSync() {
  // admin
  const configState = useConfigStore((state) => state)
  const tokenState = useTokenConfigStore((state) => state)
  const seasonState = useSeasonConfigStore((state) => state)
  const bankState = useBankStore((state) => state)
  const packState = usePackStore((state) => state)
  // players
  const playerState = usePlayerStore((state) => state)
  // duelists
  const duelistState = useDuelistStore((state) => state)
  const duelistQueryState = useDuelistQueryStore((state) => state)
  // challenges
  const challengeState = useChallengeStore((state) => state)
  const challengeQueryState = useChallengeQueryStore((state) => state)

  const mounted = useMounted()

  const { isFinished: isFinishedAdmin } = useSdkEntitiesGet({
    query: query_get_admin,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET ADMIN =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET =======> [Config]:", filterEntitiesByModel(entities, 'Config'))
      // console.log("EntityStoreSync() SET =======> [TokenConfig]:", filterEntitiesByModel(entities, 'TokenConfig'))
      // console.log("EntityStoreSync() SET =======> [SeasonConfig]:", filterEntitiesByModel(entities, 'SeasonConfig'))
      // console.log("EntityStoreSync() SET =======> [Leaderboard]:", filterEntitiesByModel(entities, 'Leaderboard'))
      // console.log("EntityStoreSync() SET =======> [Pool]:", filterEntitiesByModel(entities, 'Pool'))
      configState.setEntities(filterEntitiesByModel(entities, 'Config'))
      tokenState.setEntities(filterEntitiesByModel(entities, 'TokenConfig'))
      seasonState.setEntities(filterEntitiesByModel(entities, ['SeasonConfig', 'Leaderboard']))
      bankState.setEntities(filterEntitiesByModel(entities, 'Pool'))
      packState.setEntities(filterEntitiesByModel(entities, 'Pack'))
    },
  })

  const { isFinished: isFinishedPlayers } = useSdkEntitiesGet({
    query: query_get_players,
    enabled: (mounted),
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET PLAYERS =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET PLAYERS =======> [Player]:", filterEntitiesByModel(entities, 'Player'))
      playerState.setEntities(filterEntitiesByModel(entities, 'Player'))
      playerState.updateMessages(filterEntitiesByModel(entities, ['PlayerOnline', 'PlayerBookmark']))
    },
  })

  const { isFinished: isFinishedDuelists } = useSdkEntitiesGet({
    query: query_get_duelists,
    enabled: (mounted),
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET DUELISTS =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET DUELISTS =======> [Duelist]:", filterEntitiesByModel(entities, 'Duelist'))
      duelistState.setEntities(entities)
      duelistQueryState.setEntities(entities)
    },
  })

  const { isFinished: isFinishedStacks } = useSdkEntitiesGet({
    query: query_get_duelist_stacks,
    enabled: (mounted),
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET STACKS =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET STACKS =======> [PlayerDuelistStack]:", filterEntitiesByModel(entities, 'PlayerDuelistStack'))
      duelistState.setEntities(entities)
    },
  })

  // challenge initial state is handled by <ChallengeStoreSync>
  // useSdkEntitiesGet({
  //   query: query_get_challenges,
  //   enabled: mounted,
  //   setEntities: (entities: PistolsEntity[]) => {
  //     console.log("EntityStoreSync() SET CHALLENGES =======> [entities]:", entities)
  //     challengeState.setEntities(entities)
  //     challengeQueryState.setEntities(entities)
  //   },
  // })

  useSdkEntitiesSub({
    query: query_sub,
    enabled: (mounted && isFinishedAdmin && isFinishedPlayers && isFinishedDuelists && isFinishedStacks),
    setEntities: (entities: PistolsEntity[]) => {
      console.log("EntityStoreSync() SET =======> [entities]: DISCARD!", entities.length)
    },
    updateEntity: (entity: PistolsEntity) => {
      // console.log("EntityStoreSync() SUB UPDATE =======> [entity]:", entity)
      if (entityHasModels(entity, ['Config'])) {
        configState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['TokenConfig'])) {
        tokenState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['SeasonConfig', 'Leaderboard'])) {
        seasonState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['Player'])) {
        playerState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['PlayerOnline', 'PlayerBookmark'])) {
        playerState.updateMessages([entity])
      }
      if (entityHasModels(entity, ['Duelist', 'DuelistAssignment', 'DuelistMemorial'])) {
        duelistState.updateEntity(entity)
        duelistQueryState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['PlayerDuelistStack'])) {
        duelistState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['Challenge', 'ChallengeMessage', 'Round'])) {
        challengeState.updateEntity(entity)
        challengeQueryState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['Pack'])) {
        packState.updateEntity(entity)
      }
      if (entityHasModels(entity, ['Pool'])) {
        bankState.updateEntity(entity)
      }
    },
  })

  // useEffect(() => console.log("EntityStoreSync() [configStore.entities] =>", configState.entities), [configState.entities])
  // useEffect(() => console.log("EntityStoreSync() [seasonState.entities] =>", seasonState.entities), [seasonState.entities])
  // useEffect(() => console.log("EntityStoreSync() [tokenStore.entities] =>", tokenState.entities), [tokenState.entities])
  // useEffect(() => console.log("EntityStoreSync() [duelistStore.entities] =>", duelistState.entities), [duelistState.entities])
  // useEffect(() => console.log("EntityStoreSync() [playerState.players] =>", playerState.players), [playerState.players])
  // useEffect(() => console.log("EntityStoreSync() [playerState.players_online] =>", playerState.players_online), [playerState.players_online])

  return (<></>)
}
