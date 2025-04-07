import { useMemo } from 'react'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsSchemaType } from '@underware/pistols-sdk/pistols'
import { bigintToHex } from '@underware/pistols-sdk/utils';
import { BigNumberish } from 'starknet';

export const useEventsStore = createDojoStore<PistolsSchemaType>();


//--------------------------------
// 'consumer' hooks
//
type CallToActionDuel = {
  duelId: bigint;
  callToAction: boolean;
  timestamp: number;
}
export function useCallToActions() {
  const entities = useEventsStore((state) => state.entities)
  const duelPerDuelist = useMemo(() => (
    Object.values(entities)
      .reduce((acc, e) => {
        const callToAction = e.models.pistols.CallToActionEvent
        if (callToAction) {
          const duelId = BigInt(callToAction.duel_id ?? 0);
          if (duelId > 0n) {
            let duelistId = bigintToHex(callToAction.duelist_id);
            acc[duelistId] = {
              duelId,
              callToAction: callToAction.call_to_action,
              timestamp: Number(callToAction.timestamp),
            }
          }
        }
        return acc;
      }, {} as Record<string, CallToActionDuel>)
  ), [entities])
  const requiredDuelIds = useMemo(() => Object.values(duelPerDuelist).map((duel) => duel.duelId), [duelPerDuelist])
  const requiresAction = useMemo(() => (requiredDuelIds.length > 0), [requiredDuelIds])
  // console.log(`useCallToActions() =================>`, entities, duelPerDuelist, requiredDuelIds)
  return {
    requiresAction,
    duelPerDuelist,
    requiredDuelIds,
  }
}

export function useDuelCallToAction(duel_id: BigNumberish) {
  const { requiredDuelIds } = useCallToActions()
  return requiredDuelIds.includes(BigInt(duel_id))
}

export function useDuelistCallToAction(duelist_id: BigNumberish) {
  const { duelPerDuelist } = useCallToActions()
  return !!duelPerDuelist[bigintToHex(duelist_id)]
}

