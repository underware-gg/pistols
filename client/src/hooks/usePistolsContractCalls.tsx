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

export const useCanJoin = (table_id: string) => {
  const { duel_token: { canJoin } } = useDojoContractCalls()
  const { address } = useAccount()
  const options = useMemo(() => ({
    call: canJoin,
    args: [stringToFelt(table_id), BigInt(address ?? 0)],
    enabled: isBigint(address),
    defaultValue: null,
  }), [address])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canJoin: value,
    isLoading
  }
}

export const useCalcFeeDuel = (table_id: string) => {
  const { duel_token: { calcMintFee } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: calcMintFee,
    args: [stringToFelt(table_id)],
    enabled: Boolean(table_id),
    defaultValue: null,
  }), [table_id])
  const { value, isLoading } = useSdkCallPromise<bigint>(options)
  return {
    fee: value,
    isLoading,
  }
}



//------------------------------------------
// pack_token
//

export const useCanClaimWelcomePack = (forceCounter?: number) => {
  const { address } = useAccount()
  const { pack_token: { canClaimWelcomePack } } = useDojoContractCalls()
  const options = useMemo(() => ({
    call: canClaimWelcomePack,
    args: [address],
    enabled: isPositiveBigint(address),
    defaultValue: null,
    forceCounter,
  }), [address, forceCounter])
  const { value, isLoading } = useSdkCallPromise<boolean>(options)
  return {
    canClaimWelcomePack: value,
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
