import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDuelTokenContract } from '/src/hooks/useTokenContract'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { constants, PistolsEntity } from '@underware_gg/pistols-sdk/pistols'
import { arrayRemoveValue, bigintToHex, bigintToNumber, capitalize, parseEnumVariant, shortAddress, sortObjectByValue } from '@underware_gg/pistols-sdk/utils'

interface PlayerState {
  player_address: string
  timestamp_registered: number
  username: string
  name: string
  isNew: boolean
  // off-chain messages
  tutorial_progress: constants.TutorialProgress
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
  updateEntity: (event: PistolsEntity) => void;
  updateMessages: (entities: PistolsEntity[]) => void;
  updateUsernames: (usernames: Map<string, string>) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity): PlayerState => {
    const event = e.models.pistols.Player
    return event ? {
      player_address: bigintToHex(event.player_address),
      timestamp_registered: bigintToNumber(event.timestamp_registered),
      username: shortAddress(event.player_address),
      name: shortAddress(event.player_address),
      isNew: true,
      // off-chain messages
      tutorial_progress: constants.TutorialProgress.None,
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
          Number(b.models.pistols.Player?.timestamp_registered ?? 0) - Number(a.models.pistols.Player?.timestamp_registered ?? 0)
        )).reduce((acc, e) => {
          const player = _parseEvent(e)
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
        const player = _parseEvent(e)
        if (!state.players[player.player_address]) {
          state.players[player.player_address] = player
        }
      });
    },
    updateMessages: (entities: PistolsEntity[]) => {
      console.log("updateMessages()[Player] =>", entities)
      set((state: State) => {
        entities.forEach((e) => {
          const online = e.models.pistols.PlayerOnline
          if (online) {
            const address = bigintToHex(online.identity)
            state.players_online[address] = bigintToNumber(online.timestamp)
          }
          const progress = e.models.pistols.PlayerTutorialProgress
          if (progress) {
            const address = bigintToHex(progress.identity)
            if (state.players[address]) {
              state.players[address].tutorial_progress = parseEnumVariant<constants.TutorialProgress>(progress.progress)
            }
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
            state.players[_key].name = capitalize(value)
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
  const username = useMemo(() => (player?.username ?? 'unknown'), [player])
  const name = useMemo(() => (player?.name ?? 'Unknown'), [player])
  const timestampRegistered = useMemo(() => (player?.timestamp_registered ?? 0), [player])
  const bookmarkedPlayers = useMemo(() => (player?.bookmarked_players ?? []), [player])
  const bookmarkedTokens = useMemo(() => (player?.bookmarked_tokens ?? {}), [player])
  const tutorialProgress = useMemo(() => (player?.tutorial_progress ?? constants.TutorialProgress.None), [player])
  const hasCompletedTutorial = useMemo(() => (tutorialProgress === constants.TutorialProgress.FinishedFirstDuel), [tutorialProgress])
  const isAvailable = useMemo(() => (hasCompletedTutorial), [hasCompletedTutorial])

  const { duelContractAddress } = useDuelTokenContract()
  const { duelistContractAddress } = useDuelistTokenContract()
  const bookmarkedDuels = useMemo(() => (player?.bookmarked_tokens?.[duelContractAddress as string] ?? []), [player])
  const bookmarkedDuelists = useMemo(() => (player?.bookmarked_tokens?.[duelistContractAddress as string] ?? []), [player])

  // useEffect(() => console.log("usePlayer() =>", username, key, player), [player, username])

  return {
    isNew,
    address,
    username,
    name,
    timestampRegistered,
    bookmarkedPlayers,
    bookmarkedTokens,
    bookmarkedDuels,
    bookmarkedDuelists,
    tutorialProgress,
    hasCompletedTutorial,
    isAvailable,
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
