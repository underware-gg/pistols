import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware_gg/pistols-sdk/pistols'
import { bigintToHex } from '@underware_gg/pistols-sdk/utils';
import { BigNumberish } from 'starknet';

export const useEventsStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
export function useRequiredActions() {
  const entities = useEventsStore((state) => state.entities)
  const duelPerDuelist = useMemo(() => (
    Object.values(entities)
      .reduce((acc, e) => {
        const duelId = BigInt(e.models.pistols.PlayerRequiredAction?.duel_id ?? 0);
        if (duelId > 0n) {
          let duelistId = bigintToHex(e.models.pistols.PlayerRequiredAction.duelist_id);
          acc[duelistId] = duelId;
        }
        return acc;
      }, {} as Record<string, bigint>)
  ), [entities])
  const requiredDuelIds = useMemo(() => Object.values(duelPerDuelist), [duelPerDuelist])
  // console.log(`useRequiredActions() =================>`, entities, duelPerDuelist, requiredDuelIds)
  return {
    duelPerDuelist,
    requiredDuelIds,
  }
}

export function useDuelRequiredsAction(duel_id: BigNumberish) {
  const { requiredDuelIds } = useRequiredActions()
  return requiredDuelIds.includes(BigInt(duel_id))
}
