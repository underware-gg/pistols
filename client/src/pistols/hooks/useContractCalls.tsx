import { useEffect, useState } from 'react'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { BigNumberish } from 'starknet'

export const useCalcFee = (table_id: string, wager_value: BigNumberish, defaultValue = null) => {
  const { calc_fee } = useDojoSystemCalls()
  const [value, setValue] = useState(defaultValue)
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await calc_fee(table_id, wager_value)
      if (_mounted) setValue(value)
    }
    if (table_id && calc_fee) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [calc_fee, table_id, wager_value])
  return {
    fee: value,
  }
}

export const useSimulateChances = (address: BigNumberish, duelId: bigint, roundNumber: number, action: number, defaultValue = {}) => {
  const { simulate_chances } = useDojoSystemCalls()
  const [value, setValue] = useState<any | null>(defaultValue)
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await simulate_chances(BigInt(address), duelId, roundNumber, action)
      if (_mounted) setValue(value)
    }
    if (simulate_chances && address != null && duelId && roundNumber && action != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [simulate_chances, address, duelId, roundNumber, action])
  return value as Awaited<ReturnType<typeof simulate_chances>>
}

export const useGetValidPackedActions = (round_number: number, defaultValue = []) => {
  const [value, setValue] = useState(defaultValue)
  const { get_valid_packed_actions } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await get_valid_packed_actions(round_number)
      if (_mounted) setValue(value)
    }
    if (get_valid_packed_actions && round_number != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [get_valid_packed_actions, round_number])
  return {
    validPackedActions: value,
  }
}

// export const usePackActionSlots = (slot1: number, slot2: number, defaultValue = null) => {
//   const [value, setValue] = useState(defaultValue)
//   const { pack_action_slots } = useDojoSystemCalls()
//   useEffect(() => {
//     let _mounted = true
//     const _get = async () => {
//       const value = await pack_action_slots(slot1, slot2)
//       if (_mounted) setValue(value)
//     }
//     if (slot1 != null && slot2 != null) _get()
//     else setValue(defaultValue)
//     return () => { _mounted = false }
//   }, [slot1, slot2])
//   return {
//     packed: value,
//   }
// }

// export const useUnpackActionSlots = (packed: number, defaultValue = []) => {
//   const [value, setValue] = useState(defaultValue)
//   const { unpack_action_slots } = useDojoSystemCalls()
//   useEffect(() => {
//     let _mounted = true
//     const _get = async () => {
//       const value = await unpack_action_slots(packed)
//       if (_mounted) setValue(value)
//     }
//     if (packed != null) _get()
//     else setValue(defaultValue)
//     return () => { _mounted = false }
//   }, [packed])
//   return {
//     unpacked: value,
//   }
// }
