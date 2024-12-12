import { useSdkEntities, PistolsGetQuery, PistolsSubQuery, PistolsEntity, getEntityModel, filterEntitiesByModel } from '@/lib/dojo/hooks/useSdkEntities'
import { useConfigStore } from '@/pistols/stores/configStore'
import { useTableConfigStore } from '@/pistols/stores/tableStore'
import { useTokenConfigStore } from '@/pistols/stores/tokenConfigStore'
import { usePlayerStore } from '@/pistols/stores/playerStore'
import { useDuelistStore } from '@/pistols/stores/duelistStore'
import { useDuelistQueryStore } from '@/pistols/stores/duelistQueryStore'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { CONFIG } from '@/games/pistols/generated/constants'
import { useEffect } from 'react'

const query_get: PistolsGetQuery = {
  pistols: {
    Config: { $: { where: { key: { $eq: CONFIG.CONFIG_KEY } } } },
    TableConfig: { $: { where: { table_id: { $neq: 0 } } } },
    TokenConfig: { $: { where: { token_address: { $neq: '' } } } },
    Player: { $: { where: { address: { $neq: '' } } } },
    Duelist: { $: { where: { duelist_id: { $neq: 0 } } } },
  },
}
const query_sub: PistolsSubQuery = {
  pistols: {
    Config: [],
    TableConfig: [],
    TokenConfig: [],
    Player: [],
    Duelist: [],
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
      // console.log("EntityStoreSync() SET =======> [Player]:", filterEntitiesByModel(entities, 'Player'))
      // console.log("EntityStoreSync() SET =======> [Duelist]:", filterEntitiesByModel(entities, 'Duelist'))
      configState.setEntities(filterEntitiesByModel(entities, 'Config'))
      tableState.setEntities(filterEntitiesByModel(entities, 'TableConfig'))
      tokenState.setEntities(filterEntitiesByModel(entities, 'TokenConfig'))
      playerState.setEntities(filterEntitiesByModel(entities, 'Player'))
      duelistState.setEntities(filterEntitiesByModel(entities, 'Duelist'))
      duelistQueryState.setEntities(filterEntitiesByModel(entities, 'Duelist'))
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
      if (getEntityModel(entity, 'Player')) {
        playerState.updateEntity(entity)
      }
      if (getEntityModel(entity, 'Duelist')) {
        duelistState.updateEntity(entity)
        duelistQueryState.updateEntity(entity)
      }
    },
  })

  // useEffect(() => console.log("EntityStoreSync() [Config] =>", configState.entities), [configState.entities])
  // useEffect(() => console.log("EntityStoreSync() [TableConfig] =>", tableState.entities), [tableState.entities])
  // useEffect(() => console.log("EntityStoreSync() [TokenConfig] =>", tokenState.entities), [tokenState.entities])
  // useEffect(() => console.log("EntityStoreSync() [Player] =>", playerState.players), [playerState.players])
  // useEffect(() => console.log("EntityStoreSync() [Duelist] =>", duelistState.entities), [duelistState.entities])

  return (<></>)
}
