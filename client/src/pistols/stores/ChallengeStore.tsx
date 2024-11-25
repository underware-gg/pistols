import { useMemo } from 'react'
import { addAddressPadding } from 'starknet'
import { createDojoStore } from '@dojoengine/sdk'
import { useSdkSubscribeEntities, PistolsSubQuery, PistolsSchemaType } from '@/lib/dojo/hooks/useSdkSub'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { stringToFelt } from '@/lib/utils/starknet'

//
// Stores all challenges from current table
export const useChallengeStore = createDojoStore<PistolsSchemaType>();

//
// Sync all challenges from current table
export function ChallengeStoreSync() {
  const { tableId } = useSettings()
  const query = useMemo<PistolsSubQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: {
              //@ts-ignore
              $eq: addAddressPadding(stringToFelt(tableId)),
            },
          },
        },
      },
    },
  }), [tableId])

  const state = useChallengeStore((state) => state)
  useSdkSubscribeEntities({
    query,
    set: state.setEntities,
    update: state.updateEntity,
  })

  return (<></>)
}
