import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useOwnerOfDuelist } from '/src/hooks/useTokenDuelists'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { PLAYER_CHARACTER_ID } from '/src/utils/pistols'
import { isCharacterDuelistId } from '@underware/pistols-sdk/pistols'

export const useIsMyAccount = (otherAddress: BigNumberish) => {
  const { address } = useAccount()
  const isMyAccount = useMemo(() => (bigintEquals(address, otherAddress)), [address, otherAddress])
  return {
    isMyAccount,
    myAcountAddress: address,
  }
}

export const useIsMyDuelist = (otherDuelistId: BigNumberish) => {
  // the tutorial player character is always my duelist
  const isPlayerCharacter = bigintEquals(otherDuelistId ?? 0, PLAYER_CHARACTER_ID)
  const isCharacter = isCharacterDuelistId(otherDuelistId ?? 0)
  // fetch owner only if not a character
  const { address } = useAccount()
  const { owner } = useOwnerOfDuelist(!isCharacter ? otherDuelistId : 0n)
  const isMyDuelist = useMemo(() => (
    isPlayerCharacter ||
    (isPositiveBigint(owner) ? bigintEquals(address, owner) : false)
  ), [address, owner, isPlayerCharacter, otherDuelistId])
  return isMyDuelist
}

export const checkIsDuelistCharacter = (duelistId: BigNumberish) => {
  const isPlayerCharacter = bigintEquals(duelistId ?? 0, PLAYER_CHARACTER_ID)
  const isCharacter = BigInt(duelistId ?? 0) >= constants.PROFILES.CHARACTER_ID_BASE
  return {
    isPlayerCharacter,
    isCharacter,
  }
}
