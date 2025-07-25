import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { keysToEntityId, useStoreModelsById } from '@underware/pistols-sdk/dojo'
import { PistolsSchemaType, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { constants, models } from '@underware/pistols-sdk/pistols/gen'

export const useConfigStore = createDojoStore<PistolsSchemaType>();

const configKey = keysToEntityId([constants.CONFIG.CONFIG_KEY])


//--------------------------------
// 'consumer' hooks
//
export const useConfig = () => {
  const entities = useConfigStore((state) => state.entities);
  const config = useStoreModelsById<models.Config>(entities, 'Config', configKey)
  // useEffect(() => console.log(`useConfig() =>`, config), [config])

  const isPaused = useMemo(() => (config?.is_paused ?? false), [config])
  const currentSeasonId = useMemo(() => (config ? Number(config.current_season_id) : undefined), [config])

  const treasuryAddress = useMemo(() => (config ? BigInt(config.treasury_address) : undefined), [config])
  const lordsAddress = useMemo(() => (config ? BigInt(config.lords_address) : undefined), [config])
  const vrfAddress = useMemo(() => (config ? BigInt(config.vrf_address) : undefined), [config])

  return {
    isPaused,
    currentSeasonId,
    // accounts
    treasuryAddress,
    lordsAddress,
    vrfAddress,
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
