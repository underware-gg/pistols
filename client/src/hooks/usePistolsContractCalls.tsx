import { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDelay } from '@underware/pistols-sdk/utils/hooks'
import { useSdkCallPromise, useDojoContractCalls } from '@underware/pistols-sdk/dojo'
import { useChallenge } from '/src/stores/challengeStore'
import { makeCustomEnum } from '@underware/pistols-sdk/starknet'
import { isPositiveBigint, bigintToHex } from '@underware/pistols-sdk/utils'
import { convert_duel_progress } from '@underware/pistols-sdk/pistols'
import { constants } from '@underware/pistols-sdk/pistols/gen'


//------------------------------------------
// game
//

export const useDuelProgress = (duel_id: bigint) => {
  const { game: { getDuelProgress } } = useDojoContractCalls()
  const [forceCounter, setForceCounter] = useState(0)
  // enable when the challenge is finished
  const { isFinished, state } = useChallenge(duel_id)
  const enabled = useDelay(isFinished, 1000) // wait a bit to fetch 1st time...
  // prepare call
  const options = useMemo(() => ({
    call: getDuelProgress,
    args: [bigintToHex(duel_id)],
    enabled,
    defaultValue: null,
    forceCounter,
  }), [duel_id, enabled, forceCounter])
  const { value, isLoading } = useSdkCallPromise<any>(options)
  // retry if result is empty...
  // (the block may take some time to confirm...)
  const success = useMemo(() => (value?.steps != undefined ? (value.steps.length > 0) : undefined), [value])
  useEffect(() => {
    let _mounted = true
    if (success === false) {
      setTimeout(() => {
        if (_mounted) {
          console.log('useDuelProgress() retry...', forceCounter + 1);
          setForceCounter(forceCounter + 1);
        }
      }, 1000);
    }
    return () => {
      _mounted = false
    }
  }, [value])
  // return result when available...
  const duelProgress = useMemo(() => (success === true ? convert_duel_progress(value) : null), [success, value])
  // console.log('duelProgress >>>>', duel_id, isFinished, enabled, state, value, duelProgress)
  return {
    duelProgress,
    isLoading,
  }
}

export const useGetDuelDeck = (duel_id: bigint) => {
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

export const useCalcSeasonReward = (season_id: number, duelist_id: BigNumberish, lives_staked: BigNumberish) => {
  const { bank: { calcSeasonReward } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: calcSeasonReward,
    args: [BigInt(season_id ?? 0), BigInt(duelist_id ?? 0), BigInt(lives_staked ?? 1)],
    enabled: isPositiveBigint(season_id) && isPositiveBigint(duelist_id) && isPositiveBigint(lives_staked),
    defaultValue: null,
  }), [season_id, duelist_id, lives_staked])
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
  return {
    rewards,
    isLoading,
  }
}


export const useCanCollectDuel = (duel_id: bigint) => {
  const { game: { canCollectDuel } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: canCollectDuel,
    args: [duel_id],
    enabled: isPositiveBigint(duel_id),
    defaultValue: null,
  }), [duel_id])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canCollectDuel: value,
    isLoading,
  }
}

export const useCanCollectSeason = () => {
  const { bank: { canCollectSeason } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: canCollectSeason,
    args: [],
    enabled: true,
    defaultValue: null,
  }), [])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canCollectSeason: value,
    isLoading,
  }
}

export const useGameTimestamp = () => {
  const { admin: { getTimestamp } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: getTimestamp,
    args: [],
    enabled: true,
    defaultValue: null,
  }), [])
  const { value, isLoading } = useSdkCallPromise<bigint>(options)
  return {
    timestamp: value,
    isLoading,
  }
}


//------------------------------------------
// matchmaker
//

export const useGetMatchMakerEntryFee = (queue_id: constants.QueueId) => {
  const { matchmaker: { getEntryFee } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: getEntryFee,
    args: [makeCustomEnum(queue_id)],
    enabled: Boolean(queue_id),
    defaultValue: [0n, 0n],
  }), [queue_id])
  const { value, isLoading } = useSdkCallPromise<bigint[]>(options)
  return {
    requiresDuelistEnlistment: (isPositiveBigint(value?.[0] ?? 0) && isPositiveBigint(value?.[1] ?? 0)),
    tokenContractAddress: value?.[0],
    tokenAmount: value?.[1],
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

export const useCanJoin = (season_id: number, duelist_id: BigNumberish) => {
  // const { duel_token: { canJoin } } = useDojoContractCalls()
  // const { address } = useAccount()
  // const options = useMemo(() => ({
  //   call: canJoin,
  //   args: [BigInt(season_id ?? 0), BigInt(duelist_id ?? 0)],
  //   enabled: isPositiveBigint(season_id) && isPositiveBigint(address) && isPositiveBigint(duelist_id),
  //   defaultValue: null,
  // }), [address, season_id, duelist_id])
  // const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canJoin: true,
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
// ring_token
//

export const useHasClaimedRing = (address: BigNumberish, ringType: constants.RingType) => {
  const { ring_token: { hasClaimed } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: hasClaimed,
    args: [address, makeCustomEnum(ringType)],
    enabled: isPositiveBigint(address) && ringType != constants.RingType.Unknown,
    defaultValue: false,
  }), [address, ringType])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    hasClaimed: value,
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

