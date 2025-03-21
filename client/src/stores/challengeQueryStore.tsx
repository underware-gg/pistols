import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDuelistQueryStore } from '/src/stores/duelistQueryStore'
import { useRequiredActions } from '/src/stores/eventsStore'
import { usePlayer } from '/src/stores/playerStore'
import { ChallengeColumn, SortDirection } from '/src/stores/queryParamsStore'
import { PistolsEntity } from '@underware/pistols-sdk/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { parseEnumVariant } from '@underware/pistols-sdk/utils/starknet'
import { keysToEntityId } from '@underware/pistols-sdk/utils/hooks'

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
    const start = Number(challenge.timestamps.start)
    const end = Number(challenge.timestamps.end)
    const state = parseEnumVariant<constants.ChallengeState>(challenge.state)
    return {
      duel_id: BigInt(challenge.duel_id),
      timestamp: end ? end : start,
      state,
      state_value: constants.getChallengeStateValue(state),
      address_a: BigInt(challenge.address_a),
      address_b: BigInt(challenge.address_b),
      duelist_id_a: BigInt(challenge.duelist_id_a),
      duelist_id_b: BigInt(challenge.duelist_id_b),
      duelist_entity_id_a: keysToEntityId([challenge.duelist_id_a]),
      duelist_entity_id_b: keysToEntityId([challenge.duelist_id_b]),
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
  const { requiredDuelIds } = useRequiredActions()

  const entities = useChallengeQueryStore((state) => state.entities);
  const duelistEntities = useDuelistQueryStore((state) => state.entities);
  const targetId = useMemo(() => (isPositiveBigint(playerAddressOrDuelistId) ? BigInt(playerAddressOrDuelistId) : 0n), [playerAddressOrDuelistId, duelistEntities])

  const [challengeIds, states, challengePlayerMap] = useMemo(() => {
    // get all challenges, by duelist (or all)
    let result =
      (targetId > 0n) ?
        Object.values(entities).filter((e) => e.duelist_id_a === targetId || e.duelist_id_b === targetId || e.address_a === targetId || e.address_b === targetId)
        : Object.values(entities)

    // get all current states by duelist
    const states = [] as constants.ChallengeState[]
    
    // add awaiting state if there are required duels
    if (result.some(e => requiredDuelIds.includes(e.duel_id))) {
      states.push(constants.ChallengeState.Awaiting)
    }

    // add remaining states from filtered results
    result
          .filter(e => !requiredDuelIds.includes(e.duel_id))
          .reduce((acc, e) => {
            if (!acc.includes(e.state)) acc.push(e.state)
            return acc
          }, states)

    // filter by bookmarked duels
    if (filterBookmarked) {
      result = result.filter((e) => (bookmarkedDuels.find(p => bigintEquals(p, e.duel_id)) !== undefined))
    }

    // filter by states, with special handling for required action duels
    result = result.filter((e) => {
      if (requiredDuelIds.includes(e.duel_id)) {
        return filterStates.includes(constants.ChallengeState.Awaiting)
      }
      return filterStates.includes(e.state)
    })

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
    
    // create map of challenge ids to player addresses
    const challengePlayerMap = result.reduce((map, e) => {
      map.set(e.duel_id, {
        addressA: e.address_a,
        addressB: e.address_b
      })
      return map
    }, new Map())

    return [challengeIds, states, challengePlayerMap]
  }, [entities, filterStates, filterName, filterBookmarked, targetId, sortColumn, sortDirection, bookmarkedDuels, requiredDuelIds])

  return {
    challengeIds,
    states,
    challengePlayerMap
  }
}
