import { useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { PistolsEntity } from '@/lib/dojo/hooks/useSdkTypes'
import { arrayRemoveValue, bigintToHex, bigintToNumber, capitalize, shortAddress } from '@/lib/utils/types'
import { TutorialProgress } from '@/games/pistols/generated/constants'

interface PlayerState {
  timestamp_registered: number
  username: string
  name: string
  isNew: boolean
  // off-chain messages
  timestamp_online: number
  tutorial_progress: TutorialProgress
  bookmarked_players: string[]
  bookmarked_tokens: {
    [address: string]: bigint[]
  }
}
interface PlayersByAddress {
  [address: string]: PlayerState
}
interface State {
  players: PlayersByAddress,
  setEntities: (entities: PistolsEntity[]) => void;
  updateEntity: (event: PistolsEntity) => void;
  updateMessages: (entities: PistolsEntity[]) => void;
  updateUsernames: (usernames: Map<string, string>) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity): [string, PlayerState] => {
    const event = e.models.pistols.Player
    return event ? [bigintToHex(event.address), {
      timestamp_registered: bigintToNumber(event.timestamp_registered),
      username: shortAddress(event.address),
      name: shortAddress(event.address),
      isNew: true,
      // off-chain messages
      timestamp_online: bigintToNumber(event.timestamp_registered),
      tutorial_progress: TutorialProgress.None,
      bookmarked_players: [],
      bookmarked_tokens: {},
    }] : [undefined, undefined]
  }
  return create<State>()(immer((set) => ({
    players: {},
    setEntities: (entities: PistolsEntity[]) => {
      // console.log("setEntities()[Player] =>", entities)
      set((state: State) => {
        state.players = entities.sort((a, b) => (
          Number(b.models.pistols.Player?.timestamp_registered ?? 0) - Number(a.models.pistols.Player?.timestamp_registered ?? 0)
        )).reduce((acc, e) => {
          const [address, player] = _parseEvent(e)
          if (address && player) {
            acc[address] = player
          }
          return acc
        }, {} as PlayersByAddress)
      })
    },
    updateEntity: (e: PistolsEntity) => {
      // console.log("updateEntity()[Player] =>", e)
      set((state: State) => {
        // only insert
        const [address, player] = _parseEvent(e)
        const _key = bigintToHex(address)
        if (!state.players[_key]) {
          state.players[_key] = player
        }
      });
    },
    updateMessages: (entities: PistolsEntity[]) => {
      console.log("updateMessages()[Player] =>", entities)
      set((state: State) => {
        entities.forEach((e) => {
          const online = e.models.pistols.PPlayerOnline
          if (online) {
            const address = bigintToHex(online.identity)
            if (state.players[address]) {
              state.players[address].timestamp_online = bigintToNumber(online.timestamp)
            }
          }
          const progress = e.models.pistols.PPlayerTutorialProgress
          if (progress) {
            const address = bigintToHex(progress.identity)
            if (state.players[address]) {
              state.players[address].tutorial_progress = progress.progress as unknown as TutorialProgress
            }
          }
          const bookmark = e.models.pistols.PPlayerBookmark
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
  const timestamp_registered = useMemo(() => (player?.timestamp_registered ?? 0), [player])
  const timestamp_online = useMemo(() => (player?.timestamp_online ?? 0), [player])
  const tutorial_progress = useMemo(() => (player?.tutorial_progress ?? TutorialProgress.None), [player])
  const bookmarked_players = useMemo(() => (player?.bookmarked_players ?? []), [player])
  const bookmarked_tokens = useMemo(() => (player?.bookmarked_tokens ?? {}), [player])

  // useEffect(() => console.log("usePlayer() =>", username, key, player), [player, username])

  return {
    isNew,
    address,
    username,
    name,
    timestamp_registered,
    timestamp_online,
    tutorial_progress,
    bookmarked_players,
    bookmarked_tokens,
  }
}