import { useMemo, useEffect } from 'react'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkEntities, PistolsGetQuery, PistolsSubQuery, PistolsSchemaType, useEntityModel, models } from '@/lib/dojo/hooks/useSdkEntities'
import { useEntityId } from '@/lib/utils/hooks/useEntityId'
import { CONFIG } from '@/games/pistols/generated/constants'
import { keysToEntity } from '@/lib/utils/types'

const useStore = createDojoStore<PistolsSchemaType>();

//
// Sync all tables
// Add only once to a top level component

const query_get: PistolsGetQuery = {
  pistols: {
    Config: {
      $: {
        where: {
          key: { $eq: CONFIG.CONFIG_KEY },
        },
      },
    },
  },
}
const query_sub: PistolsSubQuery = {
  pistols: {
    Config: {
      $: {
        where: {
          key: { $is: CONFIG.CONFIG_KEY },
        },
      },
    },
  },
}

export function ConfigStoreSync() {
  const state = useStore((state) => state)

  useSdkEntities({
    query_get,
    query_sub,
    setEntities: state.setEntities,
    // updateEntity: state.updateEntity, // no need to sync!
    enabled: (Object.keys(state.entities).length == 0),
  })

  // useEffect(() => console.log("ConfigStoreSync() =>", state.entities), [state.entities])

  return (<></>)
}

export const useConfig = () => {
  const entityId = useEntityId([CONFIG.CONFIG_KEY])
  const entities = useStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

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
  const entities = useStore.getState().entities;
  const entity = entities[keysToEntity([CONFIG.CONFIG_KEY])]
  const config = entity?.models.pistols.Config as models.Config
  console.log(`getConfig() =>`, config)
  return config
}
