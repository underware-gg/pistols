import { useEffect, useMemo, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useTokenConfig } from '@/pistols/stores/tokenConfigStore'
import { useERC721OwnerOf } from '@/lib/utils/hooks/useERC721'
import { useDuelistTokenContract } from '@/pistols/hooks/useTokenContract'
import { useTokenIdsByOwner } from '@/pistols/stores/duelistTokenStore'
import { PROFILE_PIC_COUNT } from '@/pistols/utils/constants'
import { poseidon } from '@/lib/utils/starknet'


export const useDuelistTokenCount = () => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { mintedCount, isPending } = useTokenConfig(duelistContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isPending,
  }
}

export const useOwnerOfDuelist = (token_id: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { owner, isPending } = useERC721OwnerOf(duelistContractAddress, token_id)
  return {
    owner,
    isPending,
  }
}

export const useDuelistsOfPlayer = () => {
  const { address } = useAccount()
  const { duelistContractAddress } = useDuelistTokenContract()
  const { tokenIds } = useTokenIdsByOwner(duelistContractAddress, address)
  return {
    duelistIds: tokenIds,
    isPending: false,
  }
}

export const useDuelistsOfOwner = (owner: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { tokenIds } = useTokenIdsByOwner(duelistContractAddress, owner)
  throw new Error("Not implemented -- need to fetch (once) on the store...")
  return {
    duelistIds: tokenIds,
    isPending: false,
  }
}

export const useNextRandomProfilePic = () => {
  const { address } = useAccount()
  const { duelistIds } = useDuelistsOfPlayer()
  const randomPic = useMemo(() => 
    (Number(poseidon([address ?? 0n, duelistIds.length ?? 0n]) % BigInt(PROFILE_PIC_COUNT)) + 1),
  [address, duelistIds.length])
  return {
    randomPic,
  }
}
