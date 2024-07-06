import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useTokenContract } from '@/pistols/hooks/useTokenDuelist'
import { useOrigamiERC721OwnerOf } from '@/lib/dojo/hooks/useOrigamiERC721'
import { bigintEquals } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

export const useIsMyAccount = (otherAddress: BigNumberish) => {
  const { address } = useAccount()
  const { isGuest } = useSettings()
  const isMyAccount = useMemo(() => (!isGuest && bigintEquals(address, otherAddress)), [address, otherAddress, isGuest])
  return isMyAccount
}

export const useIsMyDuelist = (dueistId: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { address } = useAccount()
  const { owner } = useOrigamiERC721OwnerOf(contractAddress, dueistId, components)
  const isMyDuelist = useMemo(() => (bigintEquals(address, owner)), [address, owner])
  return isMyDuelist
}
