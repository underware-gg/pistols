import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk'
import { useEntityModel, getEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { constants, models, PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { keysToEntity } from '@underware_gg/pistols-sdk/utils'

export const useConfigStore = createDojoStore<PistolsSchemaType>();

const configKey = keysToEntity([constants.CONFIG.CONFIG_KEY])

//--------------------------------
// 'consumer' hooks
//
export const useConfig = () => {
  const entities = useConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[configKey], [entities])

  const config = useEntityModel<models.Config>(entity, 'Config')
  // useEffect(() => console.log(`useConfig() =>`, config), [config])

  const isPaused = useMemo(() => config?.is_paused ?? false, [config])
  const treasuryAddress = useMemo(() => config ? BigInt(config.treasury_address) : null, [config])
  const lordsAddress = useMemo(() => config ? BigInt(config.lords_address) : null, [config])
  return {
    isPaused,
    treasuryAddress,
    lordsAddress,
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
