import { useEffect, useState } from "react"
import { getContractByName } from "@dojoengine/core"
import { useDojo, useDojoSystemCalls } from "@/lib/dojo/DojoContext"
import { useTokenConfig } from "@/pistols/hooks/useConfig"
import { useToriiErc721TokenByOwner } from "@/lib/dojo/hooks/useToriiErcTokens"
import { useERC721OwnerOf } from '@/lib/utils/hooks/useERC721'
import { BigNumberish } from "starknet"

export const useTokenContract = () => {
  const [contractAddress, setTokenContractAddress] = useState(null)
  const { setup: { manifest, nameSpace } } = useDojo()
  useEffect(() => {
    const contract = getContractByName(manifest, nameSpace, 'duelist_token');
    setTokenContractAddress(contract?.address ?? null)
  }, [manifest])
  return {
    contractAddress,
  }
}

export const useDuelistTokenCount = () => {
  const { contractAddress } = useTokenContract()
  const { mintedCount, isPending } = useTokenConfig(contractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isPending,
  }
}

export const useOwnerOfDuelist = (token_id: BigNumberish) => {
  const { contractAddress } = useTokenContract()
  const { owner, isPending } = useERC721OwnerOf(contractAddress, token_id)
  return {
    owner,
    isPending,
  }
}

export const useDuelistsOfOwner = (owner: BigNumberish) => {
  const { contractAddress } = useTokenContract()
  const { token } = useToriiErc721TokenByOwner(contractAddress, owner, true)
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
  const { calc_fee } = useDojoSystemCalls()
  useEffect(() => {
    if (address && calc_fee) {
      calc_fee(BigInt(address)).then(v => {
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
  }, [address, duelistBalance, calc_fee])
  return {
    tokenAddress,
    amount,
  }
}

