import { useEffect, useMemo } from 'react'
import { addAddressPadding } from 'starknet'
import { useSdkSubscribeEntities, PistolsQuery, PistolsEntity } from '@/lib/dojo/hooks/useSdkSub'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { ChallengeColumn, SortDirection } from '@/pistols/hooks/QueryContext'
import { stringToFelt } from '@/lib/utils/starknet'
import { ChallengeState, getChallengeStateValue } from '@/games/pistols/generated/constants'
import { create } from 'zustand'

//
// Stores only the entity ids and sorting data from a challenges query
// to get challenge data, use challengeStore
//

interface StateEntity {
  duelId: bigint
  timestamp: number
  state: ChallengeState
  state_value: number
  duelist_id_a: bigint
  duelist_id_b: bigint
}
interface StateEntities {
  [entityId: string]: StateEntity,
}
interface State {
  entities: StateEntities,
  setEntities: (entities: PistolsEntity[]) => void;
  updateEntity: (entity: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEntity = (e: PistolsEntity) => {
    const start = Number(e.models.pistols.Challenge.timestamp_start)
    const end = Number(e.models.pistols.Challenge.timestamp_end)
    const state = e.models.pistols.Challenge.state as unknown as ChallengeState
    return {
      duelId: BigInt(e.models.pistols.Challenge.duel_id),
      timestamp: end ? end : start,
      state,
      state_value: getChallengeStateValue(state),
      duelist_id_a: BigInt(e.models.pistols.Challenge.duelist_id_a),
      duelist_id_b: BigInt(e.models.pistols.Challenge.duelist_id_b),
    }
  }
  return create<State>()((set) => ({
    entities: {},
    setEntities: (entities: PistolsEntity[]) => {
      // console.warn("setEntities() =>", entities)
      set((state: State) => ({
        entities: entities.reduce((acc, e) => {
          acc[e.entityId] = _parseEntity(e)
          return acc
        }, {} as StateEntities)
      }))
    },
    updateEntity: (e: PistolsEntity) => {
      set((state: State) => {
        state.entities[e.entityId] = _parseEntity(e)
        return state
      });
    },
  }))
}

const useStore = createStore();

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
              //
              // THIS IS NOT WORKING... (in conjunction with table_id)
              // but this is ok! better to filter on useChallengeQueryIds()
              // 
              // {
              //   Or: [
              //     //@ts-ignore
              //     { state: { $eq: ChallengeState.Resolved } },
              //     //@ts-ignore
              //     { state: { $eq: ChallengeState.Draw } },
              //   ],
              // },
            ],
          },
        },
      },
    },
  }), [tableId])

  const state = useStore((state) => state)

  useSdkSubscribeEntities({
    query,
    setEntities: state.setEntities,
    updateEntity: state.updateEntity,
  })

  useEffect(() => console.log("ChallengeQueryStoreSync() =>", state.entities), [state.entities])

  return (<></>)
}


//--------------------------------
// 'consumer' hooks
// will filter and sort all challenges for each view
//
export const useChallengeQueryIds = (
  filterStates: ChallengeState[],
  duelistId: bigint,
  sortColumn: ChallengeColumn,
  sortDirection: SortDirection,
) => {
  const entities = useStore((state) => state.entities);

  const [challengeIds, states] = useMemo(() => {
    // get all challenges, by duelist (or all)
    let result =
      (duelistId > 0n) ?
        Object.values(entities).filter((e) => e.duelist_id_a === duelistId || e.duelist_id_b === duelistId)
        : Object.values(entities)

    // get all current states by duelist
    const states = result.reduce((acc, e) => {
      if (!acc.includes(e.state)) acc.push(e.state)
      return acc
    }, [] as ChallengeState[])
    
    // filter by states
    result = result.filter((e) => filterStates.includes(e.state))

    // sort...
    if (sortColumn === ChallengeColumn.Time) {
      result.sort((a, b) => sortDirection === SortDirection.Ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp)
    } else if (sortColumn === ChallengeColumn.Status) {
      result.sort((a, b) => sortDirection === SortDirection.Ascending ? a.state_value - b.state_value : b.state_value - a.state_value)
    }

    // return ids only
    const challengeIds = result.map((e) => e.duelId)
    return [challengeIds, states]
  }, [entities, filterStates, duelistId, sortColumn, sortDirection])

  return {
    challengeIds,
    states,
  }
}
