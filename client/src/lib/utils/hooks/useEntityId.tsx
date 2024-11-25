import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { keysToEntity } from '@/lib/utils/types'

export const useEntityId = (keys: BigNumberish[]) => {
  const entityId = useMemo(() => keysToEntity(keys), keys)
  return entityId
}
