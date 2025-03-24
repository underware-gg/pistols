import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols'
import { bigintToHex } from '@underware/pistols-sdk/utils';
import { BigNumberish } from 'starknet';

export const useEventsStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
type RequiredActionDuel = {
  duelId: bigint;
  requiredAction: boolean;
  timestamp: number;
}
export function useRequiredActions() {
  const entities = useEventsStore((state) => state.entities)
  const duelPerDuelist = useMemo(() => (
    Object.values(entities)
      .reduce((acc, e) => {
        const requiredAction = e.models.pistols.PlayerRequiredAction
        if (requiredAction) {
          const duelId = BigInt(requiredAction.duel_id ?? 0);
          if (duelId > 0n) {
            let duelistId = bigintToHex(requiredAction.duelist_id);
            acc[duelistId] = {
              duelId,
              requiredAction: requiredAction.required_action,
              timestamp: Number(requiredAction.timestamp),
            }
          }
        }
        return acc;
      }, {} as Record<string, RequiredActionDuel>)
  ), [entities])
  const requiredDuelIds = useMemo(() => Object.values(duelPerDuelist).map((duel) => duel.duelId), [duelPerDuelist])
  const requiresAction = useMemo(() => (requiredDuelIds.length > 0), [requiredDuelIds])
  // console.log(`useRequiredActions() =================>`, entities, duelPerDuelist, requiredDuelIds)
  return {
    requiresAction,
    duelPerDuelist,
    requiredDuelIds,
  }
}

export function useDuelRequiresAction(duel_id: BigNumberish) {
  const { requiredDuelIds } = useRequiredActions()
  return requiredDuelIds.includes(BigInt(duel_id))
}

export function useDuelistRequiresAction(duelist_id: BigNumberish) {
  const { duelPerDuelist } = useRequiredActions()
  return !!duelPerDuelist[bigintToHex(duelist_id)]
}

