import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { useEntityId, keysToEntityId, useEntityModel, getEntityModel } from '@underware/pistols-sdk/dojo'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const useTokenConfigStore = createDojoStore<PistolsSchemaType>();

export const useTokenConfig = (contractAddress: BigNumberish) => {
  const entityId = useEntityId([contractAddress])
  const entities = useTokenConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const tokenConfig = useEntityModel<models.TokenConfig>(entity, 'TokenConfig')
  // useEffect(() => console.log(`useTokenConfig() =>`, tokenConfig), [tokenConfig])

  const mintedCount = useMemo(() => (tokenConfig ? Number(tokenConfig.minted_count) : null), [tokenConfig])

  return {
    mintedCount,
    isLoading: (tokenConfig == null),
  }
}


//----------------------------------------
// vanilla getter
// (non-React)
//
export const getMintedCount = (contractAddress: BigNumberish): number => {
  const entities = useTokenConfigStore.getState().entities
  const entityId = keysToEntityId([contractAddress])
  const tokenConfig = getEntityModel<models.TokenConfig>(entities[entityId], 'TokenConfig')
  return (tokenConfig ? Number(tokenConfig.minted_count) : 0)
}
