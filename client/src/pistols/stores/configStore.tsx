import { useMemo, useEffect } from 'react'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkEntities, PistolsSubQuery, PistolsSchemaType, useEntityModel, models } from '@/lib/dojo/hooks/useSdkEntities'
import { useEntityId } from '@/lib/utils/hooks/useEntityId'
import { CONFIG } from '@/games/pistols/generated/constants'

const useStore = createDojoStore<PistolsSchemaType>();

//
// Sync all tables
// Add only once to a top level component

const query: PistolsSubQuery = {
  pistols: {
    Config: {
      $: {
        where: {
          key: {
            //@ts-ignore
            $eq: CONFIG.CONFIG_KEY,
          },
        },
      },
    },
  },
}

export function ConfigStoreSync() {
  const state = useStore((state) => state)

  useSdkEntities({
    query,
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
