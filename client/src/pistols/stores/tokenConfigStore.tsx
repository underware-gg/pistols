import { useMemo, useEffect } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkEntities, PistolsSubQuery, PistolsSchemaType, useEntityModel, models } from '@/lib/dojo/hooks/useSdkEntities'
import { useEntityId } from '@/lib/utils/hooks/useEntityId'

const useStore = createDojoStore<PistolsSchemaType>();

const query_sub: PistolsSubQuery = {
  pistols: {
    TokenConfig: []
  },
}

// Sync entities: Add only once to a top level component
export function TokenConfigStoreSync() {
  const state = useStore((state) => state)

  useSdkEntities({
    query_get: query_sub,
    query_sub,
    setEntities: state.setEntities,
    updateEntity: state.updateEntity,
  })

  // useEffect(() => console.log("TokenConfigStoreSync() =>", state.entities), [state.entities])

  return (<></>)
}

export const useTokenConfig = (contractAddress: BigNumberish) => {
  const entityId = useEntityId([contractAddress])
  const entities = useStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const tokenConfig = useEntityModel<models.TokenConfig>(entity, 'TokenConfig')
  // useEffect(() => console.log(`useTokenConfig() =>`, tokenConfig), [tokenConfig])

  const mintedCount = useMemo(() => (tokenConfig?.minted_count ?? null), [tokenConfig])

  return {
    mintedCount,
    isPending: (tokenConfig == null),
  }
}
