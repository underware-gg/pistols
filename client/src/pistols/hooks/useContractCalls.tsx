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


export const useTestValidateSignature = () => {
  const { validate_commit_message } = useDojoSystemCalls()
  const args = useMemo(() => [
    '0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a',
    [18683050350194369926474251501299463273361533679187318748035393961305515393n, 1961127017291637037117856899054860359809940907306999930346504365582602827542n],
    48375809189929844202545149537943242632n,
    1n,
    3n,
  ], [])
  const { value, isPending } = useContractCall({
    call: validate_commit_message,
    args,
    defaultValue: false,
  })
  console.log(`useTestValidateSignature()`, isPending ? '...' : value)
  return {
    isValidated: value,
    isPending,
  }
}
