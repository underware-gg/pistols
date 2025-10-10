import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { createDojoStore } from '@dojoengine/sdk/react'
import { PistolsEntity, PistolsSchemaType } from '@underware/pistols-sdk/pistols/sdk'
import { arrayRemoveValue, bigintEquals, bigintToAddress, bigintToNumber, formatTimestampDeltaElapsed, isPositiveBigint, sortObjectByValue } from '@underware/pistols-sdk/utils'
import { useAllStoreModels, useStoreModelsByKeys } from '@underware/pistols-sdk/dojo'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useDuelistTokenStore } from '/src/stores/tokenStore'
import { useClientTimestamp } from '@underware/pistols-sdk/utils/hooks'
import { useRingIdsOwnedByAccount } from '/src/hooks/useTokenRings'
import { parseEnumVariant } from '@underware/pistols-sdk/starknet'
import { models, constants } from '@underware/pistols-sdk/pistols/gen'
import { SortDirection } from '/src/stores/queryParamsStore'
import { PlayerColumn } from '/src/stores/queryParamsStore'
import { useTotals } from '/src/stores/duelistStore'
import { CHARACTER_NAMES, CHARACTER_AVATARS } from '@underware/pistols-sdk/pistols/constants'
import { useDiscordSocialLink } from './eventsModelStore'

interface NamesByAccount {
  [address: string]: string
}
interface OnlineState {
  timestamp: number,
  available: boolean,
}
interface OnlineStateByAccount {
  [address: string]: OnlineState
}
interface PlayerBookmarksByAccount {
  [address: string]: bigint[]
}
interface TokenBookmarksByAccount {
  [address: string]: {
    [address: string]: bigint[]
  }
}
interface State {
  players_names: NamesByAccount,
  players_avatars: NamesByAccount,
  players_online: OnlineStateByAccount,
  player_bookmarks: PlayerBookmarksByAccount,
  token_bookmarks: TokenBookmarksByAccount,
  //setters
  updateUsernames: (usernames: Map<string, string>) => void;
  updateMessages: (entities: PistolsEntity[]) => void;
  // getters
  getPlayernameFromAddress: (address: BigNumberish) => string | undefined;
  getAddressFromPlayername: (name: string) => BigNumberish | undefined;
}

const _playerKey = (address: BigNumberish | undefined): string | null => (
  isPositiveBigint(address) ? bigintToAddress(address) : null
)

