import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useContractCall } from '@/lib/utils/hooks/useContractCall'
import { isBigint } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

export const useCanJoin = () => {
  const { address } = useAccount()
  const { can_join } = useDojoSystemCalls()
  const args = useMemo(() => [BigInt(address ?? 0), BigInt(address ?? 0)], [address])
  const enabled = useMemo(() => isBigint(address), [address])
  const { value, isPending } = useContractCall({
    call: can_join,
    args,
    enabled,
    defaultValue: null,
  })
  return {
    fee: value,
    isPending
  }
}

export const useCalcFee = (table_id: string, wager_value: BigNumberish) => {
  const { calc_fee } = useDojoSystemCalls()
  const args = useMemo(() => [table_id, wager_value], [table_id, wager_value])
  const enabled = useMemo(() => Boolean(table_id), [table_id])
  const { value, isPending } = useContractCall({
    call: calc_fee,
    args,
    enabled,
    defaultValue: null,
  })
  return {
    fee: value,
    isPending,
  }
}

export const useSimulateChances = (address: BigNumberish, duelId: bigint, roundNumber: number, action: number) => {
  const { simulate_chances } = useDojoSystemCalls()
  const args = useMemo(() => [BigInt(address), duelId, roundNumber, action], [address, duelId, roundNumber, action])
  const enabled = useMemo(() => (address != null && duelId && roundNumber && action != null), [address, duelId, roundNumber, action])
  const { value } = useContractCall({
    call: simulate_chances,
    args,
    enabled,
    defaultValue: {},
  })

  return value as Awaited<ReturnType<typeof simulate_chances>>
}

export const useGetValidPackedActions = (roundNumber: number) => {
  const { get_valid_packed_actions } = useDojoSystemCalls()
  const args = useMemo(() => [roundNumber], [roundNumber])
  const enabled = useMemo(() => Boolean(roundNumber), [roundNumber])
  const { value, isPending } = useContractCall({
    call: get_valid_packed_actions,
    args,
    enabled,
    defaultValue: [],
  })
  return {
    validPackedActions: value,
    isPending,
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
