import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsEntity, PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { arrayRemoveValue, bigintEquals, bigintToHex, bigintToNumber, sortObjectByValue } from '@underware/pistols-sdk/utils'
import { useEntitiesModel, useEntityModelByKeys } from '@underware/pistols-sdk/dojo'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useTokenStore } from '/src/stores/tokenStore'
import { SortDirection } from '/src/stores/queryParamsStore'
import { PlayerColumn } from '/src/stores/queryParamsStore'
import { useTotals } from '/src/stores/duelistStore'
import { models } from '@underware/pistols-sdk/pistols/gen'

interface NamesByAddress {
  [address: string]: string
}
interface TimestampByAddress {
  [address: string]: number
}
interface PlayerBookmarksByAddress {
  [address: string]: bigint[]
}
interface TokenBookmarksByAddress {
  [address: string]: {
    [address: string]: bigint[]
  }
}
interface State {
  players_names: NamesByAddress,
  players_online: TimestampByAddress,
  player_bookmarks: PlayerBookmarksByAddress,
  token_bookmarks: TokenBookmarksByAddress,
  updateUsernames: (usernames: Map<string, string>) => void;
  getPlayerName: (address: BigNumberish) => string | undefined;
  updateMessages: (entities: PistolsEntity[]) => void;
}

const createStore = () => {
  return create<State>()(immer((set, get) => ({
    players_names: {},
    players_online: {},
    player_bookmarks: {},
    token_bookmarks: {},
    updateUsernames: (usernames: Map<string, string>) => {
      // console.log("updateUsername()[Player] =>", usernames)
      set((state: State) => {
        usernames.forEach((value: string, key: string) => {
          const _key = bigintToHex(key)
          state.players_names[_key] = value
        })
        // console.log("updateUsername()[Player] =>", usernames, state.players)
      });
    },
    getPlayerName: (address: BigNumberish) => {
      const players_names = get().players_names
      return players_names[bigintToHex(address)]
    },
    updateMessages: (entities: PistolsEntity[]) => {
      // console.log("updateMessages()[Player] =>", entities)
      set((state: State) => {
        entities.forEach((e) => {
          // PlayerOnline flags
          const online = e.models.pistols.PlayerOnline
          if (online) {
            const address = bigintToHex(online.identity)
            state.players_online[address] = bigintToNumber(online.timestamp)
          }
          // Bookmarks
          const bookmark = e.models.pistols.PlayerBookmark
          if (bookmark) {
            const address = bigintToHex(bookmark.identity)
            const target_address = BigInt(bookmark.target_address)
            const target_id = BigInt(bookmark.target_id)
            if (target_id == 0n) {
              // Bookmarking player
              const isBookmarked = state.player_bookmarks[address]?.includes(target_address)
              if (bookmark.enabled && !isBookmarked) {
                if (!state.player_bookmarks[address]) {
                  state.player_bookmarks[address] = []
                }
                state.player_bookmarks[address].push(target_address)
              } else if (!bookmark.enabled && isBookmarked) {
                state.player_bookmarks[address] = arrayRemoveValue(state.player_bookmarks[address], target_address)
              }
            } else {
              // Bookmarking token
              const target_address = bigintToHex(bookmark.target_address)
              const isBookmarked = state.token_bookmarks[address]?.[target_address]?.includes(target_id)
              if (bookmark.enabled && !isBookmarked) {
                if (!state.token_bookmarks[address]) {
                  state.token_bookmarks[address] = {}
                }
                if (!state.token_bookmarks[address][target_address]) {
                  state.token_bookmarks[address][target_address] = []
                }
                state.token_bookmarks[address][target_address].push(target_id)
              } else if (!bookmark.enabled && isBookmarked) {
                state.token_bookmarks[address][target_address] = arrayRemoveValue(state.token_bookmarks[address][target_address], target_id)
              }
            }
          }
        })
      });
    },
  })))
}

export const usePlayerStore = createDojoStore<PistolsSchemaType>();
export const usePlayerDataStore = createStore();


//--------------------------------
// 'consumer' hooks
//

export const usePlayer = (address: BigNumberish) => {
  const entities = usePlayerStore((state) => state.entities);
  const player = useEntityModelByKeys<models.Player>(entities, 'Player', [address])
  const flags = useEntityModelByKeys<models.PlayerFlags>(entities, 'PlayerFlags', [address])
  const teamFlags = useEntityModelByKeys<models.PlayerTeamFlags>(entities, 'PlayerTeamFlags', [address])

  const timestampRegistered = useMemo(() => Number(player?.timestamps.registered ?? 0), [player])
  const aliveDuelistCount = useMemo(() => Number(player?.alive_duelist_count ?? 0), [player])
  const isBlocked = useMemo(() => (flags?.is_blocked ?? false), [flags])
  const isTeamMember = useMemo(() => (teamFlags?.is_team_member ?? false), [teamFlags])
  const isAdmin = useMemo(() => (teamFlags?.is_admin ?? false), [teamFlags])
  const totals = useTotals(player?.totals)

  // get from player name store...
  const playerKey = useMemo(() => bigintToHex(address), [address])
  const players_names = usePlayerDataStore((state) => state.players_names);
  const username = useMemo(() => (players_names[playerKey] ?? null), [players_names, playerKey])
  const name = useMemo(() => (username || 'Unknown'), [username])

  // get from player message store...
  const players_bookmarks = usePlayerDataStore((state) => state.player_bookmarks);
  const token_bookmarks = usePlayerDataStore((state) => state.token_bookmarks);
  const bookmarkedPlayers = useMemo(() => (players_bookmarks[playerKey] ?? []), [players_bookmarks, playerKey])
  const bookmarkedTokens = useMemo(() => (token_bookmarks[playerKey] ?? {}), [token_bookmarks, playerKey])

  const { duelContractAddress, duelistContractAddress } = useTokenContracts()
  const bookmarkedDuels = useMemo(() => (bookmarkedTokens[duelContractAddress as string] ?? []), [bookmarkedTokens])
  const bookmarkedDuelists = useMemo(() => (bookmarkedTokens[duelistContractAddress as string] ?? []), [bookmarkedTokens])

  // TODO... check if completed tutorial from Activity events
  const hasFinishedTutorial = false
  const isAvailable = false

  // useEffect(() => console.log("usePlayer() =>", username, key, player), [player, username])

  return {
    address,
    username,
    name,
    timestampRegistered,
    aliveDuelistCount,
    isTeamMember,
    isAdmin,
    isBlocked,
    bookmarkedPlayers,
    bookmarkedTokens,
    bookmarkedDuels,
    bookmarkedDuelists,
    hasFinishedTutorial,
    isAvailable,
    totals,
  }
}

