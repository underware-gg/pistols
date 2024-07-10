import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useTokenContract } from '@/pistols/hooks/useTokenDuelist'
import { useOrigamiERC721OwnerOf } from '@/lib/dojo/hooks/useOrigamiERC721'
import { bigintEquals, isPositiveBigint } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

export const useIsMyAccount = (otherAddress: BigNumberish) => {
  const { address } = useAccount()
  const { isGuest } = useSettings()
  const isMyAccount = useMemo(() => (!isGuest && bigintEquals(address, otherAddress)), [address, otherAddress, isGuest])
  return isMyAccount
}

export const useIsYou = (otherDueistId: BigNumberish) => {
  const { duelistId } = useSettings()
  const isYou = useMemo(() => (bigintEquals(duelistId, otherDueistId)), [duelistId, otherDueistId])
  return isYou
}

export const useIsMyDuelist = (otherDueistId: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { address } = useAccount()
  const { owner } = useOrigamiERC721OwnerOf(contractAddress, otherDueistId, components)
  const isMyDuelist = useMemo(() => ((isPositiveBigint(address) && isPositiveBigint(owner)) ? bigintEquals(address, owner) : undefined), [address, owner])
  return isMyDuelist
}
