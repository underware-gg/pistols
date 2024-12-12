import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BigNumberish } from 'starknet'
import { PistolsEntity } from '@/lib/dojo/hooks/useSdkEntities'
import { bigintToHex, capitalize, shortAddress } from '@/lib/utils/types'

interface PlayerState {
  timestamp: number
  username: string
  name: string
  isNew: boolean
}
interface PlayersByAddress {
  [address: string]: PlayerState
}
interface State {
  players: PlayersByAddress,
  setEntities: (events: PistolsEntity[]) => void;
  updateEntity: (event: PistolsEntity) => void;
  updateUsernames: (usernames: Map<string, string>) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity): [string, PlayerState] => {
    let event = e.models.pistols.Player
    return event ? [bigintToHex(event.address), {
      timestamp: Number(event.timestamp_registered),
      username: shortAddress(event.address),
      name: shortAddress(event.address),
      isNew: true,
    }] : [undefined, undefined]
  }
  return create<State>()(immer((set) => ({
    players: {},
    setEntities: (events: PistolsEntity[]) => {
      // console.log("setEntities()[Player] =>", events)
      set((state: State) => {
        state.players = events.sort((a, b) => (
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
  const timestamp = useMemo(() => (player?.timestamp ?? 0), [player])
  const isNew = useMemo(() => (player?.isNew ?? false), [player])

  // useEffect(() => console.log("usePlayer() =>", username, key, player), [player, username])

  return {
    address,
    username,
    name,
    timestamp,
    isNew,
  }
}
