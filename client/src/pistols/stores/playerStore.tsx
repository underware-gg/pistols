import { useMemo } from 'react'
import { create } from 'zustand'
import { BigNumberish } from 'starknet'
import { PistolsEntity } from '@/lib/dojo/hooks/useSdkEntities'
import { arrayClean, bigintEquals, bigintToHex, capitalize, shortAddress } from '@/lib/utils/types'

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
  return create<State>()((set) => ({
    players: {},
    setEntities: (events: PistolsEntity[]) => {
      console.log("setEntities()[Player] =>", events)
      set((state: State) => {
        const players = events.sort((a, b) => (
          Number(b.models.pistols.Player?.timestamp_registered ?? 0) - Number(a.models.pistols.Player?.timestamp_registered ?? 0)
        )).reduce((acc, e) => {
          const [address, player] = _parseEvent(e)
          if (address && player) {
            acc[address] = player
          }
          return acc
        }, {} as PlayersByAddress)
        return {
          players
        }
      })
    },
    updateEntity: (e: PistolsEntity) => {
      console.log("updateEntity()[Player] =>", e)
      set((state: State) => {
        // only insert
        const [address, player] = _parseEvent(e)
        const _key = bigintToHex(address)
        if (!state.players[_key]) {
          state.players[_key] = player
        }
        return state
      });
    },
    updateUsernames: (usernames: Map<string, string>) => {
      // console.log("updateUsername()[Player] =>", usernames)
      set((state: State) => {
        usernames.forEach((value: string, key: string) => {
          const _key = bigintToHex(key)
          if (state.players[_key]) {
            state.players[_key] = {
              ...state.players[_key],
              username: value,
              name: capitalize(value),
              isNew: false,
            }
          }
        })
        console.log("updateUsername()[Player] =>", usernames, state.players)
        return state
      });
    },
  }))
}

export const usePlayerStore = createStore();


//--------------------------------
// 'consumer' hooks
//

export const usePlayer = (address: BigNumberish) => {
  const players = usePlayerStore((state) => state.players)
  const key = useMemo(() => (bigintToHex(address)), [address])
  const player = useMemo(() => (players[key]), [players[key]])

  const username = useMemo(() => (player?.username ?? 'unknown'), [player])
  const name = useMemo(() => (player?.name ?? 'Unknown'), [player])
  const timestamp = useMemo(() => (player?.timestamp ?? 0), [player])

  return {
    address,
    username,
    name,
    timestamp,
  }
}
