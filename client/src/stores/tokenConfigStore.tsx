import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { useEntityId } from '@underware_gg/pistols-sdk/utils/hooks'
import { useEntityModel } from '@underware_gg/pistols-sdk/dojo'
import { models } from '@underware_gg/pistols-sdk/pistols/gen'

export const useTokenConfigStore = createDojoStore<PistolsSchemaType>();

export const useTokenConfig = (contractAddress: BigNumberish) => {
  const entityId = useEntityId([contractAddress])
  const entities = useTokenConfigStore((state) => state.entities);
  const entity = useMemo(() => entities[entityId], [entities[entityId]])

  const tokenConfig = useEntityModel<models.TokenConfig>(entity, 'TokenConfig')
  // useEffect(() => console.log(`useTokenConfig() =>`, tokenConfig), [tokenConfig])

  const mintedCount = useMemo(() => (tokenConfig?.minted_count ?? null), [tokenConfig])

  return {
    mintedCount,
    isLoading: (tokenConfig == null),
  }
}
