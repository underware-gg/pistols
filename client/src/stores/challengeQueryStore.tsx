import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useAccount } from '@starknet-react/core'
import { useDuelistQueryStore } from '/src/stores/duelistQueryStore'
import { usePlayer } from '/src/stores/playerStore'
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore'
import { constants, PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { bigintEquals, isPositiveBigint, keysToEntity } from '@underware_gg/pistols-sdk/utils'
import { BigNumberish } from 'starknet'


//-----------------------------------------
// Stores only the entity ids and sorting data from a challenges query
// to get challenge data, use challengeStore
//
interface StateEntity {
  duel_id: bigint
  timestamp: number
  state: constants.ChallengeState
  state_value: number
  address_a: bigint
  address_b: bigint
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
    const state = challenge.state as unknown as constants.ChallengeState
    return {
      duel_id: BigInt(challenge.duel_id),
      timestamp: end ? end : start,
      state,
      state_value: constants.getChallengeStateValue(state),
      address_a: BigInt(challenge.address_a),
      address_b: BigInt(challenge.address_b),
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
  filterStates: constants.ChallengeState[],
  filterName: string,
  filterBookmarked: boolean,
  playerAddressOrDuelistId: BigNumberish,
  sortColumn: ChallengeColumn,
  sortDirection: SortDirection,
) => {
  const { address } = useAccount()
  const { bookmarkedDuels } = usePlayer(address)
  const entities = useChallengeQueryStore((state) => state.entities);
  const duelistEntities = useDuelistQueryStore((state) => state.entities);
  const targetId = useMemo(() => (isPositiveBigint(playerAddressOrDuelistId) ? BigInt(playerAddressOrDuelistId) : 0n), [playerAddressOrDuelistId, duelistEntities])

  const [challengeIds, states] = useMemo(() => {
    // get all challenges, by duelist (or all)
    let result =
      (targetId > 0n) ?
        Object.values(entities).filter((e) => e.duelist_id_a === targetId || e.duelist_id_b === targetId || e.address_a === targetId || e.address_b === targetId)
        : Object.values(entities)

    // get all current states by duelist
    const states = result.reduce((acc, e) => {
      if (!acc.includes(e.state)) acc.push(e.state)
      return acc
    }, [] as constants.ChallengeState[])

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
  }, [entities, filterStates, filterName, filterBookmarked, targetId, sortColumn, sortDirection, bookmarkedDuels])

  return {
    challengeIds,
    states,
  }
}
