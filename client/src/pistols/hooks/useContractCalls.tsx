import { useEffect, useState } from 'react'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { BigNumberish } from 'starknet'

export const useCalcFee = (wager_coin: number, wager_value: BigNumberish, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { calc_fee } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await calc_fee(wager_coin, wager_value)
      if (_mounted) setValue(value)
    }
    if (wager_coin != null && wager_value != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [wager_coin, wager_value])
  return {
    fee: value,
  }
}

export const useCalcHonourForAction = (address: BigNumberish, action: number, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { simulate_honour_for_action } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await simulate_honour_for_action(BigInt(address), action)
      if (_mounted) setValue(value)
    }
    if (address != null && action != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [address, action])
  return {
    honourForAction: value,
  }
}

export const useSimulateChances = (address: BigNumberish, duelId: bigint, roundNumber: number, action: number, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { simulate_chances } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await simulate_chances(BigInt(address), duelId, roundNumber, action)
      if (_mounted) setValue(value)
    }
    if (address != null && duelId && roundNumber && action != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [address, duelId, roundNumber, action])
  return {
    ...value,
  }
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
    if (round_number != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [round_number])
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
