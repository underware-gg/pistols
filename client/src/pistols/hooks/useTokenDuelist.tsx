import { useEffect, useMemo, useState } from "react"
import { getContractByName } from "@dojoengine/core"
import { useDojo, useDojoComponents } from "@/lib/dojo/DojoContext"
import { bigintToEntity, bigintToHex } from "@/lib/utils/types"
import { useOrigamiERC721BalanceOf, useOrigamiERC721IndexOfOwnerByToken, useOrigamiERC721TokenOfOwnerByIndex, useOrigamiERC721TotalSupply } from "@/lib/dojo/hooks/useOrigamiERC721"
import { BigNumberish } from "starknet"


export const useTokenContract = () => {
  const components = useDojoComponents()
  const [contractAddress, setTokenContractAddress] = useState('')
  const { setup: { manifest } } = useDojo()
  useEffect(() => {
    const contract = getContractByName(manifest, 'token_duelist');
    setTokenContractAddress(contract?.address ?? '')
  }, [])
  const contractAddressKey = useMemo(() => bigintToEntity(contractAddress), [contractAddress])
  return {
    components,
    contractAddress,
    contractAddressKey,
  }
}

export const useDuelistTokenCount = () => {
  const { contractAddress, components } = useTokenContract()
  const { totalSupply } = useOrigamiERC721TotalSupply(contractAddress, components)
  return {
    tokenCount: totalSupply ?? 0,
  }
}

export const useDuelistBalanceOf = (address: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { amount } = useOrigamiERC721BalanceOf(contractAddress, address, components)
  return {
    duelistBalance: amount ?? 0,
  }
}

export const useDuelistOfOwnerByIndex = (address: BigNumberish, index: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { tokenId } = useOrigamiERC721TokenOfOwnerByIndex(contractAddress, address, index, components)
  return {
    duelistId: tokenId,
  }
}

export const useDuelistIndexOfOwner = (address: BigNumberish, token_id: BigNumberish) => {
  const { contractAddress, components } = useTokenContract()
  const { index } = useOrigamiERC721IndexOfOwnerByToken(contractAddress, address, token_id, components)
  return {
    duelistIndex: index,
  }
}