export const usePlayersAccounts = () => {
  const entities = usePlayerStore((state) => state.entities)
  const players = useEntitiesModel<models.Player>(Object.values(entities), 'Player')
  const playersAccounts = useMemo(() => (
    players.map((p) => (p.player_address))
  ), [players])
  return {
    playersAccounts,
  }
}

export const useTeamMembersAccounts = () => {
  const entities = usePlayerStore((state) => state.entities)
  const teamFlags = useEntitiesModel<models.PlayerTeamFlags>(Object.values(entities), 'PlayerTeamFlags')
  const teamMembersAccounts = useMemo(() => (
    teamFlags.filter((p) => (p.is_team_member || p.is_admin)).map((p) => (p.player_address))
  ), [teamFlags])
  return {
    teamMembersAccounts,
  }
}

export const useBlockedPlayersAccounts = () => {
  const entities = usePlayerStore((state) => state.entities)
  const playerFlags = useEntitiesModel<models.PlayerFlags>(Object.values(entities), 'PlayerFlags')
  const blockedPlayersAccounts = useMemo(() => (
    playerFlags.filter((p) => (p.is_blocked)).map((p) => (p.player_address))
  ), [playerFlags])
  return {
    blockedPlayersAccounts,
  }
}

export const useBlockedPlayersDuelistIds = () => {
  const { blockedPlayersAccounts } = useBlockedPlayersAccounts()
  const { duelistContractAddress } = useTokenContracts()
  const contracts = useTokenStore((state) => state.contracts)
  const getTokenIds = useTokenStore((state) => state.getTokenIds)

  const blockedPlayersDuelistIds = useMemo(() => (
    blockedPlayersAccounts.reduce((acc, account) => [...acc, ...(getTokenIds(duelistContractAddress, account) ?? [])], [] as bigint[])
  ), [blockedPlayersAccounts, getTokenIds, duelistContractAddress])

  return {
    blockedPlayersDuelistIds,
  }
}

export const useIsBookmarked = (target_address: BigNumberish, target_id: BigNumberish = 0) => {
  const { address } = useAccount()
  const { bookmarkedPlayers, bookmarkedTokens } = usePlayer(address)
  const isBookmarked = useMemo(() => (
    target_id == 0n
      ? bookmarkedPlayers.includes(BigInt(target_address ?? 0))
      : bookmarkedTokens[bigintToHex(target_address ?? 0)]?.includes(BigInt(target_id))
  ), [bookmarkedPlayers, bookmarkedTokens, target_address, target_id])
  return {
    isBookmarked,
  }
}

export const usePlayersOnline = () => {
  const players_online = usePlayerDataStore((state) => state.players_online)
  const playersOnline = useMemo(() => sortObjectByValue(players_online, (a, b) => (b - a)), [players_online])
  return {
    playersOnline,
  }
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
  const entities = usePlayerStore((state) => state.entities);
  const players = useEntitiesModel<models.Player>(Object.values(entities), 'Player')

  const players_online = usePlayerDataStore((state) => state.players_online);

  const playerIds = useMemo(() => {
    let result = [
      ...players,
    ];

    result = result.filter((p) => (p.player_address !== bigintToHex(address)))

    // filter by name
    if (filterName) {
      result = result.filter((p) => getPlayerName(p.player_address)?.toLowerCase().includes(filterName.toLowerCase()))
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
      const isAscending = (sortDirection == SortDirection.Ascending)

      // Sort by names, or both rookies
      const _sortByName = (a: string, b: string) => {
        return isAscending ? a.localeCompare(b) : b.localeCompare(a)
      }
      if (sortColumn == PlayerColumn.Name) {
        return _sortByName(getPlayerName(player_a.player_address), getPlayerName(player_b.player_address))
      }

      // Sort by values
      const _sortTotals = (a: number, b: number) => {
        return (!isAscending ? (b - a) : (a - b))
        // return (!isAscending ? (b - a) : (a && !b) ? -1 : (!a && b) ? 1 : (a - b))
      }
      if (sortColumn == PlayerColumn.Timestamp) return _sortTotals(Number(player_a.timestamps.registered), Number(player_b.timestamps.registered))
      return 0
    })

    // return ids only
    return result.map((e) => e.player_address)
  }, [players, filterName, filterOnline, sortColumn, sortDirection, filterBookmarked, bookmarkedDuelists, address, players_online])

  return {
    playerIds,
  }
}




//----------------------------------------
// vanilla getters
// (non-React)
//
export const getPlayerName = (address: BigNumberish): string | undefined => {
  return usePlayerDataStore.getState().getPlayerName(address)
}

export const getPlayerOnlineStatus = (address: BigNumberish): boolean => {
  const players_online = usePlayerDataStore((state) => state.players_online);
  return players_online[bigintToHex(address)] !== undefined
}
