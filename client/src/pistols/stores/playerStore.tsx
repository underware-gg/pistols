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
  bookmarks: string[]
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
      bookmarks: [],
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
          const online = e.models.pistols.PlayerOnline
          if (online) {
            const address = bigintToHex(online.address)
            if (state.players[address]) {
              state.players[address].timestamp_online = bigintToNumber(online.timestamp)
            }
          }
          const progress = e.models.pistols.PlayerTutorialProgress
          if (progress) {
            const address = bigintToHex(progress.address)
            if (state.players[address]) {
              state.players[address].tutorial_progress = progress.progress as unknown as TutorialProgress
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

  const username = useMemo(() => (player?.username ?? 'unknown'), [player])
  const name = useMemo(() => (player?.name ?? 'Unknown'), [player])
  const timestamp_registered = useMemo(() => (player?.timestamp_registered ?? 0), [player])
  const isNew = useMemo(() => (player?.isNew ?? false), [player])

  // useEffect(() => console.log("usePlayer() =>", username, key, player), [player, username])

  return {
    address,
    username,
    name,
    timestamp_registered,
    isNew,
  }
}
