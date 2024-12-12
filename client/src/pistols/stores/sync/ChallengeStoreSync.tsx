import { useMemo } from 'react'
import { addAddressPadding } from 'starknet'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useSdkEntities, PistolsGetQuery,PistolsSubQuery, PistolsEntity } from '@/lib/dojo/hooks/useSdkEntities'
import { useChallengeQueryStore } from '@/pistols/stores/challengeQueryStore'
import { useChallengeStore } from '@/pistols/stores/challengeStore'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { stringToFelt } from '@/lib/utils/starknet'


//------------------------------------------------------
// Sync everything that depends on current season
// !!! Add only once to a top level component !!!
//
export function ChallengeStoreSync() {
  const { tableId } = useSettings()
  const query_get = useMemo<PistolsGetQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: { $eq: addAddressPadding(stringToFelt(tableId)) },
          },
        },
      },
    },
  }), [tableId])
  const query_sub = useMemo<PistolsSubQuery>(() => ({
    pistols: {
      Challenge: {
        $: {
          where: {
            table_id: { $is: addAddressPadding(stringToFelt(tableId)) },
          },
        },
      },
      Round: [],
    },
  }), [tableId])

  const challengeState = useChallengeStore((state) => state)
  const queryState = useChallengeQueryStore((state) => state)

  const mounted = useMounted()

  useSdkEntities({
    query_get,
    query_sub,
    enabled: mounted,
    setEntities: (entities: PistolsEntity[]) => {
      challengeState.setEntities(entities)
      queryState.setEntities(entities)
    },
    updateEntity: (entity: PistolsEntity) => {
      challengeState.updateEntity(entity)
      queryState.updateEntity(entity)
    },
  })

  // useEffect(() => console.log(`ChallengeStoreSync() [${Object.keys(state.entities).length}] =>`, state.entities), [state.entities])

  return (<></>)
}
