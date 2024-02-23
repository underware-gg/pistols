import { useEffect, useState } from 'react'
import { useDojoSystemCalls } from '@/dojo/DojoContext'
import { BigNumberish } from 'starknet'

export const useReadHitBonus = (address: BigNumberish, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { calc_hit_bonus } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await calc_hit_bonus(BigInt(address))
      if (_mounted) setValue(value)
    }
    if (address != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [address])
  return {
    hitBonus: value,
  }
}

export const useReadHitChance = (address: BigNumberish, action:number, health: number, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { get_duelist_hit_chance } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await get_duelist_hit_chance(BigInt(address), action, health)
      if (_mounted) setValue(value)
    }
    if (address != null && action != null && health != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [address, action, health])
  return {
    hitChance: value,
  }
}

export const useReadCritChance = (address: BigNumberish, action: number, health: number, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { get_duelist_crit_chance } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await get_duelist_crit_chance(BigInt(address), action, health)
      if (_mounted) setValue(value)
    }
    if (address != null && action != null && health != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [address, action, health])
  return {
    critChance: value,
  }
}

export const useReadActionHonour = (address: BigNumberish, action: number, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue)
  const { get_duelist_action_honour } = useDojoSystemCalls()
  useEffect(() => {
    let _mounted = true
    const _get = async () => {
      const value = await get_duelist_action_honour(BigInt(address), action)
      if (_mounted) setValue(value)
    }
    if (address != null && action != null) _get()
    else setValue(defaultValue)
    return () => { _mounted = false }
  }, [address, action])
  return {
    actionHonour: value,
  }
}

export const useReadValidPackedActions = (round_number: number, defaultValue = []) => {
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