const createStore = () => {
  return create<State>()(immer((set, get) => ({
    players_names: Object.keys(CHARACTER_NAMES).reduce((acc, key) => {
      acc[_playerKey(key)] = CHARACTER_NAMES[key]
      return acc
    }, {} as Record<string, string>),
    players_avatars: Object.keys(CHARACTER_AVATARS).reduce((acc, key) => {
      acc[_playerKey(key)] = CHARACTER_AVATARS[key]
      return acc
    }, {} as Record<string, string>),
    players_online: {},
    player_bookmarks: {},
    token_bookmarks: {},
    updateUsernames: (usernames: Map<string, string>) => {
      // console.log("updateUsername()[Player] =>", usernames)
      set((state: State) => {
        usernames.forEach((value: string, key: string) => {
          const _key = _playerKey(key)
          state.players_names[_key] = value
        })
        // console.log("updateUsername()[Player] =>", usernames, state.players)
      });
    },
    getPlayernameFromAddress: (address: BigNumberish): string | undefined => {
      if (!isPositiveBigint(address)) return undefined;
      const players_names = get().players_names
      return players_names[_playerKey(address)]
    },
    getAddressFromPlayername: (name: string): BigNumberish | undefined => {
      if (!name) return undefined;
      const players_names = get().players_names
      return Object.keys(players_names).find((key) => players_names[key] === name)
    },
    updateMessages: (entities: PistolsEntity[]) => {
      // console.log("updateMessages()[Player] =>", entities)
      set((state: State) => {
        entities.forEach((e) => {
          // PlayerOnline status
          const playerOnline = e.models.pistols.PlayerOnline
          if (playerOnline) {
            const address = _playerKey(playerOnline.identity)
            state.players_online[address] = {
              timestamp: bigintToNumber(playerOnline.timestamp),
              available: playerOnline.available,
            }
          }
          // Bookmarks
          const bookmark = e.models.pistols.PlayerBookmarkEvent
          if (bookmark) {
            const address = _playerKey(bookmark.player_address)
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
              const target_address = _playerKey(bookmark.target_address)
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

export const usePlayerEntityStore = createDojoStore<PistolsSchemaType>();
export const usePlayerDataStore = createStore();


//--------------------------------
// 'consumer' hooks
//

export const usePlayer = (address: BigNumberish, onlineClientTimestamp?: number) => {
  const entities = usePlayerEntityStore((state) => state.entities);
  const player = useStoreModelsByKeys<models.Player>(entities, 'Player', [address])
  const flags = useStoreModelsByKeys<models.PlayerFlags>(entities, 'PlayerFlags', [address])
  const teamFlags = useStoreModelsByKeys<models.PlayerTeamFlags>(entities, 'PlayerTeamFlags', [address])

  const timestampRegistered = useMemo(() => Number(player?.timestamps.registered ?? 0), [player])
  const aliveDuelistCount = useMemo(() => Number(player?.alive_duelist_count ?? 0), [player])
  const activeSignetRing = useMemo(() => (player ? parseEnumVariant<constants.RingType>(player.active_signet_ring) : null), [player])
  const isBlocked = useMemo(() => (flags?.is_blocked ?? false), [flags])
  const isTeamMember = useMemo(() => (teamFlags?.is_team_member ?? false), [teamFlags])
  const isAdmin = useMemo(() => (teamFlags?.is_admin ?? false), [teamFlags])
  const totals = useTotals(player?.totals)

  // get from player name store...
  const playerKey = useMemo(() => _playerKey(address), [address])
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

  // player online status
  const players_online = usePlayerDataStore((state) => state.players_online);
  const { clientTimestamp } = useClientTimestamp()
  const {
    isAvailable,
    isOnline,
    isAway,
    formattedTime: lastSeenTime,
    timestamp: lastSeenTimestamp,
  } = useMemo(() => (
    getPlayerOnlineStatus(players_online[playerKey], onlineClientTimestamp || clientTimestamp)
  ), [players_online, address, onlineClientTimestamp, clientTimestamp])

  // TODO... check if completed tutorial from Activity events
  const hasFinishedTutorial = false

  // useEffect(() => console.log("usePlayer() =>", username, activeSignetRing), [player, username, playerKey])

  return {
    address,
    username,
    name,
    timestampRegistered,
    aliveDuelistCount,
    activeSignetRing,
    isTeamMember,
    isAdmin,
    isBlocked,
    bookmarkedPlayers,
    bookmarkedTokens,
    bookmarkedDuels,
    bookmarkedDuelists,
    hasFinishedTutorial,
    isAvailable,
    isOnline,
    isAway,
    lastSeenTime,
    lastSeenTimestamp,
    totals,
  }
}

export const usePlayerAddressFromUsername = (username: string): BigNumberish | undefined => {
  const players_names = usePlayerDataStore((state) => state.players_names);
  const getAddressFromPlayername = usePlayerDataStore((state) => state.getAddressFromPlayername);
  const address = useMemo(() => (getAddressFromPlayername(username) as BigNumberish), [players_names, username]);
  return address;
}

export const useUsernameFromPlayerAddress = (address: BigNumberish): string | undefined => {
  const players_names = usePlayerDataStore((state) => state.players_names);
  const getPlayernameFromAddress = usePlayerDataStore((state) => state.getPlayernameFromAddress);
  const username = useMemo(() => (getPlayernameFromAddress(address) as string), [players_names, address]);
  return username;
}

export const usePlayersAccounts = () => {
  const entities = usePlayerEntityStore((state) => state.entities)
  const players = useAllStoreModels<models.Player>(entities, 'Player')
  const playersAccounts = useMemo(() => (
    players.map((p) => _playerKey(p.player_address))
  ), [players])
  return {
    playersAccounts,
  }
}

export const useTeamMembersAccounts = () => {
  const entities = usePlayerEntityStore((state) => state.entities)
  const teamFlags = useAllStoreModels<models.PlayerTeamFlags>(entities, 'PlayerTeamFlags')
  const teamMembersAccounts = useMemo(() => (
    teamFlags.filter((p) => (p.is_team_member || p.is_admin)).map((p) => (p.player_address))
  ), [teamFlags])
  return {
    teamMembersAccounts,
  }
}

export const useBlockedPlayersAccounts = () => {
  const entities = usePlayerEntityStore((state) => state.entities)
  const playerFlags = useAllStoreModels<models.PlayerFlags>(entities, 'PlayerFlags')
  const blockedPlayersAccounts = useMemo(() => (
    playerFlags.filter((p) => (p.is_blocked)).map((p) => (p.player_address))
  ), [playerFlags])
  return {
    blockedPlayersAccounts,
  }
}

export const useBlockedPlayersDuelistIds = () => {
  const { blockedPlayersAccounts } = useBlockedPlayersAccounts()
  const { teamMembersAccounts } = useTeamMembersAccounts()
  const tokens = useDuelistTokenStore((state) => state.tokens)
  const getTokenIdsOwnedByAccount = useDuelistTokenStore((state) => state.getTokenIdsOwnedByAccount)

  const blockedPlayersDuelistIds = useMemo(() => {
    const allAccounts = [...blockedPlayersAccounts, ...teamMembersAccounts]
    return allAccounts.reduce((acc, account) => [...acc, ...getTokenIdsOwnedByAccount(account)], [] as bigint[])
  }, [blockedPlayersAccounts, teamMembersAccounts, tokens])

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
      : bookmarkedTokens[_playerKey(target_address ?? 0)]?.includes(BigInt(target_id))
  ), [bookmarkedPlayers, bookmarkedTokens, target_address, target_id])
  return {
    isBookmarked,
  }
}

export const usePlayerAvatar = (address: BigNumberish) => {
  const players_avatars = usePlayerDataStore((state) => state.players_avatars)
  const avatarUrl = useMemo(() => (players_avatars[_playerKey(address)] ?? null), [players_avatars, address])
  const { avatarUrl: discordAvatarUrl } = useDiscordSocialLink(address)
  return {
    avatarUrl: (discordAvatarUrl || avatarUrl),
  }
}


//--------------------------------
// PlayerOnline status
//

// Get all players online status, old or new
export const useAllPlayersOnlineState = () => {
  const players_online = usePlayerDataStore((state) => state.players_online);
  const playersOnline = useMemo(() => sortObjectByValue(players_online, (a, b) => (b.timestamp - a.timestamp)), [players_online]);
  return {
    playersOnline,
  }
}

// Get all players online status, old or new
export const usePlayersAvailableForMatchmaking = () => {
  const players_online = usePlayerDataStore((state) => state.players_online);
  const { clientTimestamp } = useClientTimestamp({ autoUpdate: true, updateSeconds: 10 });
  const playerIds = useMemo(() => (
    Object.keys(players_online).filter((playerKey) => {
      const { isAvailable } = getPlayerOnlineStatus(players_online[playerKey], clientTimestamp);
      return isAvailable;
    })
  ), [players_online, clientTimestamp]);
  return {
    playerIds,
  }
}

const getPlayerOnlineStatus = (player_online: OnlineState | undefined, clientTimestamp: number) => {
  if (!player_online) return {};
  const { result: formattedTime, isOnline, isAway, isOffline } = formatTimestampDeltaElapsed(player_online.timestamp, clientTimestamp);
  return {
    timestamp: player_online.timestamp,
    formattedTime,
    isAvailable: (isOnline && player_online.available),
    isOnline,
    isAway,
    isOffline,
  };
}



//--------------------------------
// Player querying
//

export const useQueryPlayerIds = (
  filterName: string,
  filterActive: boolean,
  filterBookmarked: boolean,
  sortColumn: PlayerColumn,
  sortDirection: SortDirection,
) => {
  const { address } = useAccount()
  const { bookmarkedDuelists } = usePlayer(address)
  const entities = usePlayerEntityStore((state) => state.entities);
  const players = useAllStoreModels<models.Player>(entities, 'Player')

  const { clientTimestamp } = useClientTimestamp()
  const players_online = usePlayerDataStore((state) => state.players_online);

  const playerIds = useMemo(() => {
    let result = [
      ...players,
    ];

    // filter by name
    if (filterName) {
      result = result.filter((p) => getPlayernameFromAddress(p.player_address)?.toLowerCase().includes(filterName.toLowerCase()))
    }

    // filter by bookmarked duelists
    if (filterBookmarked) {
      result = result.filter((e) => (bookmarkedDuelists.find(p => bigintEquals(p, e.player_address)) !== undefined))
    }

    // filter by active
    if (filterActive) {
      result = result.filter((e) => {
        const { isOnline, isAway } = getPlayerOnlineStatus(players_online[_playerKey(e.player_address)], clientTimestamp);
        return (isOnline || isAway);
      })
    }

    // sort...
    result = result.sort((player_a, player_b) => {
      const isAscending = (sortDirection == SortDirection.Ascending)

      // Sort by names, or both rookies
      const _sortByName = (a: string | undefined, b: string | undefined) => {
        return isAscending ? a?.localeCompare(b) : b?.localeCompare(a)
      }
      if (sortColumn == PlayerColumn.Name) {
        return _sortByName(getPlayernameFromAddress(player_a.player_address), getPlayernameFromAddress(player_b.player_address))
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
  }, [players, filterName, filterActive, sortColumn, sortDirection, filterBookmarked, bookmarkedDuelists, address, players_online])

  return {
    playerIds,
  }
}



//--------------------------------
// Signet rings
//

// INTERNAL USE ONLY, to get the active ring...
// const { activeSignetRing } = usePlayer(playerAddress)
export const useRingsOwnedByPlayer = () => {
  const { address } = useAccount()
  return useRingsOwnedByAccount(address)
}
export const useRingsOwnedByAccount = (address: BigNumberish) => {
  const entities = usePlayerEntityStore((state) => state.entities);
  const ringModels = useAllStoreModels<models.Ring>(entities, 'Ring')
  const { ringIds } = useRingIdsOwnedByAccount(address)
  const ringTypes = useMemo(() => (
    ringIds
      // ids to models
      .map((ringId) => ringModels.find((m) => bigintEquals(m?.ring_id, ringId)))
      .filter(Boolean)
      // models to ring types
      .map((m) => parseEnumVariant<constants.RingType>(m.ring_type))
  ), [ringIds, ringModels])
  const topRingType = useMemo(() => (
    ringTypes.includes(constants.RingType.GoldSignetRing) ? constants.RingType.GoldSignetRing :
      ringTypes.includes(constants.RingType.SilverSignetRing) ? constants.RingType.SilverSignetRing :
        ringTypes.includes(constants.RingType.LeadSignetRing) ? constants.RingType.LeadSignetRing :
          null
  ), [ringTypes])
  // console.log(`rings =>`, topRingType, ringIds, ringTypes)
  return {
    ringIds,
    ringTypes,
    topRingType,
  }
}
//TODO once dojo fixes token subscriptions remove this and use above function
export const useRingEntityIdsOwnedByPlayer = (address: BigNumberish) => {
  const entities = usePlayerEntityStore((state) => state.entities);
  const ringModels = useAllStoreModels<models.Ring>(entities, 'Ring')
  const totalRings = useMemo(() => ringModels.length, [ringModels])
  const ringIds = useMemo(() => (
    ringModels.filter((m) => bigintEquals(m.claimed_by, address)).map((m) => m.ring_id)
  ), [ringModels, address])
  const ringTypes = useMemo(() => (
    ringIds
      // ids to models
      .map((ringId) => ringModels.find((m) => bigintEquals(m?.ring_id, ringId)))
      .filter(Boolean)
      // models to ring types
      .map((m) => parseEnumVariant<constants.RingType>(m.ring_type))
  ), [ringIds, ringModels])
  const topRingType = useMemo(() => (
    ringTypes.includes(constants.RingType.GoldSignetRing) ? constants.RingType.GoldSignetRing :
      ringTypes.includes(constants.RingType.SilverSignetRing) ? constants.RingType.SilverSignetRing :
        ringTypes.includes(constants.RingType.LeadSignetRing) ? constants.RingType.LeadSignetRing :
          null
  ), [ringTypes])
  // console.log(`rings =>`, topRingType, ringIds, ringTypes)
  return {
    totalRings,
    ringIds,
    ringTypes,
    topRingType,
  }
}



//----------------------------------------
// vanilla getters
// (non-React)
//
export const getPlayernameFromAddress = (address: BigNumberish | undefined): string | undefined => {
  return usePlayerDataStore.getState().getPlayernameFromAddress(address ?? '')
}
export const getAddressFromPlayername = (name: string | undefined): BigNumberish | undefined => {
  return usePlayerDataStore.getState().getAddressFromPlayername(name ?? '')
}
