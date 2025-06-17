import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType, getEntityModel } from '@underware/pistols-sdk/pistols/sdk'
import { keysToEntityId, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { models } from '@underware/pistols-sdk/pistols/gen'

export const useTokenConfigStore = createDojoStore<PistolsSchemaType>();

export const useTokenConfig = (contractAddress: BigNumberish) => {
  const entities = useTokenConfigStore((state) => state.entities);
  const tokenConfig = useStoreModelsByKeys<models.TokenConfig>(entities, 'TokenConfig', [contractAddress])
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
