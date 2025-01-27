import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
// FIX: dojo.js 1.0.12 createDojoStore()
import type { GameState } from '@dojoengine/sdk/state'
import { StoreApi, UseBoundStore } from 'zustand'

export const useEventsStore = createDojoStore<PistolsSchemaType>() as UseBoundStore<StoreApi<GameState<PistolsSchemaType>>>;


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
