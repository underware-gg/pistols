import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useTokenContract } from '@/pistols/hooks/useTokenDuelist'
import { useERC721OwnerOf } from '@/lib/utils/hooks/useERC721'
import { bigintEquals, isPositiveBigint } from '@/lib/utils/types'

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
  const { contractAddress } = useTokenContract()
  const { address } = useAccount()
  const { owner } = useERC721OwnerOf(contractAddress, otherDueistId)
  const isMyDuelist = useMemo(() => ((isPositiveBigint(address) && isPositiveBigint(owner)) ? bigintEquals(address, owner) : undefined), [address, owner])
  return isMyDuelist
}
