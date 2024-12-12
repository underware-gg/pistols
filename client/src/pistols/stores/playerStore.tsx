import { useMemo } from 'react'
import { create } from 'zustand'
import { BigNumberish } from 'starknet'
import { PistolsEntity } from '@/lib/dojo/hooks/useSdkEntities'
import { bigintEquals, shortAddress } from '@/lib/utils/types'

export interface ActivityState {
  address: bigint
  timestamp: number
  username: string
  name: string
}
interface State {
  players: ActivityState[],
  setEntities: (events: PistolsEntity[]) => void;
  updateEntity: (event: PistolsEntity) => void;
}

const createStore = () => {
  const _parseEvent = (e: PistolsEntity) => {
    let event = e.models.pistols.Player
    return event ? {
      address: BigInt(event.address),
      timestamp: Number(event.timestamp_registered),
      username: shortAddress(event.address),
      name: shortAddress(event.address),
    } : undefined
  }
  return create<State>()((set) => ({
    players: [],
    setEntities: (events: PistolsEntity[]) => {
      console.log("setEntities()[Player] =>", events)
      set((state: State) => ({
        players: events.map(e => _parseEvent(e)).sort((a, b) => (b.timestamp - a.timestamp))
      }))
    },
    updateEntity: (e: PistolsEntity) => {
      console.log("updateEntity()[Player] =>", e)
      set((state: State) => {
        state.players.push(_parseEvent(e))
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
  const players = usePlayerStore((state) => state.players);
  const player = useMemo(() => (players.find(p => bigintEquals(p.address, address))), [players, address])

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
