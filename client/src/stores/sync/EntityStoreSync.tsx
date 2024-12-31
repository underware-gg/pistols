import { useMemo } from 'react'
import { useSdkEntities, getEntityModel, filterEntitiesByModel, getEntityModels } from '@underware_gg/pistols-sdk/dojo'
import { constants, PistolsGetQuery, PistolsSubQuery, PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { useMounted } from '@underware_gg/pistols-sdk/utils'
import { useConfigStore } from '/src/stores/configStore'
import { useTableConfigStore } from '/src/stores/tableStore'
import { useTokenConfigStore } from '/src/stores/tokenConfigStore'
import { usePlayerStore } from '/src/stores/playerStore'
import { useDuelistStore } from '/src/stores/duelistStore'
import { useDuelistQueryStore } from '/src/stores/duelistQueryStore'

const query_get: PistolsGetQuery = {
  pistols: {
    Config: { $: { where: { key: { $eq: constants.CONFIG.CONFIG_KEY } } } },
    TableConfig: { $: { where: { table_id: { $neq: 0 } } } },
    TokenConfig: { $: { where: { token_address: { $neq: '' } } } },
    Duelist: { $: { where: { duelist_id: { $neq: 0 } } } },
    Player: { $: { where: { address: { $neq: '' } } } },
  },
}
const query_get_messages: PistolsGetQuery = {
  pistols: {
    // off-chain signed messages
    PPlayerOnline: { $: { where: { identity: { $neq: '' } } } },
    PPlayerBookmark: { $: { where: { identity: { $neq: '' } } } },
    PPlayerTutorialProgress: { $: { where: { identity: { $neq: '' } } } },
  },
}
const query_sub: PistolsSubQuery = {
  pistols: {
    Config: [],
    TableConfig: [],
    TokenConfig: [],
    Duelist: [],
    Player: [],
    PPlayerOnline: [],
    PPlayerBookmark: [],
    PPlayerTutorialProgress: [],
  },
}


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

  const mounted = useMounted()

  useSdkEntities({
    query_get,
    query_sub,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      // console.log("EntityStoreSync() SET =======> [entities]:", entities)
      // console.log("EntityStoreSync() SET =======> [Config]:", filterEntitiesByModel(entities, 'Config'))
      // console.log("EntityStoreSync() SET =======> [TableConfig]:", filterEntitiesByModel(entities, 'TableConfig'))
      // console.log("EntityStoreSync() SET =======> [TokenConfig]:", filterEntitiesByModel(entities, 'TokenConfig'))
      // console.log("EntityStoreSync() SET =======> [Duelist]:", filterEntitiesByModel(entities, 'Duelist'))
      // console.log("EntityStoreSync() SET =======> [Player]:", filterEntitiesByModel(entities, 'Player'))
      configState.setEntities(filterEntitiesByModel(entities, 'Config'))
      tableState.setEntities(filterEntitiesByModel(entities, 'TableConfig'))
      tokenState.setEntities(filterEntitiesByModel(entities, 'TokenConfig'))
      duelistState.setEntities(filterEntitiesByModel(entities, 'Duelist'))
      duelistQueryState.setEntities(filterEntitiesByModel(entities, 'Duelist'))
      playerState.setEntities(filterEntitiesByModel(entities, 'Player'))
    },
    updateEntity: (entity: PistolsEntity) => {
      console.log("EntityStoreSync() UPDATE =======> [entity]:", entity)
      if (getEntityModel(entity, 'Config')) {
        configState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'TableConfig')) {
        tableState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'TokenConfig')) {
        tokenState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'Duelist')) {
        duelistState.updateEntity(entity)
        duelistQueryState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'Player')) {
        playerState.updateEntity(entity)
      }
      if (getEntityModels(entity, ['PPlayerOnline', 'PPlayerBookmark', 'PPlayerTutorialProgress']).length > 0) {
        playerState.updateMessages([entity])
      }
    },
  })

  // off-chain signed messages
  // fetch only after players have been fetched
  const playersLoaded = useMemo(() => (Object.keys(playerState.players).length > 0), [playerState.players])
  useSdkEntities({
    query_get: query_get_messages,
    enabled: (mounted && playersLoaded),
    setEntities: (entities: PistolsEntity[]) => {
      playerState.updateMessages(entities)
    },
  })

  // useEffect(() => console.log("EntityStoreSync() [Config] =>", configState.entities), [configState.entities])
  // useEffect(() => console.log("EntityStoreSync() [TableConfig] =>", tableState.entities), [tableState.entities])
  // useEffect(() => console.log("EntityStoreSync() [TokenConfig] =>", tokenState.entities), [tokenState.entities])
  // useEffect(() => console.log("EntityStoreSync() [Duelist] =>", duelistState.entities), [duelistState.entities])
  // useEffect(() => console.log("EntityStoreSync() [Player] =>", playerState.players), [playerState.players])
  // useEffect(() => console.log("EntityStoreSync() [PlayerOnline] =>", playerState.players_online), [playerState.players_online])

  return (<></>)
}
