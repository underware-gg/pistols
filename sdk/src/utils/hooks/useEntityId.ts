import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { keysToEntity } from 'src/utils/misc/types'

export const useEntityId = (keys: BigNumberish[]) => {
  const entityId = useMemo(() => keysToEntity(keys), keys)
  return entityId
}
