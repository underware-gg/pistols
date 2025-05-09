import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { PistolsEntity } from '@underware/pistols-sdk/pistols'
import { arrayRemoveValue, bigintEquals, bigintToHex, bigintToNumber, isPositiveBigint, shortAddress, sortObjectByValue } from '@underware/pistols-sdk/utils'
import { models } from '@underware/pistols-sdk/pistols/gen'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { SortDirection } from './queryParamsStore'
import { PlayerColumn } from './queryParamsStore'
import { useTotals } from './duelistStore'

export interface PlayerState {
  player_address: string
  timestamp_registered: number
  username: string
  name: string
  isNew: boolean
  totals: models.Totals
  aliveDuelistCount: number
  // off-chain messages
  bookmarked_players: string[]
  bookmarked_tokens: {
    [address: string]: bigint[]
  }
}
interface PlayersByAddress {
  [address: string]: PlayerState
}
interface TimestampByAddress {
  [address: string]: number
}
interface State {
  players: PlayersByAddress,
  players_online: TimestampByAddress,
  setEntities: (entities: PistolsEntity[]) => void;
  updateEntity: (entity: PistolsEntity) => void;
  updateMessages: (entities: PistolsEntity[]) => void;
  updateUsernames: (usernames: Map<string, string>) => void;
}

const createStore = () => {
  const _parseEntity = (e: PistolsEntity): PlayerState | undefined => {
    const model: Partial<models.Player> | undefined = e.models.pistols.Player
    return isPositiveBigint(model?.player_address) ? {
      player_address: bigintToHex(model.player_address),
      timestamp_registered: bigintToNumber(model.timestamps.registered),
      username: shortAddress(model.player_address),
      name: shortAddress(model.player_address),
      isNew: true,
      totals: model.totals,
      aliveDuelistCount: bigintToNumber(model.alive_duelist_count),
      // off-chain messages
      bookmarked_players: [],
      bookmarked_tokens: {},
    } : undefined
  }
  return create<State>()(immer((set) => ({
    players: {},
    players_online: {},
    setEntities: (entities: PistolsEntity[]) => {
      // console.log("setEntities()[Player] =>", entities)
      set((state: State) => {
        state.players = entities.sort((a, b) => (
          Number(b.models.pistols.Player?.timestamps.registered ?? 0) - Number(a.models.pistols.Player?.timestamps.registered ?? 0)
        )).reduce((acc, e) => {
          const player = _parseEntity(e)
          if (player) {
            acc[player.player_address] = player
          }
          return acc
        }, {} as PlayersByAddress)
      })
    },
    updateEntity: (e: PistolsEntity) => {
      // console.log("updateEntity()[Player] =>", e)
      set((state: State) => {
        // only insert!
        const player = _parseEntity(e)
        if (!state.players[player.player_address]) {
          state.players[player.player_address] = player
        }
      });
    },
    updateMessages: (entities: PistolsEntity[]) => {
      // console.log("updateMessages()[Player] =>", entities)
      set((state: State) => {
        entities.forEach((e) => {
          const online = e.models.pistols.PlayerOnline
          if (online) {
            const address = bigintToHex(online.identity)
            state.players_online[address] = bigintToNumber(online.timestamp)
          }
          const bookmark = e.models.pistols.PlayerBookmark
          if (bookmark) {
            const address = bigintToHex(bookmark.identity)
            if (state.players[address]) {
              const target_address = bigintToHex(bookmark.target_address)
              const target_id = BigInt(bookmark.target_id)
              if (target_id == 0n) {
                // Bookmarking player
                const isBookmarked = state.players[address].bookmarked_players.includes(target_address)
                if (bookmark.enabled && !isBookmarked) {
                  state.players[address].bookmarked_players.push(target_address)
                } else if (!bookmark.enabled && isBookmarked) {
                  state.players[address].bookmarked_players = arrayRemoveValue(state.players[address].bookmarked_players, target_address)
                }
              } else {
                // Bookmarking token
                const isBookmarked = state.players[address].bookmarked_tokens[target_address]?.includes(target_id)
                if (bookmark.enabled && !isBookmarked) {
                  if (!state.players[address].bookmarked_tokens[target_address]) {
                    state.players[address].bookmarked_tokens[target_address] = []
                  }
                  state.players[address].bookmarked_tokens[target_address].push(target_id)
                } else if (!bookmark.enabled && isBookmarked) {
                  state.players[address].bookmarked_tokens[target_address] = arrayRemoveValue(state.players[address].bookmarked_tokens[target_address], target_id)
                }
              }
            }
          }
        })
      });
    },
    updateUsernames: (usernames: Map<string, string>) => {
      // console.log("updateUsername()[Player] =>", usernames)
      set((state: State) => {
        usernames.forEach((value: string, key: string) => {
          const _key = bigintToHex(key)
          if (state.players[_key]) {
            state.players[_key].username = value
            state.players[_key].name = value
            state.players[_key].isNew = false
          }
        })
        // console.log("updateUsername()[Player] =>", usernames, state.players)
      });
    },
  })))
}

export const usePlayerStore = createStore();


//--------------------------------
// 'consumer' hooks
//

