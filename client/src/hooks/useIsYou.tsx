import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/hooks/SettingsContext'
import { useOwnerOfDuelist } from '@/hooks/useDuelistToken'
import { bigintEquals, isPositiveBigint } from '@underware_gg/pistols-sdk/utils'

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
  const isYou = useMemo(() => (bigintEquals(duelistId, otherDueistId)), [duelistId, otherDueistId])
  return {
    isYou,
    myDuelistId: duelistId,
  }
}

export const useIsMyDuelist = (otherDueistId: BigNumberish) => {
  const { address } = useAccount()
  const { owner } = useOwnerOfDuelist(otherDueistId)
  const isMyDuelist = useMemo(() => ((isPositiveBigint(address) && isPositiveBigint(owner)) ? bigintEquals(address, owner) : undefined), [address, owner])
  return isMyDuelist
}
