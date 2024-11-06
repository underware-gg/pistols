import { useEffect, useState } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSystemCalls } from '@/lib/dojo/DojoContext'
import { useTokenConfig } from '@/pistols/hooks/useConfig'
import { useToriiErc721TokenByOwner } from '@/lib/dojo/hooks/useToriiErcTokens'
import { useERC721OwnerOf } from '@/lib/utils/hooks/useERC721'
import { useDuelistTokenContract } from '@/pistols/hooks/useTokenContract'

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

export const useDuelistsOfOwner = (owner: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { token } = useToriiErc721TokenByOwner(duelistContractAddress, owner, true)
  return {
    duelistBalance: token?.balance ?? 0,
    duelistIds: token?.tokenIds ?? [],
    isPending: false,
  }
}



export const useDuelistCalcPrice = (address: BigNumberish) => {
  const [tokenAddress, setTokenAddress] = useState<boolean>()
  const [amount, setAmount] = useState<boolean>()
  const { duelistBalance } = useDuelistsOfOwner(address)
  const { calc_mint_fee_duelist } = useDojoSystemCalls()
  useEffect(() => {
    if (address && calc_mint_fee_duelist) {
      calc_mint_fee_duelist(BigInt(address)).then(v => {
        setTokenAddress(v[0])
        setAmount(v[1])
      }).catch(e => {
        setTokenAddress(undefined)
        setAmount(undefined)
      })
    } else {
      setTokenAddress(undefined)
      setAmount(undefined)
    }
  }, [address, duelistBalance, calc_mint_fee_duelist])
  return {
    tokenAddress,
    amount,
  }
}

