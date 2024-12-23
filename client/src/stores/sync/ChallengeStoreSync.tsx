import { useMemo } from 'react'
import { addAddressPadding } from 'starknet'
import { useSettings } from '@/hooks/SettingsContext'
import { useSdkEntities } from '@underware_gg/pistols-sdk/dojo'
import { PistolsGetQuery, PistolsSubQuery, PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { useChallengeQueryStore } from '@/stores/challengeQueryStore'
import { useChallengeStore } from '@/stores/challengeStore'
import { useMounted } from '@underware_gg/pistols-sdk/hooks'
import { stringToFelt } from '@underware_gg/pistols-sdk/utils'


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
