import { useMemo } from 'react'
import { BigNumberish, CairoCustomEnum, CallData, Calldata } from 'starknet'
import { getEntityIdFromKeys } from '@dojoengine/utils'

//
// make Dojo entity Id from keys
export const keysToEntityId = (keys: BigNumberish[]): string => (getEntityIdFromKeys(keys.map(v => BigInt(v ?? 0))) as string)

//
// make the entity Id for a full CairoCustomEnum built with makeAbiCustomEnum()
export const makeCustomEnumEntityId = (data: CairoCustomEnum | undefined): string | undefined => {
  if (!data) return undefined
  let calldata: Calldata = CallData.compile([data])
  return keysToEntityId(calldata)
}
export const getCustomEnumCalldata = (data: CairoCustomEnum | undefined): string[] | undefined => {
  if (!data) return undefined
  return CallData.compile([data])
}

// same as @dojoengine/sdk/src/react/hooks/useEntityId()
// but the response is always a hex string
export const useEntityId = (keys: BigNumberish[]) => {
  const entityId = useMemo(() => (keys.length > 0 ? keysToEntityId(keys) : '0x0'), [keys])
  return entityId
}

export const useEntityIds = (keys_array: BigNumberish[][]) => {
  const entityIds = useMemo(() => (
    keys_array.map(keys => (keys.length > 0 ? keysToEntityId(keys) : '0x0'))
  ), [keys_array])
  return entityIds
}
