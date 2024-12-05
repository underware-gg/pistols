import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useContractCall } from '@/lib/utils/hooks/useContractCall'
import { useChallenge } from '@/pistols/stores/challengeStore'
import { isBigint, isPositiveBigint } from '@/lib/utils/types'
import { DuelProgress } from '@/games/pistols/duel_progress'

export const useCanJoin = () => {
  const { can_join } = useDojoSystemCalls()
  const { address } = useAccount()
  const options = useMemo(() => ({
    call: can_join,
    args: [BigInt(address ?? 0), BigInt(address ?? 0)],
    enabled: isBigint(address),
    defaultValue: null,
  }), [can_join, address])
  const { value, isPending } = useContractCall(options)
  return {
    fee: value,
    isPending
  }
}

export const useCalcFeeDuelist = () => {
  const { address } = useAccount()
  const { calc_mint_fee_duelist } = useDojoSystemCalls()
  const options = useMemo(() => ({
    call: calc_mint_fee_duelist,
    args: [address],
    enabled: isPositiveBigint(address),
    defaultValue: null,
  }), [calc_mint_fee_duelist, address])
  const { value, isPending } = useContractCall(options)
  return {
    fee: value,
    isPending,
  }
}

export const useCalcFeeDuel = (table_id: string) => {
  const { calc_mint_fee_duel } = useDojoSystemCalls()
  const options = useMemo(() => ({
    call: calc_mint_fee_duel,
    args: [table_id],
    enabled: Boolean(table_id),
    defaultValue: null,
  }), [calc_mint_fee_duel, table_id])
  const { value, isPending } = useContractCall(options)
  return {
    fee: value,
    isPending,
  }
}

export const useFinishedDuelProgress = (duelId: bigint): DuelProgress => {
  const { isFinished } = useChallenge(duelId)
  return useDuelProgress(isFinished ? duelId : null)
}

export const useDuelProgress = (duelId: bigint) => {
  const { get_duel_progress } = useDojoSystemCalls()
  const options = useMemo(() => ({
    call: get_duel_progress,
    args: [duelId],
    enabled: isPositiveBigint(duelId),
    defaultValue: null,
  }), [get_duel_progress, duelId])
  const { value } = useContractCall(options)
  return value as Awaited<ReturnType<typeof get_duel_progress>>
}

export const useGetPlayerFullDeck = (tableId: string) => {
  const { get_player_card_decks } = useDojoSystemCalls()
  const options = useMemo(() => ({
    call: get_player_card_decks,
    args: [tableId],
    enabled: Boolean(tableId),
    defaultValue: [],
  }), [get_player_card_decks, tableId])
  const { value, isPending } = useContractCall(options)
  return {
    decks: value,
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
  const { admin_am_i_admin } = useDojoSystemCalls()
  const options = useMemo(() => ({
    call: admin_am_i_admin,
    args: [address],
    enabled: isPositiveBigint(address),
  }), [admin_am_i_admin, address])
  const { value, isPending } = useContractCall(options)
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
  const options = useMemo(() => ({
    call: test_validate_commit_message,
    args: [
      '0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a', // account
      [173730084075620862592063244223266966993038958055152214202416930759334968124n, 1417567916191820063020424621516241329682320435780260605909088968782369795432n],
      163115167366171702731397391899782408079n,
      1n,
    ],
    defaultValue: false,
  }), [test_validate_commit_message])
  const { value, isPending } = useContractCall(options)
  console.log(`useTestValidateSignature()`, isPending ? '...' : value)
  return {
    isValidated: value,
    isPending,
  }
}
