import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { useEntityModel, getEntityModel } from '@underware/pistols-sdk/dojo'
import { useRouteSlugs } from '/src/hooks/useRoute'
import { feltToString, keysToEntityId } from '@underware/pistols-sdk/utils'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const useConfigStore = createDojoStore<PistolsSchemaType>();

const configKey = keysToEntityId([constants.CONFIG.CONFIG_KEY])


//--------------------------------
// 'consumer' hooks
//
export const useConfig = () => {
  const entities = useConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[configKey], [entities])

  const config = useEntityModel<models.Config>(entity, 'Config')
  // useEffect(() => console.log(`useConfig() =>`, config), [config])

  const isPaused = useMemo(() => (config?.is_paused ?? false), [config])
  const seasonTableId = useMemo(() => (config ? feltToString(config.season_table_id) : null), [config])

  const treasuryAddress = useMemo(() => (config ? BigInt(config.treasury_address) : null), [config])
  const lordsAddress = useMemo(() => (config ? BigInt(config.lords_address) : null), [config])
  const vrfAddress = useMemo(() => (config ? BigInt(config.vrf_address) : null), [config])

  return {
    isPaused,
    seasonTableId,
    // accounts
    treasuryAddress,
    lordsAddress,
    vrfAddress,
  }
}

export const useTableId = () => {
  const { seasonTableId } = useConfig()
  const { table_id } = useRouteSlugs()
  const tableId = useMemo(() => (table_id || seasonTableId), [table_id, seasonTableId])
  const isSeason = useMemo(() => (seasonTableId && tableId === seasonTableId), [tableId, seasonTableId])
  const isTutorial = useMemo(() => (tableId === constants.TABLES.TUTORIAL), [tableId])
  return {
    tableId,
    isSeason,
    isTutorial,
  }
}

//----------------------------------------
// vanilla getter
// (non-React)
//
export const getConfig = () => {
  const entities = useConfigStore.getState().entities
  const config = getEntityModel<models.Config>(entities[configKey], 'Config')
  // console.log(`getConfig() =>`, config)
  return config
}
