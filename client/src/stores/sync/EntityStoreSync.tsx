import { useSdkEntitiesSub, getEntityModel, filterEntitiesByModel, getEntityModels } from '@underware/pistols-sdk/dojo'
import { PistolsQueryBuilder, PistolsEntity, PistolsClauseBuilder } from '@underware/pistols-sdk/pistols'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useConfigStore } from '/src/stores/configStore'
import { useTableConfigStore } from '/src/stores/tableStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { usePlayerStore } from '/src/stores/playerStore'
import { useDuelistStore } from '/src/stores/duelistStore'
import { useDuelistQueryStore } from '/src/stores/duelistQueryStore'
import { useChallengeStore } from '/src/stores/challengeStore'
import { useChallengeQueryStore } from '/src/stores/challengeQueryStore'
import { usePackStore } from '/src/stores/packStore'
import { useBankStore } from '/src/stores/bankStore'

// const query_get: PistolsQueryBuilder = {
//   pistols: {
//     // models
//     Config: { $: { where: { key: { $eq: constants.CONFIG.CONFIG_KEY } } } },
//     TableConfig: { $: { where: { table_id: { $neq: 0 } } } },
//     TokenConfig: { $: { where: { token_address: { $neq: '' } } } },
//     Player: { $: { where: { player_address: { $neq: '' } } } },
//     Duelist: { $: { where: { duelist_id: { $neq: 0 } } } },
//     DuelistChallenge: { $: { where: { duelist_id: { $neq: 0 } } } },
//     Scoreboard: { $: { where: { holder: { $neq: 0 } } } },
//   },
// }
// const query_get_messages: PistolsQueryBuilder = {
//   pistols: {
//     // off-chain signed messages
//     PlayerOnline: { $: { where: { identity: { $neq: '' } } } },
//     PlayerBookmark: { $: { where: { identity: { $neq: '' } } } },
//   },
// }
// const query_sub: PistolsQueryBuilder = {
//   pistols: {
//     // models
//     Config: [],
//     TableConfig: [],
//     TokenConfig: [],
//     Player: [],
//     Duelist: [],
//     DuelistChallenge: [],
//     Scoreboard: [],
//     Challenge: [],
//     Round: [],
//     Pack: [],
//     // off-chain signed messages
//     PlayerOnline: [],
//     PlayerBookmark: [],
//   },
// }

const _limit = 1000
const query: PistolsQueryBuilder = new PistolsQueryBuilder()
  .withEntityModels([
    "pistols-Config",
    "pistols-TokenConfig",
    "pistols-TableConfig",
    "pistols-SeasonConfig",
    "pistols-Leaderboard",
    "pistols-Player",
    "pistols-Duelist",
    "pistols-DuelistChallenge",
    "pistols-DuelistMemorial",
    "pistols-Challenge",
    "pistols-Round",
    "pistols-Pack",
    "pistols-Pool",
    // off-chain signed messages
    "pistols-PlayerOnline",
    "pistols-PlayerBookmark",
  ])
  .withLimit(_limit)
  .includeHashedKeys()


  
