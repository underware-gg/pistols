import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useContractCall } from '@/lib/utils/hooks/useContractCall'
import { bigintToHex, isBigint, isPositiveBigint } from '@/lib/utils/types'
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
  const { get_player_full_deck } = useDojoSystemCalls()
  const args = useMemo(() => [roundNumber], [roundNumber])
  const enabled = useMemo(() => Boolean(roundNumber), [roundNumber])
  const { value, isPending } = useContractCall({
    call: get_player_full_deck,
    args,
    enabled,
    defaultValue: [],
  })
  return {
    validPackedActions: value,
    isPending,
  }
}



//------------------------------------------
// ADMIN
//

export const useAdminAmIOwner = () => {
  const { address } = useAccount()
  const { isOwner, isPending } = useAdminIsOwner(address)
  return {
    IAmOwner: isOwner,
    isPending,
  }
}

export const useAdminIsOwner = (address: BigNumberish) => {
  const args = useMemo(() => ([address]), [address])
  const { admin_am_i_admin } = useDojoSystemCalls()
  const { value, isPending } = useContractCall({
    call: admin_am_i_admin,
    args,
    enabled: isPositiveBigint(address),
  })
  return {
    isOwner: value,
    isPending,
  }
}




//------------------------------------------
// TEST/DEBUG
//
export const useTestValidateSignature = () => {
  const { test_validate_commit_message } = useDojoSystemCalls()
  const args = useMemo(() => [
    '0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a', // account
    [173730084075620862592063244223266966993038958055152214202416930759334968124n, 1417567916191820063020424621516241329682320435780260605909088968782369795432n],
    163115167366171702731397391899782408079n,
    1n,
    1n,
  ], [])
  const { value, isPending } = useContractCall({
    call: test_validate_commit_message,
    args,
    defaultValue: false,
  })
  console.log(`useTestValidateSignature()`, isPending ? '...' : value)
  return {
    isValidated: value,
    isPending,
  }
}
