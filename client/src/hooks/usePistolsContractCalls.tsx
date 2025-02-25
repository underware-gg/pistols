import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSdkCallPromise, useDojoContractCalls } from '@underware_gg/pistols-sdk/dojo'
import { isBigint, isPositiveBigint, makeCustomEnum, stringToFelt } from '@underware_gg/pistols-sdk/utils'
import { convert_duel_progress } from '@underware_gg/pistols-sdk/pistols'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { useChallenge } from '/src/stores/challengeStore'


//------------------------------------------
// game
//

export const useDuelProgress = (duel_id: bigint) => {
  const { isFinished } = useChallenge(duel_id)
  const { game: { getDuelProgress } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: getDuelProgress,
    args: [duel_id],
    enabled: isFinished,
    defaultValue: null,
  }), [duel_id, isFinished])
  const { value, isLoading } = useSdkCallPromise<any>(options)
  const duelProgress = useMemo(() => (value ? convert_duel_progress(value) : null), [value])
  return {
    duelProgress,
    isLoading,
  }
}

export const useGetDuelDeck = (duel_id: BigNumberish) => {
  const { game: { getDuelDeck } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: getDuelDeck,
    args: [duel_id],
    enabled: isPositiveBigint(duel_id),
    defaultValue: [],
  }), [duel_id])
  const { value, isLoading } = useSdkCallPromise<BigNumberish[][]>(options)
  const decks = useMemo(() => (value?.map((vo: BigNumberish[]) => vo.map((vi: BigNumberish) => Number(vi))) ?? null), [value])
  return {
    decks,
    isLoading,
  }
}

export type RewardValues = {
  win: {
    // if win...
    fame_gained: bigint
    fools_gained: bigint
    points_scored: number
    position: number

  }, lose: {
    // if lose...
    fame_lost: bigint
    survived: boolean
  }
}

export const useCalcSeasonReward = (table_id: string, duelist_id: BigNumberish, lives_staked: BigNumberish) => {
  const { game: { calcSeasonReward } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: calcSeasonReward,
    args: [stringToFelt(table_id), BigInt(duelist_id ?? 0), BigInt(lives_staked ?? 1)],
    enabled: Boolean(table_id) && isPositiveBigint(duelist_id) && isPositiveBigint(lives_staked),
    defaultValue: null,
  }), [table_id, duelist_id, lives_staked])
  const { value, isLoading } = useSdkCallPromise<any>(options)
  const rewards = useMemo<RewardValues>(() => (value ? {
    win: {
      fame_gained: value.fame_gained,
      fools_gained: value.fools_gained,
      points_scored: Number(value.points_scored),
      position: Number(value.position),
    }, lose: {
      fame_lost: value.fame_lost,
      survived: value.survived,
    }
  } : null), [value])
  console.log(`REWARDS::::`, rewards)
  return {
    rewards,
    isLoading,
  }
}


//------------------------------------------
// tutorial
//

export const useTutorialDuelId = (player_id: BigNumberish, tutorial_id: BigNumberish) => {
  const { tutorial: { calcDuelId } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: calcDuelId,
    args: [player_id, tutorial_id],
    enabled: isPositiveBigint(player_id) && isPositiveBigint(tutorial_id),
    defaultValue: 0n,
  }), [player_id, tutorial_id])
  const { value, isLoading } = useSdkCallPromise<bigint>(options)
  return {
    duelId: value,
    isLoading,
  }
}


//------------------------------------------
// duel_token
//

export const useCanJoin = (table_id: string, duelist_id: BigNumberish) => {
  const { duel_token: { canJoin } } = useDojoContractCalls()
  const { address } = useAccount()
  const options = useMemo(() => ({
    call: canJoin,
    args: [stringToFelt(table_id), BigInt(duelist_id ?? 0)],
    enabled: Boolean(table_id) && isPositiveBigint(address) && isPositiveBigint(duelist_id),
    defaultValue: null,
  }), [address, table_id, duelist_id])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canJoin: value,
    isLoading
  }
}

export const useCalcFeeDuel = (table_id: string) => {
  // const { duel_token: { calcMintFee } } = useDojoContractCalls()
  // const options = useMemo(() => ({
  //   call: calcMintFee,
  //   args: [stringToFelt(table_id)],
  //   enabled: Boolean(table_id),
  //   defaultValue: null,
  // }), [table_id])
  // const { value, isLoading } = useSdkCallPromise<bigint>(options)
  return {
    fee: 0n,
    isLoading: false,
  }
}



//------------------------------------------
// pack_token
//

export const useCanClaimStarterPack = (forceCounter?: number) => {
  const { address } = useAccount()
  const { pack_token: { canClaimStarterPack } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: canClaimStarterPack,
    args: [address],
    enabled: isPositiveBigint(address),
    defaultValue: null,
    forceCounter,
  }), [address, forceCounter])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canClaimStarterPack: value,
    isLoading,
  }
}

export const useCanPurchase = (pack_type: constants.PackType) => {
  const { address } = useAccount()
  const { pack_token: { canPurchase } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: canPurchase,
    args: [address, makeCustomEnum(pack_type)],
    enabled: isPositiveBigint(address) && Boolean(pack_type),
    defaultValue: null,
  }), [address, pack_type])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canPurchase: value,
    isLoading,
  }
}

export const useCalcFeePack = (pack_type: constants.PackType) => {
  const { address } = useAccount()
  const { pack_token: { calcMintFee } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: calcMintFee,
    args: [address, makeCustomEnum(pack_type)],
    enabled: isPositiveBigint(address) && Boolean(pack_type),
    defaultValue: null,
  }), [address, pack_type])
  const { value, isLoading } = useSdkCallPromise<bigint>(options)
  return {
    fee: value,
    isLoading,
  }
}




//------------------------------------------
// admin
//

export const useAdminIsOwner = (address: BigNumberish) => {
  const { admin: { amIAdmin } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: amIAdmin,
    args: [address],
    enabled: isPositiveBigint(address),
  }), [address])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    isOwner: value,
    isLoading,
  }
}

export const useAdminAmIOwner = () => {
  const { address } = useAccount()
  const { isOwner, isLoading } = useAdminIsOwner(address)
  return {
    IAmOwner: isOwner,
    isLoading,
  }
}




//------------------------------------------
// TEST/DEBUG
//
export const useTestValidateSignature = () => {
  const { game: { testValidateCommitMessage } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: testValidateCommitMessage,
    args: [
      '0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a', // account
      [173730084075620862592063244223266966993038958055152214202416930759334968124n, 1417567916191820063020424621516241329682320435780260605909088968782369795432n],
      163115167366171702731397391899782408079n,
      1n,
    ],
    defaultValue: false,
  }), [])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  console.log(`useTestValidateSignature()`, isLoading ? '...' : value)
  return {
    isValidated: value,
    isLoading,
  }
}
