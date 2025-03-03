import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { keysToEntityId } from 'src/utils/misc/types'

// same as @dojoengine/sdk/src/react/hooks/useEntityId()
// but the response is always a hex string
export const useEntityId = (keys: BigNumberish[]) => {
  const entityId = useMemo(() => (keys.length > 0 ? keysToEntityId(keys) : '0x0'), keys)
  return entityId
}