export const usePlayer = (address: BigNumberish) => {
  const key = useMemo(() => (bigintToHex(address)), [address])
  const players = usePlayerStore((state) => state.players)
  const player = useMemo(() => (players[key]), [players[key]])

  const isNew = useMemo(() => (player?.isNew ?? false), [player])
  const username = useMemo(() => (player?.username ?? undefined), [player])
  const name = useMemo(() => (player?.name ?? 'Unknown'), [player])
  const timestampRegistered = useMemo(() => (player?.timestamp_registered ?? 0), [player])
  const aliveDuelistCount = useMemo(() => (player?.aliveDuelistCount ?? 0), [player])
  const bookmarkedPlayers = useMemo(() => (player?.bookmarked_players ?? []), [player])
  const bookmarkedTokens = useMemo(() => (player?.bookmarked_tokens ?? {}), [player])
  const totals = useTotals(player?.totals)

  // TODO... check if completed tutorial from Activity events
  const hasFinishedTutorial = false
  const isAvailable = false

  const {
    duelContractAddress,
    duelistContractAddress,
  } = useTokenContracts()
  const bookmarkedDuels = useMemo(() => (player?.bookmarked_tokens?.[duelContractAddress as string] ?? []), [player])
  const bookmarkedDuelists = useMemo(() => (player?.bookmarked_tokens?.[duelistContractAddress as string] ?? []), [player])

  // useEffect(() => console.log("usePlayer() =>", username, key, player), [player, username])

  return {
    isNew,
    address,
    username,
    name,
    timestampRegistered,
    aliveDuelistCount,
    bookmarkedPlayers,
    bookmarkedTokens,
    bookmarkedDuels,
    bookmarkedDuelists,
    hasFinishedTutorial,
    isAvailable,
    totals,
  }
}

export const useIsBookmarked = (target_address: BigNumberish, target_id: BigNumberish = 0) => {
  const { address } = useAccount()
  const { bookmarkedPlayers, bookmarkedTokens } = usePlayer(address)
  const isBookmarked = useMemo(() => (
    target_id == 0n
      ? bookmarkedPlayers.includes(bigintToHex(target_address))
      : bookmarkedTokens[bigintToHex(target_address)]?.includes(BigInt(target_id))
  ), [bookmarkedPlayers, bookmarkedTokens, target_address, target_id])
  return {
    isBookmarked,
  }
}

export const usePlayersOnline = () => {
  const players_online = usePlayerStore((state) => state.players_online)
  const playersOnline = useMemo(() => sortObjectByValue(players_online, (a, b) => (b - a)), [players_online])
  return {
    playersOnline,
  }
}

//----------------------------------------
// vanilla getter
// (non-React)
//
export const getPlayerName = (address: BigNumberish): string  | undefined => {
  const players = usePlayerStore.getState().players
  return players[bigintToHex(address)]?.name
}

export const getPlayerOnlineStatus = (address: BigNumberish): boolean => {
  const players_online = usePlayerStore((state) => state.players_online);
  return players_online[bigintToHex(address)] !== undefined
}


export const useQueryPlayerIds = (
  filterName: string,
  filterOnline: boolean,
  filterBookmarked: boolean,
  sortColumn: PlayerColumn,
  sortDirection: SortDirection,
) => {
  const { address } = useAccount()
  const { bookmarkedDuelists } = usePlayer(address)
  const entities = usePlayerStore((state) => state.players);
  
  const players_online = usePlayerStore((state) => state.players_online);

  const playerIds = useMemo(() => {
    let result = Object.values(entities);

    result = result.filter((e) => (e.player_address !== bigintToHex(address)))

    // filter by name
    if (filterName) {
      result = result.filter((e) => e.name.includes(filterName))
    }

    // filter by bookmarked duelists
    if (filterBookmarked) {
      result = result.filter((e) => (bookmarkedDuelists.find(p => bigintEquals(p, e.player_address)) !== undefined))
    }

    // filter by active
    if (filterOnline) {
      result = result.filter((e) => (players_online[e.player_address] !== undefined))
    }

    // sort...
    result = result.sort((player_a, player_b) => {
      // Sort by names, or both rookies
      const _sortByName = (a: string, b: string) => {
        return isAscending ? a.localeCompare(player_b.name) : b.localeCompare(player_a.name)
      }
      const isAscending = (sortDirection == SortDirection.Ascending)
      if (sortColumn == PlayerColumn.Name) {
        return _sortByName(player_a.name, player_b.name)
      }

      // Sort by values
      const _sortTotals = (a: number, b: number) => {
        return (!isAscending ? (b - a) : (a - b))
        // return (!isAscending ? (b - a) : (a && !b) ? -1 : (!a && b) ? 1 : (a - b))
      }
      if (sortColumn == PlayerColumn.Timestamp) return _sortTotals(player_a.timestamp_registered, player_b.timestamp_registered)
      return 0
    })

    // return ids only
    return result.map((e) => e.player_address)
  }, [entities, filterName, filterOnline, sortColumn, sortDirection, filterBookmarked, bookmarkedDuelists, address, players_online])

  return {
    playerIds,
  }
}