//------------------------------------------------------
// Sync entities: Add only once to a top level component
//
export function EntityStoreSync() {
  const configState = useConfigStore((state) => state)
  const tableState = useTableConfigStore((state) => state)
  const tokenState = useTokenConfigStore((state) => state)
  const playerState = usePlayerStore((state) => state)
  const duelistState = useDuelistStore((state) => state)
  const duelistQueryState = useDuelistQueryStore((state) => state)
  const challengeState = useChallengeStore((state) => state)
  const challengeQueryState = useChallengeQueryStore((state) => state)
  const packState = usePackStore((state) => state)
  const bankState = useBankStore((state) => state)

  const mounted = useMounted()

  useSdkEntitiesSub({
    query,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      if (entities.length == _limit) {
        console.warn("EntityStoreSync() LIMIT REACHED!!!!:", entities.length)
      }
      // console.log("EntityStoreSync() SET =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET =======> [Config]:", filterEntitiesByModel(entities, 'Config'))
      // console.log("EntityStoreSync() SET =======> [TokenConfig]:", filterEntitiesByModel(entities, 'TokenConfig'))
      // console.log("EntityStoreSync() SET =======> [TableConfig]:", filterEntitiesByModel(entities, 'TableConfig'))
      // console.log("EntityStoreSync() SET =======> [SeasonConfig]:", filterEntitiesByModel(entities, 'SeasonConfig'))
      // console.log("EntityStoreSync() SET =======> [Leaderboard]:", filterEntitiesByModel(entities, 'SeaLeaderboardsonConfig'))
      console.log("EntityStoreSync() SET =======> [Duelist]:", filterEntitiesByModel(entities, 'Duelist'))
      // console.log("EntityStoreSync() SET =======> [Player]:", filterEntitiesByModel(entities, 'Player'))
      // console.log("EntityStoreSync() SET =======> [Pool]:", filterEntitiesByModel(entities, 'Pool'))
      configState.setEntities(filterEntitiesByModel(entities, 'Config'))
      tokenState.setEntities(filterEntitiesByModel(entities, 'TokenConfig'))
      tableState.setEntities(filterEntitiesByModel(entities, ['TableConfig', 'SeasonConfig', 'Leaderboard']))
      playerState.setEntities(filterEntitiesByModel(entities, 'Player'))
      playerState.updateMessages(filterEntitiesByModel(entities, ['PlayerOnline', 'PlayerBookmark']))
      const duelistEntities = filterEntitiesByModel(entities, ['Duelist', 'DuelistChallenge', 'DuelistMemorial'])
      duelistState.setEntities(duelistEntities)
      duelistQueryState.setEntities(duelistEntities)
      bankState.setEntities(filterEntitiesByModel(entities, 'Pool'))
      // challenge initial state is handled by <ChallengeStoreSync>
      // const challengeEntities = filterEntitiesByModel(entities, ['Challenge', 'Round'])
      // challengeState.setEntities(challengeEntities)
      // challengeQueryState.setEntities(challengeEntities)
    },
    updateEntity: (entity: PistolsEntity) => {
      console.log("EntityStoreSync() SUB UPDATE =======> [entity]:", entity)
      if (getEntityModel(entity, 'Config')) {
        configState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'TokenConfig')) {
        tokenState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'TableConfig') || getEntityModel(entity, 'SeasonConfig') || getEntityModel(entity, 'Leaderboard')) {
        tableState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'Player')) {
        playerState.updateEntity(entity)
      }
      if (getEntityModels(entity, ['PlayerOnline', 'PlayerBookmark']).length > 0) {
        playerState.updateMessages([entity])
      }
      if (getEntityModel(entity, 'Duelist') || getEntityModel(entity, 'DuelistChallenge') || getEntityModel(entity, 'DuelistMemorial')) {
        duelistState.updateEntity(entity)
        duelistQueryState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'Challenge') || getEntityModel(entity, 'Round')) {
        challengeState.updateEntity(entity)
        challengeQueryState.updateEntity(entity)
      }
      if (getEntityModels(entity, ['Pack']).length > 0) {
        packState.updateEntity(entity)
      }
      if (getEntityModels(entity, ['Pool']).length > 0) {
        bankState.updateEntity(entity)
      }
    },
  })

  // useEffect(() => console.log("EntityStoreSync() [configStore.entities] =>", configState.entities), [configState.entities])
  // useEffect(() => console.log("EntityStoreSync() [tableStore.entities] =>", tableState.entities), [tableState.entities])
  // useEffect(() => console.log("EntityStoreSync() [tokenStore.entities] =>", tokenState.entities), [tokenState.entities])
  // useEffect(() => console.log("EntityStoreSync() [duelistStore.entities] =>", duelistState.entities), [duelistState.entities])
  // useEffect(() => console.log("EntityStoreSync() [playerState.players] =>", playerState.players), [playerState.players])
  // useEffect(() => console.log("EntityStoreSync() [playerState.players_online] =>", playerState.players_online), [playerState.players_online])

  return (<></>)
}
