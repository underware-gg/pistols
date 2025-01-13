import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'

export const useEventsStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
export function useRequiredActions() {
  const entities = useEventsStore((state) => state.entities)
  const duelIds = useMemo(() => (
    Object.values(entities)
      .map(e => BigInt(e.models.pistols.PlayerRequiredAction?.duel_id ?? 0))
      .filter(id => id > 0n)
  ), [entities])
  // console.log(`useRequiredActions() =================>`, duelIds)
  return {
    duelIds,
  }
}
