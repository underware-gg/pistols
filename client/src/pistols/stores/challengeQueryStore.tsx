import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useAccount } from '@starknet-react/core'
import { useDuelistQueryStore } from '@/pistols/stores/duelistQueryStore'
import { usePlayer } from '@/pistols/stores/playerStore'
import { PistolsEntity } from '@/lib/dojo/hooks/useSdkTypes'
import { ChallengeColumn, SortDirection } from '@/pistols/stores/queryParamsStore'
import { ChallengeState, getChallengeStateValue } from '@/games/pistols/generated/constants'
import { bigintEquals, keysToEntity } from '@/lib/utils/types'


//-----------------------------------------
// Stores only the entity ids and sorting data from a challenges query
// to get challenge data, use challengeStore
//
interface StateEntity {
  duel_id: bigint
  timestamp: number
  state: ChallengeState
  state_value: number
  duelist_id_a: bigint
  duelist_id_b: bigint
  duelist_entity_id_a: string
  duelist_entity_id_b: string
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
    const challenge = e.models.pistols.Challenge
    if (!challenge) return undefined
    const start = Number(challenge.timestamp_start)
    const end = Number(challenge.timestamp_end)
    const state = challenge.state as unknown as ChallengeState
    return {
      duel_id: BigInt(challenge.duel_id),
      timestamp: end ? end : start,
      state,
      state_value: getChallengeStateValue(state),
      duelist_id_a: BigInt(challenge.duelist_id_a),
      duelist_id_b: BigInt(challenge.duelist_id_b),
      duelist_entity_id_a: keysToEntity([challenge.duelist_id_a]),
      duelist_entity_id_b: keysToEntity([challenge.duelist_id_b]),
    }
  }
  return create<State>()(immer((set) => ({
    entities: {},
    setEntities: (entities: PistolsEntity[]) => {
      // console.warn("setEntities() =>", entities)
      set((state: State) => {
        state.entities = entities.reduce((acc, e) => {
          const value = _parseEntity(e)
          if (value) {
            acc[e.entityId] = value
          }
          return acc
        }, {} as StateEntities)
      })
    },
    updateEntity: (e: PistolsEntity) => {
      set((state: State) => {
        const value = _parseEntity(e)
        if (value) {
          state.entities[e.entityId] = value
        }
      });
    },
  })))
}

export const useChallengeQueryStore = createStore();


//--------------------------------
// 'consumer' hooks
// will filter and sort all challenges for each view
//
export const useQueryChallengeIds = (
  filterStates: ChallengeState[],
  filterName: string,
  filterBookmarked: boolean,
  duelistId: bigint,
  sortColumn: ChallengeColumn,
  sortDirection: SortDirection,
) => {
  const { address } = useAccount()
  const { bookmarkedDuels } = usePlayer(address)
  const entities = useChallengeQueryStore((state) => state.entities);
  const duelistEntities = useDuelistQueryStore((state) => state.entities);

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

    // filter by bookmarked duels
    if (filterBookmarked) {
      result = result.filter((e) => (bookmarkedDuels.find(p => bigintEquals(p, e.duel_id)) !== undefined))
    }

    // filter by states
    result = result.filter((e) => filterStates.includes(e.state))

    // filter by name
    if (filterName) {
      result = result.filter((e) => (
        duelistEntities[e.duelist_entity_id_a].name.includes(filterName) ||
        duelistEntities[e.duelist_entity_id_b].name.includes(filterName)
      ))
    }

    // sort...
    if (sortColumn === ChallengeColumn.Time) {
      result.sort((a, b) => sortDirection === SortDirection.Ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp)
    } else if (sortColumn === ChallengeColumn.Status) {
      result.sort((a, b) => sortDirection === SortDirection.Ascending ? a.state_value - b.state_value : b.state_value - a.state_value)
    }

    // return ids only
    const challengeIds = result.map((e) => e.duel_id)
    return [challengeIds, states]
  }, [entities, filterStates, filterName, filterBookmarked, duelistId, sortColumn, sortDirection, bookmarkedDuels])

  return {
    challengeIds,
    states,
  }
}
