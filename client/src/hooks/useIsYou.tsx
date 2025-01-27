import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '/src/hooks/SettingsContext'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { bigintEquals, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'
import { PLAYER_CHARACTER_ID } from '/src/utils/pistols'
import { constants } from '@underware_gg/pistols-sdk/pistols'

export const useIsMyAccount = (otherAddress: BigNumberish) => {
  const { address } = useAccount()
  const isMyAccount = useMemo(() => (bigintEquals(address, otherAddress)), [address, otherAddress])
  return {
    isMyAccount,
    myAcountAddress: address,
  }
}

export const useIsYou = (otherDueistId: BigNumberish) => {
  const { duelistId } = useSettings()
  const isYou = useMemo(() => (
    bigintEquals(otherDueistId ?? 0, PLAYER_CHARACTER_ID) ||
    (isPositiveBigint(otherDueistId) && bigintEquals(otherDueistId, duelistId))
  ), [duelistId, otherDueistId])
  return {
    isYou,
    myDuelistId: duelistId,
  }
}

export const useIsMyDuelist = (otherDueistId: BigNumberish) => {
  // the tutorial player character is always my duelist
  const isPlayerCharacter = bigintEquals(otherDueistId ?? 0, PLAYER_CHARACTER_ID)
  const isCharacter = BigInt(otherDueistId ?? 0) >= constants.PROFILES.CHARACTER_ID_BASE
  // fetch owner onlt if not a character
  const { address } = useAccount()
  const { owner } = useOwnerOfDuelist(!isCharacter ? otherDueistId : 0n)
  const isMyDuelist = useMemo(() => (
    isPlayerCharacter ||
    (isPositiveBigint(owner) ? bigintEquals(address, owner) : false)
  ), [address, owner])
  return isMyDuelist
}
