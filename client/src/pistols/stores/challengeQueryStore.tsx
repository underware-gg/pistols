import { useEffect, useMemo } from 'react'
import { addAddressPadding } from 'starknet'
import { useSdkSubscribeEntities, PistolsQuery } from '@/lib/dojo/hooks/useSdkSub'
import { createEntityIdsStore } from '@/pistols/stores/useEntityIdsStore'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { stringToFelt } from '@/lib/utils/starknet'
import { ChallengeState } from '@/games/pistols/generated/constants'

//
// Stores only the entity ids from a challenges query
// to get challenge data, use challengeStore
export const usePastDuelsEntityIdsStore = createEntityIdsStore();

//
// Sync all challenges from current table
// Add only once to a top level component
export function ChallengeQueryStoreSync() {
  const { tableId } = useSettings()
  const query = useMemo<PistolsQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            And: [
              { table_id: { $eq: addAddressPadding(stringToFelt(tableId)) } },
              //@ts-ignore
              // { state: { $eq: ChallengeState.Resolved } },
              {
                Or: [
                  //@ts-ignore
                  { state: { $eq: ChallengeState.Resolved } },
                  //@ts-ignore
                  { state: { $eq: ChallengeState.Draw } },
                ],
              },
            ],
          },
        },
      },
    },
  }), [tableId])

  const state = usePastDuelsEntityIdsStore((state) => state)

  useSdkSubscribeEntities({
    query,
    set: state.setEntities,
    update: state.updateEntity,
  })

  useEffect(() => console.log("ChallengeQueryStoreSync() =>", state.entityIds), [state.entityIds])

  return (<></>)
}

